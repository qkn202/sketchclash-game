import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Player, GameMode } from '../types';
import { Send, Smile } from 'lucide-react';
import { soundManager } from '../utils/audio';

const QUICK_EMOJIS = ['❤️', '😂', '👏', '🔥', '😮', '🎨'];

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isDrawer: boolean;
  hasGuessed: boolean;
  currentPlayer: Player;
  mode?: GameMode;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isDrawer,
  hasGuessed,
  currentPlayer,
  mode,
}) => {
  const [inputVal, setInputVal] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    soundManager.playClick();
    onSendMessage(trimmed);
    setInputVal('');
  };

  const handleEmojiClick = (emoji: string) => {
    soundManager.playToolSelect();
    onSendMessage(emoji);
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: '18px',
        border: '2px solid var(--border-card)',
        boxShadow: 'var(--card-shadow)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        maxHeight: '100%',
        overflow: 'hidden',
        flex: 1,
      }}
    >
      {/* Chat Header */}
      <div
        style={{
          padding: '10px 14px',
          background: 'var(--bg-stage)',
          borderBottom: '2px solid var(--border-card)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        <Smile size={17} color="var(--accent-yellow)" />
        <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Đoán Chữ & Trò Chuyện</h4>
      </div>

      {/* Messages Stream with Dedicated Scroll */}
      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          minHeight: 0,
          maxHeight: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '10px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {messages.map((msg, index) => {
          const msgKey = `${msg.id || 'msg'}_${index}`;

          if (msg.type === 'correct') {
            return (
              <div
                key={msgKey}
                style={{
                  background: 'linear-gradient(90deg, rgba(6, 214, 160, 0.25) 0%, rgba(6, 214, 160, 0.1) 100%)',
                  borderLeft: '4px solid var(--accent-cyan)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#06d6a0',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  animation: 'bounceIn 0.3s ease',
                }}
              >
                <span>🎉</span>
                <span>{msg.text}</span>
              </div>
            );
          }

          if (msg.type === 'close') {
            return (
              <div
                key={msgKey}
                style={{
                  background: 'rgba(255, 209, 102, 0.18)',
                  borderLeft: '4px solid var(--accent-yellow)',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#ffd166',
                  fontWeight: 600,
                }}
              >
                ⚠️ {msg.text}
              </div>
            );
          }

          if (msg.type === 'system') {
            return (
              <div
                key={msgKey}
                style={{
                  textAlign: 'center',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  padding: '4px 0',
                  fontStyle: 'italic',
                }}
              >
                — {msg.text} —
              </div>
            );
          }

          // Regular chat message
          const isOwn = msg.playerId === currentPlayer.id;
          return (
            <div
              key={msgKey}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
                fontSize: '13px',
                padding: '3px 6px',
                borderRadius: '8px',
                background: isOwn ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
              }}
            >
              <span style={{ fontWeight: 700, color: isOwn ? 'var(--accent-cyan)' : 'var(--accent-yellow)' }}>
                {msg.playerName}:
              </span>
              <span style={{ color: '#fff', wordBreak: 'break-word' }}>{msg.text}</span>
            </div>
          );
        })}
      </div>

      {/* Quick Reaction Emojis */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '4px 8px',
          background: 'var(--bg-stage)',
          borderTop: '1px solid var(--border-card)',
          flexShrink: 0,
        }}
      >
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleEmojiClick(emoji)}
            style={{
              background: 'transparent',
              fontSize: '17px',
              padding: '2px 4px',
              borderRadius: '8px',
              transition: 'transform 0.1s',
            }}
            title={`Thả cảm xúc ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '8px 10px',
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border-card)',
          display: 'flex',
          gap: '6px',
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={
            mode === 'rush_draw'
              ? 'Gõ dự đoán bảo bối của bất kỳ đối thủ nào...'
              : isDrawer
              ? 'Bạn đang vẽ, không thể đoán!'
              : hasGuessed
              ? 'Bạn đã đoán trúng! Trò chuyện tự do...'
              : 'Gõ dự đoán của bạn...'
          }
          disabled={mode === 'rush_draw' ? false : isDrawer}
          style={{ flex: 1, padding: '8px 12px', fontSize: '16px' }}
        />
        <button
          type="submit"
          disabled={(mode === 'rush_draw' ? false : isDrawer) || !inputVal.trim()}
          className="btn-primary"
          style={{ padding: '0 14px', minHeight: '40px', borderRadius: '12px' }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};
