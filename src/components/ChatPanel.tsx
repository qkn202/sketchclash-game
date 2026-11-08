import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Player, GameMode, GamePhase } from '../types';
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
  phase?: GamePhase;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isDrawer,
  hasGuessed,
  currentPlayer,
  mode,
  phase,
}) => {
  const chatInputId = React.useId();
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

  const placeholderText =
    mode === 'rush_draw'
      ? phase === 'drawing'
        ? 'Gõ dự đoán bảo bối của bất kỳ đối thủ nào...'
        : 'Trò chuyện tự do cùng cả phòng...'
      : mode === 'relay_phone'
      ? 'Trò chuyện tự do cùng cả phòng...'
      : mode === 'polyjuice_impostor'
      ? 'Thảo luận suy luận truy tìm Kẻ Giả Mạo...'
      : phase === 'selecting_word'
      ? 'Đang chọn từ... Trò chuyện tự do cùng cả phòng!'
      : phase === 'round_end'
      ? 'Kết thúc lượt! Trò chuyện tự do cùng cả phòng...'
      : isDrawer
      ? 'Trò chuyện cùng phòng (không lộ đáp án)...'
      : hasGuessed
      ? 'Bạn đã đoán trúng! Trò chuyện tự do...'
      : 'Gõ dự đoán của bạn...';

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
        <Smile size={17} color="var(--accent-yellow)" aria-hidden="true" />
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
                  lineHeight: 1.4,
                  color: '#06d6a0',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  animation: 'bounceIn 0.3s ease',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                }}
              >
                <span aria-hidden="true" style={{ flexShrink: 0 }}>🎉</span>
                <span style={{ flex: 1, minWidth: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {msg.text}
                </span>
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
                  lineHeight: 1.4,
                  color: '#ffd166',
                  fontWeight: 600,
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  whiteSpace: 'pre-wrap',
                }}
              >
                <span aria-hidden="true">⚠️ </span>{msg.text}
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
                  lineHeight: 1.4,
                  color: 'var(--text-muted)',
                  padding: '4px 6px',
                  fontStyle: 'italic',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  whiteSpace: 'pre-wrap',
                }}
              >
                — {msg.text} —
              </div>
            );
          }

          // Regular chat message — inline flow so long messages wrap across the full width
          const isOwn = msg.playerId === currentPlayer.id;
          return (
            <div
              key={msgKey}
              style={{
                fontSize: '13px',
                lineHeight: 1.45,
                padding: '4px 8px',
                borderRadius: '8px',
                background: isOwn ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
                whiteSpace: 'pre-wrap',
              }}
            >
              <span style={{ fontWeight: 700, color: isOwn ? 'var(--accent-cyan)' : 'var(--accent-yellow)', marginRight: '6px' }}>
                {msg.playerName}:
              </span>
              <span style={{ color: '#fff', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{msg.text}</span>
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
            aria-label={`Thả cảm xúc ${emoji}`}
            onClick={() => handleEmojiClick(emoji)}
            style={{
              background: 'transparent',
              fontSize: '17px',
              padding: '2px 4px',
              minInlineSize: '30px',
              minBlockSize: '30px',
              borderRadius: '8px',
              transition: 'transform 0.1s',
            }}
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
        <label htmlFor={chatInputId} className="visually-hidden">
          Dự đoán từ khóa hoặc trò chuyện
        </label>
        <input
          id={chatInputId}
          name="guess"
          type="text"
          maxLength={250}
          enterKeyHint="send"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) {
              e.preventDefault();
            }
          }}
          placeholder={placeholderText}
          style={{ flex: 1, padding: '8px 12px', fontSize: '16px' }}
        />
        <button
          type="submit"
          aria-label="Gửi tin nhắn hoặc dự đoán"
          disabled={!inputVal.trim()}
          className="btn-primary"
          style={{ padding: '0 14px', minBlockSize: '40px', borderRadius: '12px' }}
        >
          <Send size={15} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
};
