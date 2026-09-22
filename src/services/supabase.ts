import { createClient, type SupabaseClient, type RealtimeChannel } from '@supabase/supabase-js';
import type { Player, DrawAction, ChatMessage, GameState } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fxucyrofcsuqtlkukcrx.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zEiG2Py5kDmGhkTgw0uWIA_We0rOCGu';

let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 30,
        },
      },
    });
  }
  return supabase;
}

export interface RoomSubscriptionCallbacks {
  onDrawAction: (action: DrawAction) => void;
  onChatMessage: (message: ChatMessage) => void;
  onGameStateSync: (state: Partial<GameState>) => void;
  onPlayersUpdate: (players: Player[]) => void;
  onRequestGameState?: () => void;
}

interface Envelope<T> {
  _eid: string;
  senderId: string;
  payload: T;
}

export class RealtimeRoomService {
  private channel: RealtimeChannel | null = null;
  private localChannel: BroadcastChannel | null = null;
  private roomCode: string;
  private player: Player;
  private callbacks: RoomSubscriptionCallbacks;
  private processedEventIds: Set<string> = new Set();
  private maxHistory: number = 150;

  constructor(roomCode: string, player: Player, callbacks: RoomSubscriptionCallbacks) {
    this.roomCode = roomCode.toUpperCase();
    this.player = player;
    this.callbacks = callbacks;
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

  public connect(): void {
    const sb = getSupabase();
    const chanName = `sketchclash_room_${this.roomCode}`;

    // 1. Supabase Realtime Channel
    this.channel = sb.channel(chanName, {
      config: {
        broadcast: { self: false },
        presence: { key: this.player.id },
      },
    });

    this.channel
      .on('broadcast', { event: 'draw_action' }, (event) => {
        const env = event.payload as Envelope<DrawAction>;
        if (env && !this.isDuplicate(env._eid)) {
          this.callbacks.onDrawAction(env.payload);
        }
      })
      .on('broadcast', { event: 'chat_message' }, (event) => {
        const env = event.payload as Envelope<ChatMessage>;
        if (env && !this.isDuplicate(env._eid)) {
          this.callbacks.onChatMessage(env.payload);
        }
      })
      .on('broadcast', { event: 'game_state_sync' }, (event) => {
        const env = event.payload as Envelope<Partial<GameState>>;
        if (env && !this.isDuplicate(env._eid)) {
          this.callbacks.onGameStateSync(env.payload);
        }
      })
      .on('broadcast', { event: 'request_state' }, (event) => {
        const env = event.payload as Envelope<{ requesterId: string }>;
        if (env && env.senderId !== this.player.id && this.callbacks.onRequestGameState) {
          this.callbacks.onRequestGameState();
        }
      })
      .on('presence', { event: 'sync' }, () => {
        if (!this.channel) return;
        const presenceState = this.channel.presenceState();
        const onlinePlayers: Player[] = [];

        Object.values(presenceState).forEach((presences) => {
          (presences as unknown as { player: Player }[]).forEach((item) => {
            if (item.player) {
              onlinePlayers.push(item.player);
            }
          });
        });

        this.callbacks.onPlayersUpdate(onlinePlayers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && this.channel) {
          await this.channel.track({ player: this.player });
          // Request initial game state from host if joining
          this.requestGameState();
        }
      });

    // 2. Browser BroadcastChannel (Instant zero-latency tab-to-tab fallback)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.localChannel = new BroadcastChannel(`local_${chanName}`);
        this.localChannel.onmessage = (event) => {
          const { type, env } = event.data as { type: string; env: Envelope<any> };
          if (!env || env.senderId === this.player.id) return;
          if (this.isDuplicate(env._eid)) return;

          if (type === 'draw_action') {
            this.callbacks.onDrawAction(env.payload);
          } else if (type === 'chat_message') {
            this.callbacks.onChatMessage(env.payload);
          } else if (type === 'game_state_sync') {
            this.callbacks.onGameStateSync(env.payload);
          } else if (type === 'request_state') {
            this.callbacks.onRequestGameState?.();
          }
        };
      } catch {
        // BroadcastChannel optional fallback
      }
    }
  }

  public updatePresencePlayer(updatedPlayer: Player): void {
    this.player = updatedPlayer;
    if (this.channel) {
      this.channel.track({ player: updatedPlayer }).catch(() => {});
    }
  }

  public requestGameState(): void {
    const env: Envelope<{ requesterId: string }> = {
      _eid: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderId: this.player.id,
      payload: { requesterId: this.player.id },
    };
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'request_state',
        payload: env,
      });
    }
    if (this.localChannel) {
      this.localChannel.postMessage({ type: 'request_state', env });
    }
  }

  public broadcastDraw(action: DrawAction): void {
    const eid = `draw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.processedEventIds.add(eid);
    const env: Envelope<DrawAction> = {
      _eid: eid,
      senderId: this.player.id,
      payload: action,
    };

    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'draw_action',
        payload: env,
      });
    }
    if (this.localChannel) {
      this.localChannel.postMessage({ type: 'draw_action', env });
    }
  }

  public broadcastChat(message: ChatMessage): void {
    const eid = `chat_${message.id || Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.processedEventIds.add(eid);
    const env: Envelope<ChatMessage> = {
      _eid: eid,
      senderId: this.player.id,
      payload: message,
    };

    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'chat_message',
        payload: env,
      });
    }
    if (this.localChannel) {
      this.localChannel.postMessage({ type: 'chat_message', env });
    }
  }

  public broadcastGameState(state: Partial<GameState>): void {
    const eid = `state_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.processedEventIds.add(eid);
    const env: Envelope<Partial<GameState>> = {
      _eid: eid,
      senderId: this.player.id,
      payload: state,
    };

    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'game_state_sync',
        payload: env,
      });
    }
    if (this.localChannel) {
      this.localChannel.postMessage({ type: 'game_state_sync', env });
    }
  }

  public disconnect(): void {
    if (this.channel) {
      this.channel.untrack().catch(() => {});
      this.channel.unsubscribe().catch(() => {});
      this.channel = null;
    }
    if (this.localChannel) {
      this.localChannel.close();
      this.localChannel = null;
    }
  }
}
