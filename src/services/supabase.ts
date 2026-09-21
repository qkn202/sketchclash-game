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
}

export class RealtimeRoomService {
  private channel: RealtimeChannel | null = null;
  private localChannel: BroadcastChannel | null = null;
  private roomCode: string;
  private player: Player;
  private callbacks: RoomSubscriptionCallbacks;

  constructor(roomCode: string, player: Player, callbacks: RoomSubscriptionCallbacks) {
    this.roomCode = roomCode.toUpperCase();
    this.player = player;
    this.callbacks = callbacks;
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
      .on('broadcast', { event: 'draw_action' }, (payload) => {
        if (payload.payload) {
          this.callbacks.onDrawAction(payload.payload as DrawAction);
        }
      })
      .on('broadcast', { event: 'chat_message' }, (payload) => {
        if (payload.payload) {
          this.callbacks.onChatMessage(payload.payload as ChatMessage);
        }
      })
      .on('broadcast', { event: 'game_state_sync' }, (payload) => {
        if (payload.payload) {
          this.callbacks.onGameStateSync(payload.payload as Partial<GameState>);
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

        if (onlinePlayers.length > 0) {
          this.callbacks.onPlayersUpdate(onlinePlayers);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && this.channel) {
          await this.channel.track({ player: this.player });
        }
      });

    // 2. Browser BroadcastChannel (Instant zero-latency tab-to-tab sync on localhost)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.localChannel = new BroadcastChannel(`local_${chanName}`);
        this.localChannel.onmessage = (event) => {
          const { type, payload, senderId } = event.data;
          if (senderId === this.player.id) return; // ignore own echo

          if (type === 'draw_action') {
            this.callbacks.onDrawAction(payload);
          } else if (type === 'chat_message') {
            this.callbacks.onChatMessage(payload);
          } else if (type === 'game_state_sync') {
            this.callbacks.onGameStateSync(payload);
          }
        };
      } catch {
        // Local BroadcastChannel optional fallback
      }
    }
  }

  public broadcastDraw(action: DrawAction): void {
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'draw_action',
        payload: action,
      });
    }
    if (this.localChannel) {
      this.localChannel.postMessage({
        type: 'draw_action',
        payload: action,
        senderId: this.player.id,
      });
    }
  }

  public broadcastChat(message: ChatMessage): void {
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'chat_message',
        payload: message,
      });
    }
    if (this.localChannel) {
      this.localChannel.postMessage({
        type: 'chat_message',
        payload: message,
        senderId: this.player.id,
      });
    }
  }

  public broadcastGameState(state: Partial<GameState>): void {
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'game_state_sync',
        payload: state,
      });
    }
    if (this.localChannel) {
      this.localChannel.postMessage({
        type: 'game_state_sync',
        payload: state,
        senderId: this.player.id,
      });
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
