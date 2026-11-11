import React, { useState, useRef, useEffect } from 'react';
import api from '../api/client';

/* ── tiny icon components (no extra deps needed) ─────────────────────────── */
const IconBot = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M12 2a3 3 0 0 1 3 3v6H9V5a3 3 0 0 1 3-3z" />
    <line x1="8" y1="15" x2="8" y2="18" />
    <line x1="16" y1="15" x2="16" y2="18" />
    <line x1="12" y1="2" x2="12" y2="5" />
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
    strokeLinecap="round" className="w-4 h-4">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const IconChat = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconMinus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
    strokeLinecap="round" className="w-4 h-4">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
    strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

/* ── Typing dots ─────────────────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{ animationDelay: `${i * 0.18}s`, animationDuration: '0.9s' }}
          className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce inline-block"
        />
      ))}
    </div>
  );
}

/* ── Type badge colours ──────────────────────────────────────────────────── */
const TYPE_COLOURS = {
  food:    'bg-emerald-100 text-emerald-700',
  meal:    'bg-indigo-100  text-indigo-700',
  health:  'bg-rose-100    text-rose-700',
  general: 'bg-slate-100   text-slate-500',
};
const TYPE_LABELS = { food:'Food', meal:'Meal', health:'Health', general:'General' };

/* ══════════════════════════════════════════════════════════════════════════
   WIDGET
═══════════════════════════════════════════════════════════════════════════ */
export default function ChatWidget() {
  const email = localStorage.getItem('userEmail');

  const [isOpen,   setIsOpen]   = useState(false);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [unread,   setUnread]   = useState(0);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi! I'm your SmartEats AI 👋  Ask me anything about your diet, meals, or health — I'll personalise my answers based on your profile.",
      type: 'general',
    },
  ]);

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const bodyRef    = useRef(null);

  /* auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /* focus input when opened */
  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const toggle = () => setIsOpen(o => !o);

  const startNewChat = () => {
    setMessages([
      {
        role: 'assistant',
        text: "Conversation reset. I'm ready for new questions! 👋",
        type: 'general',
      },
    ]);
    setInput('');
    setLoading(false);
  };

  /* ── send ─────────────────────────────────────────────────────────────── */
  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build history for backend (excluding system-style welcome messages)
      const history = messages
        .filter(m => !m.error)
        .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }));

      const res = await api.post('/chat', { email, message: trimmed, history });
      const { reply, type } = res.data;
      const botMsg = { role: 'assistant', text: reply, type: type || 'general' };
      setMessages(prev => [...prev, botMsg]);
      if (!isOpen) setUnread(n => n + 1);
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Something went wrong. Please try again.';
      setMessages(prev => [...prev, { role: 'bot', text: detail, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  /* ── quick chips (only first few messages) ─────────────────────────────── */
  const CHIPS = ['Can I eat mango?', 'Suggest a breakfast', 'Foods to avoid?', 'How many calories?'];

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ═════════════════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── Floating toggle button ───────────────────────────────────────── */}
      <button
        id="chat-widget-toggle"
        onClick={toggle}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full
          bg-indigo-600 text-white
          flex items-center justify-center
          shadow-xl shadow-indigo-300/50
          hover:scale-110 hover:shadow-2xl hover:shadow-indigo-400/50
          active:scale-95
          transition-all duration-200
          focus:outline-none focus:ring-4 focus:ring-indigo-300
        `}
      >
        {/* swap icon with smooth rotation */}
        <span
          className="absolute inset-0 flex items-center justify-center transition-all duration-300"
          style={{ opacity: isOpen ? 0 : 1, transform: isOpen ? 'rotate(90deg) scale(0.5)' : 'rotate(0deg) scale(1)' }}
        >
          <IconChat />
        </span>
        <span
          className="absolute inset-0 flex items-center justify-center transition-all duration-300"
          style={{ opacity: isOpen ? 1 : 0, transform: isOpen ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)' }}
        >
          <IconClose />
        </span>

        {/* Unread badge */}
        {!isOpen && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center animate-pulse">
            {unread}
          </span>
        )}
      </button>

      {/* ── Chat window ──────────────────────────────────────────────────── */}
      <div
        className="fixed z-40 right-6 bottom-24"
        style={{
          width: 'min(360px, calc(100vw - 24px))',
          /* animate open/close */
          transformOrigin: 'bottom right',
          transform: isOpen ? 'scale(1) translateY(0)'   : 'scale(0.85) translateY(16px)',
          opacity:   isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease',
        }}
      >
        <div className="flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-slate-300/60 border border-slate-200 bg-white"
          style={{ height: 'min(480px, calc(100vh - 120px))' }}>

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="bg-indigo-600 px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <IconBot />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-extrabold text-sm leading-none truncate">SmartEats Assistant</p>
              <p className="text-indigo-200 text-[10px] mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                Personalised to your profile
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={startNewChat}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors mr-1"
                title="New conversation"
              >
                <IconRefresh />
              </button>
              <button
                onClick={toggle}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label="Minimise chat"
              >
                <IconMinus />
              </button>
            </div>
          </div>

          {/* ── Messages ─────────────────────────────────────────────────── */}
          <div ref={bodyRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-50">

            {messages.map((msg, i) => {
              if (msg.role === 'user') return (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] bg-indigo-600 text-white text-xs leading-relaxed px-3 py-2 rounded-2xl rounded-br-sm shadow-sm">
                    {msg.text}
                  </div>
                </div>
              );

              if (msg.error) return (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[82%] bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed px-3 py-2 rounded-2xl rounded-bl-sm">
                    {msg.text}
                  </div>
                </div>
              );

              return (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[82%]">
                    {msg.type && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold mb-1 ${TYPE_COLOURS[msg.type] || TYPE_COLOURS.general}`}>
                        {TYPE_LABELS[msg.type] || 'General'}
                      </span>
                    )}
                    <div className="bg-white border border-slate-200 text-slate-700 text-xs leading-relaxed px-3 py-2 rounded-2xl rounded-tl-sm shadow-sm whitespace-pre-wrap">
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Quick chips (shown while conversation is fresh) ───────────── */}
          {messages.length <= 2 && !loading && (
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-1.5">
              {CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-full text-[10px] font-medium transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* ── Input bar ──────────────────────────────────────────────────── */}
          <div className="px-3 py-2.5 bg-white border-t border-slate-100 shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <input
                id="widget-chat-input"
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
                placeholder="Ask about food or health…"
                className="flex-1 bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none disabled:opacity-60"
              />
              <button
                id="widget-send-btn"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <IconSend />
              </button>
            </div>
            <p className="text-center text-[9px] text-slate-300 mt-1.5">
              SmartEats AI · Not a substitute for medical advice
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
