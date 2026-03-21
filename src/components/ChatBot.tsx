import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, User, Sparkles, X, Minimize2, Maximize2 } from "lucide-react";
import { PandaMascot } from "./PandaMascot";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "planning" | "debugging" | "optimization" | "observational";
  timestamp: Date;
}

interface ChatBotProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isTyping?: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  agentState:
    | "idle"
    | "thinking"
    | "happy"
    | "stuck"
    | "talking"
    | "confused"
    | "sad"
    | "mad";
  embedded?: boolean;
}

export const ChatBot: React.FC<ChatBotProps> = ({
  messages,
  onSendMessage,
  isTyping,
  isOpen,
  setIsOpen,
  isMinimized,
  setIsMinimized,
  agentState,
  embedded = false,
}) => {
  const [input, setInput] = useState("");
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
      setInput("");
    }
  };

  if (!isOpen && !embedded) return null;

  const containerClasses = embedded
    ? "flex flex-col h-full w-full bg-[#f8faf9] relative overflow-hidden"
    : cn(
        "fixed bottom-12 right-6 w-[360px] bg-[#f8faf9] rounded-3xl shadow-2xl border border-emerald-500/20 flex flex-col overflow-hidden z-50 transition-all duration-300",
        isMinimized && "w-[240px]",
      );

  return (
    <motion.div
      initial={embedded ? undefined : { opacity: 0, y: 20, scale: 0.95 }}
      animate={
        embedded
          ? { height: "100%" }
          : {
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? "80px" : "500px",
            }
      }
      exit={embedded ? undefined : { opacity: 0, y: 20, scale: 0.95 }}
      className={containerClasses}
    >
      {/* Header */}
      <div
        className={cn(
          "bg-emerald-800 px-4 flex items-center justify-between text-white shrink-0",
          embedded ? "h-14" : "h-20",
        )}
      >
        <div className="flex items-center gap-3">
          {!embedded && (
            <div className="w-12 h-12 bg-white/90 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner">
              <div className="scale-[0.45] origin-center">
                <PandaMascot state={agentState} />
              </div>
            </div>
          )}
          <div>
            <h3
              className={cn(
                "font-black tracking-tight",
                embedded ? "text-sm" : "text-base",
              )}
            >
              Bamboost
            </h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">
                Tutor Mode
              </span>
            </div>
          </div>
        </div>
        {!embedded && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e8edea]"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-300 rounded-3xl flex items-center justify-center text-emerald-900">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base font-black text-emerald-950">
                    Chew on a problem?
                  </p>
                  <p className="text-xs text-emerald-900 mt-1 font-black">
                    I'm here to help you plan, debug, or optimize your code!
                  </p>
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex w-full gap-3",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row",
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    msg.role === "user"
                      ? "bg-emerald-300 text-emerald-900"
                      : "bg-emerald-800 text-white",
                  )}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <div className="scale-[0.25] origin-center">
                      <PandaMascot state={agentState} />
                    </div>
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] space-y-1",
                    msg.role === "user" ? "items-end" : "items-start",
                  )}
                >
                  {msg.type && (
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-800 px-1">
                      {msg.type}
                    </span>
                  )}
                  <div
                    className={cn(
                      "p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm font-bold",
                      msg.role === "user"
                        ? "bg-emerald-800 text-white rounded-tr-none"
                        : "bg-white text-emerald-950 border border-emerald-300/50 rounded-tl-none",
                    )}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[9px] font-black text-emerald-700 px-1">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-emerald-800 rounded-xl flex items-center justify-center text-white shadow-sm overflow-hidden">
                  <div className="scale-[0.25] origin-center">
                    <PandaMascot state="thinking" />
                  </div>
                </div>
                <div className="bg-white border border-emerald-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="flex gap-1">
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                    />
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                      className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                    />
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                      className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-4 bg-[#f8faf9] border-t border-emerald-300/50 shrink-0"
          >
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Bamboost for a hint..."
                className="w-full bg-white border border-emerald-400/50 rounded-2xl py-3.5 pl-5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all placeholder:text-emerald-600/50 font-black text-emerald-950"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-emerald-800 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-800 transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
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
