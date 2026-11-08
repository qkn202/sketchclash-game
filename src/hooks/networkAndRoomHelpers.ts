import type { ChatMessage, DrawAction, DrawStroke, Player, Point } from '../types';
import {
  appendBoundedMessage,
  appendCompactDrawAction,
  stampDrawAction,
  type SharedGameRefs,
  type SharedGameSetters,
} from './gameControllerTypes';
import { recoverPromotedHostSession, type HostRecoveryCallbacks } from './roomSyncHelpers';

const MAX_STROKE_POINTS = 600;
const MAX_SNAPSHOT_CHARS = 1_500_000;
const VALID_TOOLS = new Set(['brush', 'fire', 'ice', 'sparkle', 'bucket', 'eraser']);

function downsamplePoints(points: Point[], maxPoints: number): Point[] {
  if (points.length <= maxPoints) return points;
  const result: Point[] = [points[0]];
  const interiorTarget = maxPoints - 2;
  const step = (points.length - 2) / Math.max(1, interiorTarget);
  for (let i = 0; i < interiorTarget; i++) {
    const idx = Math.min(points.length - 2, 1 + Math.floor(i * step));
    result.push(points[idx]);
  }
  result.push(points[points.length - 1]);
  return result;
}

/**
 * Validate and bound incoming network DrawAction payloads so oversized strokes
 * or malformed Base64 snapshots cannot stall rendering or exhaust memory.
 */
export function sanitizeIncomingDrawAction(raw: DrawAction | null | undefined): DrawAction | null {
  if (!raw || typeof raw !== 'object') return null;

  if (raw.type === 'clear') {
    return {
      type: 'clear',
      drawerId: typeof raw.drawerId === 'string' ? raw.drawerId.slice(0, 80) : undefined,
    };
  }

  if (raw.type === 'restore') {
    if (
      typeof raw.snapshot !== 'string' ||
      !raw.snapshot.startsWith('data:image/') ||
      raw.snapshot.length > MAX_SNAPSHOT_CHARS
    ) {
      return null;
    }
    return {
      type: 'restore',
      snapshot: raw.snapshot,
      drawerId: typeof raw.drawerId === 'string' ? raw.drawerId.slice(0, 80) : undefined,
    };
  }

  if (raw.type === 'fill') {
    const f = raw.fill;
    if (!f || !Number.isFinite(f.x) || !Number.isFinite(f.y) || typeof f.color !== 'string') {
      return null;
    }
    return {
      type: 'fill',
      fill: {
        x: Math.max(-200, Math.min(2000, f.x)),
        y: Math.max(-200, Math.min(2000, f.y)),
        color: f.color.slice(0, 32),
      },
      drawerId: typeof raw.drawerId === 'string' ? raw.drawerId.slice(0, 80) : undefined,
    };
  }

  if (raw.type === 'stroke') {
    const st = raw.stroke;
    if (!st || !Array.isArray(st.points) || st.points.length === 0) return null;
    const validPoints = st.points.filter(
      (pt) => pt && Number.isFinite(pt.x) && Number.isFinite(pt.y)
    );
    if (validPoints.length === 0) return null;

    const boundedStroke: DrawStroke = {
      id: typeof st.id === 'string' ? st.id.slice(0, 80) : `st_${Date.now()}`,
      tool: VALID_TOOLS.has(st.tool) ? st.tool : 'brush',
      color: typeof st.color === 'string' ? st.color.slice(0, 32) : '#000000',
      size: Number.isFinite(st.size) ? Math.max(1, Math.min(64, st.size)) : 6,
      points: downsamplePoints(validPoints, MAX_STROKE_POINTS),
    };

    return {
      type: 'stroke',
      stroke: boundedStroke,
      drawerId: typeof raw.drawerId === 'string' ? raw.drawerId.slice(0, 80) : undefined,
    };
  }

  return null;
}

export function applyIncomingDrawActionToState(
  rawAction: DrawAction,
  r: SharedGameRefs,
  s: SharedGameSetters
): void {
  const clean = sanitizeIncomingDrawAction(rawAction);
  if (!clean) return;

  const activeMode = r.roomConfigRef.current.mode;
  const stamped = stampDrawAction(clean);

  if (activeMode === 'rush_draw') {
    if (stamped.type === 'clear' && !stamped.drawerId) {
      r.opponentDrawActionsRef.current = {};
      s.setOpponentDrawActions({});
      r.myRushDrawActionsRef.current = [];
      s.setMyRushDrawActions([]);
      s.setCanvasResetKey((k) => k + 1);
      return;
    }
    if (stamped.drawerId && stamped.drawerId !== r.currentUserId.current) {
      s.setOpponentDrawActions((prev) => {
        const nextMap = {
          ...prev,
          [stamped.drawerId!]: appendCompactDrawAction(prev[stamped.drawerId!] || [], stamped),
        };
        r.opponentDrawActionsRef.current = nextMap;
        return nextMap;
      });
    }
    return;
  }

  if (stamped.type === 'clear' && !stamped.drawerId) {
    r.myRushDrawActionsRef.current = [];
    s.setMyRushDrawActions([]);
    s.setIncomingDrawActions([]);
    s.setCanvasResetKey((k) => k + 1);
    return;
  }

  s.setMyRushDrawActions((prev) => {
    const next = appendCompactDrawAction(prev, stamped);
    r.myRushDrawActionsRef.current = next;
    return next;
  });
  s.setIncomingDrawActions((prev) => appendCompactDrawAction(prev, stamped));
}

export function applyIncomingCanvasSync(
  targetId: string,
  boardActions: DrawAction[],
  opponentActions: Record<string, DrawAction[]>,
  senderId: string,
  r: SharedGameRefs,
  s: SharedGameSetters
): void {
  if (targetId !== r.currentUserId.current || senderId !== r.hostIdRef.current) return;
  if (r.roomConfigRef.current.mode === 'rush_draw') {
    const myActs = (opponentActions[r.currentUserId.current] || [])
      .map(sanitizeIncomingDrawAction)
      .filter((a): a is NonNullable<typeof a> => a !== null)
      .map(stampDrawAction);
    const others: Record<string, typeof myActs> = {};
    Object.entries(opponentActions).forEach(([pid, acts]) => {
      if (pid !== r.currentUserId.current && Array.isArray(acts)) {
        others[pid] = acts
          .map(sanitizeIncomingDrawAction)
          .filter((a): a is NonNullable<typeof a> => a !== null)
          .map(stampDrawAction);
      }
    });
    r.myRushDrawActionsRef.current = myActs;
    s.setMyRushDrawActions(myActs);
    r.opponentDrawActionsRef.current = others;
    s.setOpponentDrawActions(others);
    s.setCanvasResetKey((k) => k + 1);
  } else if (Array.isArray(boardActions) && boardActions.length > 0) {
    const stampedList = boardActions
      .map(sanitizeIncomingDrawAction)
      .filter((a): a is NonNullable<typeof a> => a !== null)
      .map(stampDrawAction);
    r.myRushDrawActionsRef.current = stampedList;
    s.setMyRushDrawActions(stampedList);
    s.setIncomingDrawActions(stampedList);
    s.setCanvasResetKey((k) => k + 1);
  }
}

export function reconcileOnlinePresenceUpdate(
  onlinePlayers: Player[],
  r: SharedGameRefs,
  s: SharedGameSetters,
  recoveryCb: HostRecoveryCallbacks
): void {
  const prevHostId = r.hostIdRef.current;
  const wasHost = prevHostId === r.currentUserId.current;
  const prev = r.playersRef.current;
  const bots = prev.filter((p) => p.isBot);

  const activeHumans = onlinePlayers
    .filter((op) => !op.isBot)
    .map((op) => {
      const existing = prev.find((p) => p.id === op.id);
      return {
        ...op,
        score: existing?.score ?? op.score ?? 0,
        isDrawer: existing?.isDrawer ?? op.isDrawer ?? false,
        hasGuessed: existing?.hasGuessed ?? op.hasGuessed ?? false,
        isLoneGuesser: existing?.isLoneGuesser ?? op.isLoneGuesser ?? false,
        secretWord: existing?.secretWord,
        solvedOpponentIds: existing?.solvedOpponentIds ?? [],
        solvedByPlayerIds: existing?.solvedByPlayerIds ?? [],
        joinedAt: existing?.joinedAt ?? op.joinedAt ?? Date.now(),
      };
    });

  const compareTenure = (a: Player, b: Player) =>
    (a.joinedAt ?? Number.MAX_SAFE_INTEGER) - (b.joinedAt ?? Number.MAX_SAFE_INTEGER) ||
    a.id.localeCompare(b.id);

  const claimedHosts = activeHumans.filter((h) => h.isHost);
  if (activeHumans.length > 0) {
    if (claimedHosts.length === 0) {
      activeHumans.sort(compareTenure);
      activeHumans.forEach((player, index) => {
        player.isHost = index === 0;
      });
    } else if (claimedHosts.length > 1) {
      const sortedClaimants = [...claimedHosts].sort(compareTenure);
      const trueHostId = sortedClaimants[0].id;
      activeHumans.forEach((player) => {
        player.isHost = player.id === trueHostId;
      });
    }
    const elected = activeHumans.find((h) => h.isHost) || activeHumans[0];
    r.hostIdRef.current = elected.id;

    const myUpdated = activeHumans.find((h) => h.id === r.currentUserId.current);
    if (myUpdated && myUpdated.isHost !== wasHost) {
      r.roomServiceRef.current?.updatePresencePlayer(myUpdated);
    }
  }

  const updated = [...activeHumans, ...bots];
  const departedHumanIds = prev
    .filter((p) => !p.isBot && !activeHumans.some((h) => h.id === p.id))
    .map((p) => p.id);
  r.playersRef.current = updated;
  s.setPlayers(updated);

  if (
    r.hostIdRef.current &&
    r.hostIdRef.current !== prevHostId &&
    r.hostIdRef.current !== r.currentUserId.current &&
    (r.phaseRef.current === 'drawing' || r.phaseRef.current === 'selecting_word') &&
    r.currentWordRef.current
  ) {
    r.roomServiceRef.current?.sendDrawerWordBackup(r.hostIdRef.current, r.currentWordRef.current);
  }

  if (r.currentUserId.current === r.hostIdRef.current) {
    if (!wasHost && prevHostId && prevHostId !== r.currentUserId.current) {
      recoverPromotedHostSession(r, s, recoveryCb);
    }

    setTimeout(() => {
      const cfg = r.roomConfigRef.current;
      s.broadcastGameState({
        phase: r.phaseRef.current,
        round: r.roundRef.current,
        drawTime: cfg.drawTime,
        totalRounds: cfg.totalRounds,
        language: cfg.language,
        maxPlayers: cfg.maxPlayers,
        customWordsCount: cfg.customWords.length,
        mode: cfg.mode,
        players: r.playersRef.current,
      });

      const activeDrawerMissing =
        cfg.mode !== 'rush_draw' &&
        r.currentDrawerIdRef.current &&
        !r.playersRef.current.some((p) => p.id === r.currentDrawerIdRef.current);

      if (activeDrawerMissing) {
        if (r.phaseRef.current === 'selecting_word') {
          recoveryCb.handleSkipDrawer();
        } else if (r.phaseRef.current === 'drawing') {
          recoveryCb.handleRoundEnd();
        }
      }
      if (wasHost) {
        departedHumanIds.forEach((id) => recoveryCb.onPartyPlayerRemoved?.(id));
      }
    }, 20);
  }
}

export interface RemovePlayerCallbacks {
  handleSkipDrawer: () => void;
  handleRoundEnd: () => void;
  handlePlayAgain: (returnToWaitingRoom: boolean) => void;
  onPartyPlayerRemoved?: (removedId: string) => void;
}

/**
 * Host action to remove an AI Bot or kick an AFK player safely in WaitingRoom or mid-match.
 */
export function removePlayerFromRoom(
  targetId: string,
  r: SharedGameRefs,
  s: SharedGameSetters,
  cb: RemovePlayerCallbacks
): void {
  if (r.currentUserId.current !== r.hostIdRef.current) return;
  if (!targetId || targetId === r.currentUserId.current) return;

  const prev = r.playersRef.current;
  const target = prev.find((p) => p.id === targetId);
  if (!target) return;

  if (!target.isBot) {
    r.roomServiceRef.current?.kickPlayer(targetId);
  }

  const updated = prev.filter((p) => p.id !== targetId);
  r.playersRef.current = updated;
  s.setPlayers(updated);

  r.rushChoicesMapRef.current.delete(targetId);
  r.rushPickedWordsRef.current.delete(targetId);
  r.pendingWordBackupsRef.current.delete(targetId);

  if (r.opponentDrawActionsRef.current[targetId]) {
    s.setOpponentDrawActions((prevMap) => {
      const copy = { ...prevMap };
      delete copy[targetId];
      r.opponentDrawActionsRef.current = copy;
      return copy;
    });
  }

  const sysMsg: ChatMessage = {
    id: `rm_${Date.now()}_${targetId}`,
    text: target.isBot
      ? `🪄 Chủ phòng đã thu hồi Pháp sư AI ${target.name} khỏi sảnh.`
      : `🏰 Chủ phòng đã mời ${target.name} rời sảnh thi đấu.`,
    type: 'system',
    timestamp: Date.now(),
  };
  s.setMessages((m) => appendBoundedMessage(m, sysMsg));
  r.roomServiceRef.current?.broadcastChat(sysMsg);
  s.broadcastGameState({ players: updated });

  const phase = r.phaseRef.current;
  if (phase === 'selecting_word' || phase === 'drawing' || phase === 'round_end') {
    const minKeep = r.roomConfigRef.current.mode === 'polyjuice_impostor' ? 3 : 2;
    if (updated.length < minKeep) {
      s.setNoticeToast(`Cần tối thiểu ${minKeep} phù thủy để tiếp tục — đã quay về Phòng Chờ.`);
      cb.handlePlayAgain(true);
      return;
    }

    const cfg = r.roomConfigRef.current;
    if (cfg.mode === 'rush_draw') {
      if (phase === 'selecting_word') {
        const allHumansPicked = updated
          .filter((p) => !p.isBot)
          .every((h) => r.rushPickedWordsRef.current.has(h.id));
        if (allHumansPicked) {
          cb.handleSkipDrawer();
        }
      }
      return;
    }

    const anyDrawerAlive = updated.some((p) => p.isDrawer);
    if (r.currentDrawerIdRef.current === targetId || !anyDrawerAlive) {
      if (phase === 'selecting_word') {
        cb.handleSkipDrawer();
      } else if (phase === 'drawing') {
        cb.handleRoundEnd();
      }
    }
    return;
  }

  cb.onPartyPlayerRemoved?.(targetId);
}
