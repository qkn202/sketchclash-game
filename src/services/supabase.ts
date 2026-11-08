import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { Player, DrawAction, ChatMessage, GameState, PartyNetworkEvent, PartyPrivatePayload } from '../types';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
const DECOMMISSIONED_HOSTS = ['your-project.supabase.co', 'fxucyrofcsuqtlkukcrx.supabase.co'];
const HAS_REMOTE_SUPABASE = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && !DECOMMISSIONED_HOSTS.some((host) => SUPABASE_URL.includes(host))
);

const LOCAL_HEARTBEAT_INTERVAL_MS = 4000;
const LOCAL_PEER_STALE_MS = 11000;

let supabaseInstance: SupabaseClient | null = null;
let supabasePromise: Promise<SupabaseClient | null> | null = null;
/**
 * Supabase realtime cooldown (finding #6). A single transient channel error
 * (CHANNEL_ERROR / TIMED_OUT / a failed module import) used to set a permanent
 * module-level latch, killing cloud sync for the whole tab until reload. Now
 * we retry after a bounded cooldown instead — local BroadcastChannel still works
 * in the meantime, and remote sync resumes without a reload once the network
 * recovers.
 */
const REMOTE_RETRY_COOLDOWN_MS = 60_000;
let remoteUnavailableUntil = 0;
const isRemoteUnavailable = (): boolean => Date.now() < remoteUnavailableUntil;

/**
 * Dynamically import and initialize @supabase/supabase-js only when valid
 * VITE_SUPABASE_* env vars exist, keeping offline/local bundle lightweight.
 */
export async function loadSupabase(): Promise<SupabaseClient | null> {
  if (!HAS_REMOTE_SUPABASE || isRemoteUnavailable()) return null;
  if (supabaseInstance) return supabaseInstance;
  if (!supabasePromise) {
    supabasePromise = import('@supabase/supabase-js')
      .then(({ createClient }) => {
        supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          realtime: { params: { eventsPerSecond: 30 } },
        });
        return supabaseInstance;
      })
      .catch(() => {
        // Bounded cooldown, not a permanent latch: a module import that fails once
        // (e.g. transient network at first load) can still be retried later.
        remoteUnavailableUntil = Date.now() + REMOTE_RETRY_COOLDOWN_MS;
        supabaseInstance = null;
        supabasePromise = null;
        return null;
      });
  }
  return supabasePromise;
}

export interface RoomSubscriptionCallbacks {
  onDrawAction: (action: DrawAction) => void;
  onChatMessage: (message: ChatMessage) => void;
  onGameStateSync: (state: Partial<GameState>, senderId: string) => void;
  onPlayersUpdate: (players: Player[]) => void;
  onRequestGameState?: (requesterId: string) => void;
  onGuessRequest?: (playerId: string, text: string, targetOpponentId?: string) => void;
  onWordSelectionRequest?: (playerId: string, word: string) => void;
  onPrivateWord?: (targetId: string, word: string, senderId: string) => void;
  onPrivateChoices?: (targetId: string, choices: string[], senderId: string) => void;
  onSolvedWord?: (targetId: string, opponentId: string, word: string, senderId: string) => void;
  onPrivateChat?: (targetId: string, message: ChatMessage, senderId: string) => void;
  onCanvasSync?: (
    targetId: string,
    boardActions: DrawAction[],
    opponentActions: Record<string, DrawAction[]>,
    senderId: string
  ) => void;
  onDrawerWordBackup?: (targetHostId: string, word: string, senderId: string) => void;
  onPartyEvent?: (event: PartyNetworkEvent, senderId: string) => void;
  onPartyPrivate?: (targetId: string, data: PartyPrivatePayload, senderId: string) => void;
  onRoomFull?: () => void;
  onPlayerKicked?: (senderId: string) => void;
}

interface Envelope<T> {
  _eid: string;
  senderId: string;
  payload: T;
}

/**
 * Public projection of a Player for Supabase *presence* payloads. Presence state
 * is delivered to every member of the channel, so it must never carry secret
 * per-player fields (secretWord / wordChoices / solved sets) — those only travel
 * via the targeted private_word / party_private channels. Kept intentionally
 * minimal and stable.
 */
function publicPresencePlayer(p: Player): Player {
  const { secretWord, wordChoices, solvedOpponentIds, solvedByPlayerIds, ...pub } = p;
  return pub;
}

/**
 * Dual-transport realtime room service:
 * 1. Remote Supabase Realtime (lazy-loaded when VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY are configured)
 * 2. Zero-latency Browser BroadcastChannel mesh with heartbeat-backed local presence & state sync
 */
export class RealtimeRoomService {
  private channel: RealtimeChannel | null = null;
  private localChannel: BroadcastChannel | null = null;
  private roomCode: string;
  private roomToken?: string;
  private player: Player;
  private callbacks: RoomSubscriptionCallbacks;
  private maxPlayers: number;
  private processedEventIds: Set<string> = new Set();
  private maxHistory: number = 250;
  private remotePeers: Map<string, Player> = new Map();
  private localPeers: Map<string, Player> = new Map();
  private localPeerLastSeen: Map<string, number> = new Map();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private unloadHandler: (() => void) | null = null;
  private disposed: boolean = false;

  constructor(
    roomCode: string,
    player: Player,
    callbacks: RoomSubscriptionCallbacks,
    maxPlayers: number = 20,
    roomToken?: string
  ) {
    this.roomCode = roomCode.toUpperCase();
    this.roomToken = roomToken?.trim() ? roomToken.trim() : undefined;
    this.player = player;
    this.callbacks = callbacks;
    this.maxPlayers = Math.max(1, Math.min(20, maxPlayers));
    this.localPeers.set(player.id, player);
    this.localPeerLastSeen.set(player.id, Date.now());
  }

  public setMaxPlayers(limit: number): void {
    this.maxPlayers = Math.max(1, Math.min(20, limit));
  }

  private isDuplicate(eid?: string): boolean {
    if (!eid) return false;
    if (this.processedEventIds.has(eid)) return true;
    this.processedEventIds.add(eid);
    if (this.processedEventIds.size > this.maxHistory) {
      const first = this.processedEventIds.values().next().value;
      if (first) this.processedEventIds.delete(first);
    }
    return false;
  }

  private emitMergedPresence(): void {
    const merged = new Map<string, Player>();
    this.remotePeers.forEach((p) => merged.set(p.id, p));
    this.localPeers.forEach((p) => merged.set(p.id, p));
    merged.set(this.player.id, this.player);
    this.callbacks.onPlayersUpdate(Array.from(merged.values()));
  }

  private sendEnvelope<T>(eventName: string, payload: T, localOnly: boolean = false): void {
    const eid = `${eventName}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.processedEventIds.add(eid);
    const env: Envelope<T> = {
      _eid: eid,
      senderId: this.player.id,
      payload,
    };

    if (!localOnly && this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: eventName,
        payload: env,
      }).catch(() => {});
    }
    if (this.localChannel) {
      try {
        this.localChannel.postMessage({ type: eventName, env });
      } catch {
        // Ignore closed channel errors
      }
    }
  }

  private dispatchIncomingEvent(type: string, env: Envelope<any>, fromLocal: boolean = false): void {
    if (!env || env.senderId === this.player.id) return;
    if (fromLocal) {
      this.localPeerLastSeen.set(env.senderId, Date.now());
    }
    if (this.isDuplicate(env._eid)) return;

    if (type === 'presence_ping') {
      const incoming = env.payload?.player as Player | undefined;
      if (incoming && !this.localPeers.has(incoming.id)) {
        const currentTotal = new Set([
          ...this.remotePeers.keys(),
          ...this.localPeers.keys(),
          this.player.id,
        ]);
        if (currentTotal.size < this.maxPlayers) {
          this.localPeers.set(incoming.id, incoming);
          this.localPeerLastSeen.set(incoming.id, Date.now());
          this.emitMergedPresence();
        }
      }
      return;
    }

    if (type === 'draw_action') {
      this.callbacks.onDrawAction(env.payload as DrawAction);
    } else if (type === 'chat_message') {
      this.callbacks.onChatMessage(env.payload as ChatMessage);
    } else if (type === 'game_state_sync') {
      this.callbacks.onGameStateSync(env.payload as Partial<GameState>, env.senderId);
    } else if (type === 'guess_request') {
      this.callbacks.onGuessRequest?.(env.senderId, env.payload.text, env.payload.targetOpponentId);
    } else if (type === 'word_selection') {
      this.callbacks.onWordSelectionRequest?.(env.senderId, env.payload.word);
    } else if (type === 'private_word' && env.payload.targetId === this.player.id) {
      this.callbacks.onPrivateWord?.(env.payload.targetId, env.payload.word, env.senderId);
    } else if (type === 'private_choices' && env.payload.targetId === this.player.id) {
      this.callbacks.onPrivateChoices?.(env.payload.targetId, env.payload.choices, env.senderId);
    } else if (type === 'solved_word' && env.payload.targetId === this.player.id) {
      this.callbacks.onSolvedWord?.(
        env.payload.targetId,
        env.payload.opponentId,
        env.payload.word,
        env.senderId
      );
    } else if (type === 'private_chat' && env.payload.targetId === this.player.id) {
      this.callbacks.onPrivateChat?.(env.payload.targetId, env.payload.message as ChatMessage, env.senderId);
    } else if (type === 'canvas_sync' && env.payload.targetId === this.player.id) {
      this.callbacks.onCanvasSync?.(
        env.payload.targetId,
        (env.payload.boardActions || []) as DrawAction[],
        (env.payload.opponentActions || {}) as Record<string, DrawAction[]>,
        env.senderId
      );
    } else if (type === 'drawer_word_backup' && env.payload.targetHostId === this.player.id) {
      this.callbacks.onDrawerWordBackup?.(env.payload.targetHostId, env.payload.word as string, env.senderId);
    } else if (type === 'party_event' && env.payload) {
      this.callbacks.onPartyEvent?.(env.payload as PartyNetworkEvent, env.senderId);
    } else if (type === 'party_private' && env.payload?.targetId === this.player.id) {
      this.callbacks.onPartyPrivate?.(
        env.payload.targetId,
        env.payload.data as PartyPrivatePayload,
        env.senderId
      );
    } else if (type === 'request_state') {
      this.callbacks.onRequestGameState?.(env.payload.requesterId);
    } else if (type === 'presence_join') {
      const incoming = env.payload.player as Player;
      if (!incoming) return;
      const currentTotal = new Set([
        ...this.remotePeers.keys(),
        ...this.localPeers.keys(),
        this.player.id,
      ]);
      if (!currentTotal.has(incoming.id) && currentTotal.size >= this.maxPlayers) {
        this.sendEnvelope('room_full_notice', { targetId: incoming.id });
        return;
      }
      this.localPeers.set(incoming.id, incoming);
      this.localPeerLastSeen.set(incoming.id, Date.now());
      this.emitMergedPresence();
      this.sendEnvelope('presence_ack', { player: publicPresencePlayer(this.player) });
    } else if (type === 'presence_ack' || type === 'presence_update') {
      const incoming = env.payload.player as Player;
      if (incoming) {
        this.localPeers.set(incoming.id, incoming);
        this.localPeerLastSeen.set(incoming.id, Date.now());
        this.emitMergedPresence();
      }
    } else if (type === 'presence_leave') {
      const leftId = env.payload.playerId as string;
      this.localPeerLastSeen.delete(leftId);
      if (leftId && this.localPeers.delete(leftId)) {
        this.emitMergedPresence();
      }
    } else if (type === 'room_full_notice' && env.payload.targetId === this.player.id) {
      this.callbacks.onRoomFull?.();
      this.disconnect();
    } else if (type === 'player_kicked' && env.payload.targetId === this.player.id) {
      this.callbacks.onPlayerKicked?.(env.senderId);
    }
  }

  public connect(): void {
    this.disposed = false;
    // Local same-device channel: keyed by room code only (trusted, not remotely
    // enumerable — two tabs on one machine must meet on a known name).
    const localName = `sketchclash_room_${this.roomCode}`;
    // Remote Supabase channel: fold in the room token when present so a stranger
    // who knows only the (wide) code cannot reach the room (finding #3). Legacy
    // open rooms (no token) keep the plain code-keyed name for backward
    // compatibility.
    const remoteName = this.roomToken
      ? `sketchclash_room_${this.roomCode}_${this.roomToken}`
      : localName;

    // 1. Browser BroadcastChannel (Zero-latency local multi-tab presence + heartbeat sync)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.localChannel = new BroadcastChannel(`local_${localName}`);
        this.localChannel.onmessage = (event) => {
          const data = event.data as { type: string; env: Envelope<any> };
          if (data?.type && data?.env) {
            this.dispatchIncomingEvent(data.type, data.env, true);
          }
        };

        let hasLeft = false;
        this.unloadHandler = () => {
          if (hasLeft) return;
          hasLeft = true;
          this.sendEnvelope('presence_leave', { playerId: this.player.id });
        };
        window.addEventListener('beforeunload', this.unloadHandler);
        window.addEventListener('pagehide', this.unloadHandler);

        this.heartbeatTimer = setInterval(() => {
          if (this.disposed || !this.localChannel) return;
          this.sendEnvelope('presence_ping', { player: publicPresencePlayer(this.player) }, true);
          const now = Date.now();
          let pruned = false;
          for (const peerId of Array.from(this.localPeers.keys())) {
            if (peerId === this.player.id) continue;
            const lastSeen = this.localPeerLastSeen.get(peerId) ?? now;
            if (now - lastSeen > LOCAL_PEER_STALE_MS) {
              this.localPeers.delete(peerId);
              this.localPeerLastSeen.delete(peerId);
              pruned = true;
            }
          }
          if (pruned) {
            this.emitMergedPresence();
          }
        }, LOCAL_HEARTBEAT_INTERVAL_MS);

        this.sendEnvelope('presence_join', { player: publicPresencePlayer(this.player) });
        this.emitMergedPresence();
        setTimeout(() => {
          if (!this.disposed && this.localChannel) {
            this.requestGameState();
          }
        }, 60);
      } catch {
        // BroadcastChannel unavailable in restricted context
      }
    }

    // 2. Remote Supabase Realtime Channel (dynamically imported only when configured).
    // isRemoteUnavailable() is a time-based cooldown, so after a transient error we
    // retry on a later connect instead of latching out permanently.
    if (HAS_REMOTE_SUPABASE && !isRemoteUnavailable()) {
      void this.connectRemoteChannel(remoteName);
    }
  }

  private async connectRemoteChannel(chanName: string): Promise<void> {
    const sb = await loadSupabase();
    if (!sb || this.disposed) return;

    const chan = sb.channel(chanName, {
      config: {
        broadcast: { self: false },
        presence: { key: this.player.id },
      },
    });
    this.channel = chan;

    const events = [
      'draw_action', 'chat_message', 'game_state_sync', 'guess_request',
      'word_selection', 'private_word', 'private_choices', 'solved_word',
      'private_chat', 'canvas_sync', 'drawer_word_backup', 'party_event',
      'party_private', 'request_state', 'presence_update', 'room_full_notice',
      'player_kicked',
    ];

    events.forEach((evt) => {
      chan.on('broadcast', { event: evt }, (event) => {
        const env = event.payload as Envelope<any>;
        if (env) this.dispatchIncomingEvent(evt, env, false);
      });
    });

    chan
      .on('presence', { event: 'sync' }, () => {
        if (!this.channel || this.disposed) return;
        const presenceState = this.channel.presenceState();
        this.remotePeers.clear();
        Object.values(presenceState).forEach((presences) => {
          (presences as unknown as { player: Player }[]).forEach((item) => {
            if (item.player) {
              this.remotePeers.set(item.player.id, item.player);
            }
          });
        });
        this.emitMergedPresence();
      })
      .subscribe(async (status) => {
        if (this.disposed) return;
        if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && this.channel) {
          // Bounded cooldown, not a permanent latch: cloud sync pauses for
          // REMOTE_RETRY_COOLDOWN_MS, then the next connect() re-attempts. Local
          // BroadcastChannel continues in the meantime; no reload required.
          remoteUnavailableUntil = Date.now() + REMOTE_RETRY_COOLDOWN_MS;
          const broken = this.channel;
          this.channel = null;
          sb.removeChannel(broken).catch(() => {});
          sb.realtime.disconnect();
          return;
        }
        if (status === 'SUBSCRIBED' && this.channel) {
          const occupied = Object.values(this.channel.presenceState()).reduce(
            (count, presences) => count + (presences as unknown[]).length,
            0
          );
          if (occupied >= this.maxPlayers) {
            this.callbacks.onRoomFull?.();
            this.channel.unsubscribe().catch(() => {});
            return;
          }
          await this.channel.track({ player: publicPresencePlayer(this.player) });
          this.requestGameState();
        }
      });
  }

  public updatePresencePlayer(updatedPlayer: Player): void {
    this.player = updatedPlayer;
    this.localPeers.set(updatedPlayer.id, updatedPlayer);
    this.localPeerLastSeen.set(updatedPlayer.id, Date.now());
    // Ship a public projection: presence_update reaches every Supabase channel
    // member, so secret per-player fields must not ride in it. Local peers keep
    // the full object (trusted same-device tabs) via localPeers above.
    this.sendEnvelope('presence_update', { player: publicPresencePlayer(updatedPlayer) });
    if (this.channel) {
      this.channel.track({ player: publicPresencePlayer(updatedPlayer) }).catch(() => {});
    }
  }

  public kickPlayer(targetId: string): void {
    this.sendEnvelope('player_kicked', { targetId });
  }

  public requestGameState(): void {
    this.sendEnvelope('request_state', { requesterId: this.player.id });
  }

  public broadcastDraw(action: DrawAction): void {
    this.sendEnvelope('draw_action', action);
  }

  public broadcastChat(message: ChatMessage): void {
    this.sendEnvelope('chat_message', message);
  }

  public broadcastGameState(state: Partial<GameState>): void {
    this.sendEnvelope('game_state_sync', state);
  }

  public submitGuess(text: string, targetOpponentId?: string): void {
    this.sendEnvelope('guess_request', { text, targetOpponentId });
  }

  public submitWordSelection(word: string): void {
    this.sendEnvelope('word_selection', { word });
  }

  public sendPrivateWord(targetId: string, word: string): void {
    this.sendEnvelope('private_word', { targetId, word });
  }

  public sendPrivateChoices(targetId: string, choices: string[]): void {
    this.sendEnvelope('private_choices', { targetId, choices });
  }

  public sendSolvedWord(targetId: string, opponentId: string, word: string): void {
    this.sendEnvelope('solved_word', { targetId, opponentId, word });
  }

  public sendPrivateChat(targetId: string, message: ChatMessage): void {
    this.sendEnvelope('private_chat', { targetId, message });
  }

  public sendCanvasSync(
    targetId: string,
    boardActions: DrawAction[],
    opponentActions: Record<string, DrawAction[]>
  ): void {
    this.sendEnvelope('canvas_sync', { targetId, boardActions, opponentActions });
  }

  public sendDrawerWordBackup(targetHostId: string, word: string): void {
    this.sendEnvelope('drawer_word_backup', { targetHostId, word });
  }

  public sendPartyEvent(event: PartyNetworkEvent): void {
    this.sendEnvelope('party_event', event);
  }

  public sendPartyPrivate(targetId: string, data: PartyPrivatePayload): void {
    this.sendEnvelope('party_private', { targetId, data });
  }

  public disconnect(): void {
    this.disposed = true;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (typeof window !== 'undefined' && this.unloadHandler) {
      window.removeEventListener('beforeunload', this.unloadHandler);
      window.removeEventListener('pagehide', this.unloadHandler);
      this.unloadHandler = null;
    }
    this.sendEnvelope('presence_leave', { playerId: this.player.id });
    if (this.channel) {
      this.channel.untrack().catch(() => {});
      this.channel.unsubscribe().catch(() => {});
      this.channel = null;
    }
    if (this.localChannel) {
      this.localChannel.close();
      this.localChannel = null;
    }
    this.remotePeers.clear();
    this.localPeers.clear();
    this.localPeerLastSeen.clear();
  }
}
