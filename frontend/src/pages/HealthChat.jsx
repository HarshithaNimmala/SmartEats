import React, { useState, useRef, useEffect } from 'react';
import api from '../api/client';
import {
  Bot, Send, RefreshCw, Sparkles,
  Apple, Utensils, HeartPulse, HelpCircle,
  AlertTriangle, User
} from 'lucide-react';

// ── Config ─────────────────────────────────────────────────────────────────
const TYPE_META = {
  food:    { label: 'Food Safety',  icon: <Apple size={11} />,      color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  meal:    { label: 'Meal Advice',  icon: <Utensils size={11} />,   color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  health:  { label: 'Health Info',  icon: <HeartPulse size={11} />, color: 'bg-rose-100 text-rose-700 border-rose-200' },
  general: { label: 'General',      icon: <HelpCircle size={11} />, color: 'bg-slate-100 text-slate-500 border-slate-200' },
};

const QUICK_CHIPS = [
  'Can I eat mango?',
  'Is rice safe for me?',
  "What's a good breakfast?",
  'Foods to avoid?',
  'How many calories should I eat?',
  'Suggest a high-protein snack',
];

// ── Typing Dots ─────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-end gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
        />
      ))}
    </div>
  );
}

// ── Single Message Bubble ───────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[72%] flex items-end gap-2">
          <div className="bg-indigo-600 text-white px-4 py-3 rounded-2xl rounded-br-sm text-sm font-medium leading-relaxed shadow-sm">
            {msg.text}
          </div>
          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
            <User size={15} className="text-indigo-600" />
          </div>
        </div>
      </div>
    );
  }

  if (msg.error) {
    return (
      <div className="flex justify-start mb-4">
        <div className="max-w-[72%] flex items-start gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 mt-1">
            <AlertTriangle size={15} className="text-rose-500" />
          </div>
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed">
            {msg.text}
          </div>
        </div>
      </div>
    );
  }

  const meta = TYPE_META[msg.type] || TYPE_META.general;

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[76%] flex items-start gap-2">
        {/* Bot avatar */}
        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
          <Bot size={15} className="text-white" />
        </div>

        <div>
          {/* Type badge */}
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold mb-1.5 ${meta.color}`}>
            {meta.icon}
            {meta.label}
          </div>

          {/* Message */}
          <div className="bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm whitespace-pre-wrap">
            {msg.text}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Chat Page ──────────────────────────────────────────────────────────
export default function HealthChat() {
  const email = localStorage.getItem('userEmail');
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Hi! I'm your SmartEats AI Health Assistant 👋\n\nI can answer questions about your diet, food safety, meal planning, and nutrition — all based on your actual health profile.\n\nWhat would you like to know?",
      type: 'general',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat', { email, message: trimmed });
      const { reply, type } = res.data;
      setMessages(prev => [...prev, { role: 'bot', text: reply, type: type || 'general' }]);
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Something went wrong. Please try again.';
      setMessages(prev => [...prev, { role: 'bot', text: detail, error: true }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClear = () => {
    setMessages([{
      role: 'bot',
      text: "Chat cleared! Ask me anything about your diet or health 🥗",
      type: 'general',
    }]);
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc]">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-800 leading-none">AI Health Chat</h1>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              Personalised to your health profile
            </p>
          </div>
        </div>
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
        >
          <RefreshCw size={13} />
          Clear chat
        </button>
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <Bot size={15} className="text-white" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm">
                <TypingDots />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Quick-reply chips ── */}
      {messages.length <= 2 && !loading && (
        <div className="px-8 pb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Sparkles size={10} /> Suggested questions
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-full text-xs font-medium transition-all shadow-sm"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="bg-white border-t border-slate-100 px-8 py-4 shrink-0">
        <div className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              // Auto-resize
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about food, meals, nutrition, or your health…"
            disabled={loading}
            className="flex-1 resize-none bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none leading-relaxed min-h-[24px] max-h-[120px] overflow-y-auto disabled:opacity-60"
          />
          <button
            id="chat-send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          SmartEats AI uses your profile data · Not a substitute for medical advice
        </p>
      </div>
    </div>
  );
}
