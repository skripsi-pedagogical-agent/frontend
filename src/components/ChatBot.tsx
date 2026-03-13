import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Sparkles, X, Minimize2, Maximize2 } from 'lucide-react';
import { PandaMascot } from './PandaMascot';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'planning' | 'debugging' | 'optimization' | 'observational';
  timestamp: Date;
}

interface ChatBotProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isTyping?: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  agentState: 'idle' | 'thinking' | 'happy' | 'stuck' | 'talking' | 'confused' | 'sad' | 'mad';
}

export const ChatBot: React.FC<ChatBotProps> = ({ 
  messages, 
  onSendMessage, 
  isTyping, 
  isOpen, 
  setIsOpen,
  agentState
}) => {
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isTyping) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-20 h-20 bg-emerald-600 rounded-3xl shadow-2xl flex items-center justify-center z-50 group border-4 border-white overflow-hidden"
      >
        <div className="scale-[0.7] origin-center">
          <PandaMascot state={agentState} />
        </div>
        <div className="absolute inset-0 bg-emerald-600/0 group-hover:bg-emerald-600/10 transition-colors" />
        <motion.div 
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-1 -right-1 bg-white text-emerald-600 p-1.5 rounded-full shadow-md"
        >
          <Sparkles className="w-3 h-3" />
        </motion.div>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        height: isMinimized ? '80px' : '500px'
      }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={cn(
        "fixed bottom-20 right-8 w-[380px] bg-white rounded-3xl shadow-2xl border border-emerald-100 flex flex-col overflow-hidden z-50 transition-all duration-300",
        isMinimized && "w-[240px]"
      )}
    >
      {/* Header */}
      <div className="h-20 bg-emerald-600 px-4 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-inner">
            <div className="scale-[0.45] origin-center">
              <PandaMascot state={agentState} />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-base tracking-tight">Bamboost</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Tutor Mode</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-emerald-50/30"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base font-bold text-emerald-900">Chew on a problem?</p>
                  <p className="text-xs text-emerald-600 mt-1 font-medium">I'm here to help you plan, debug, or optimize your code!</p>
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex w-full gap-3",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                  msg.role === 'user' ? "bg-emerald-100 text-emerald-600" : "bg-emerald-600 text-white"
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : (
                    <div className="scale-[0.25] origin-center">
                      <PandaMascot state={agentState} />
                    </div>
                  )}
                </div>
                <div className={cn(
                  "max-w-[80%] space-y-1",
                  msg.role === 'user' ? "items-end" : "items-start"
                )}>
                  {msg.type && (
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 px-1">
                      {msg.type}
                    </span>
                  )}
                  <div className={cn(
                    "p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-emerald-600 text-white rounded-tr-none" 
                      : "bg-white text-emerald-900 border border-emerald-100 rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>
                  <span className="text-[9px] font-bold text-emerald-400/60 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-sm overflow-hidden">
                  <div className="scale-[0.25] origin-center">
                    <PandaMascot state="thinking" />
                  </div>
                </div>
                <div className="bg-white border border-emerald-100 p-3 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="flex gap-1">
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form 
            onSubmit={handleSubmit}
            className="p-4 bg-white border-t border-emerald-100 shrink-0"
          >
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Bamboost for a hint..."
                className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl py-3.5 pl-5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all placeholder:text-emerald-300 font-medium"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-200"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </>
      )}
    </motion.div>
  );
};
