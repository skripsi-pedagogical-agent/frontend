import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, User, Sparkles, X, Minimize2, Maximize2, Expand, Shrink } from "lucide-react";
import { PandaMascot } from "./PandaMascot";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const MarkdownComponents: Components = {
  table({ children, ...props }) {
    return (
      <div className="overflow-x-auto my-2">
        <table
          className="min-w-full border-collapse border border-emerald-300/50 text-xs"
          {...props}
        >
          {children}
        </table>
      </div>
    );
  },
  th({ children, ...props }) {
    return (
      <th
        className="border border-emerald-300/50 px-3 py-2 bg-emerald-100 text-emerald-950 font-bold text-left"
        {...props}
      >
        {children}
      </th>
    );
  },
  td({ children, ...props }) {
    return (
      <td
        className="border border-emerald-300/50 px-3 py-2 bg-white text-emerald-900"
        {...props}
      >
        {children}
      </td>
    );
  },
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || "");
    return !inline && match ? (
      <SyntaxHighlighter
        {...props}
        style={vscDarkPlus as any}
        language={match[1]}
        PreTag="div"
        className="rounded-lg !my-2 text-xs"
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    ) : (
      <code
        {...props}
        className={cn(
          className,
          "bg-black/10 px-1 py-0.5 rounded font-mono text-xs",
        )}
      >
        {children}
      </code>
    );
  },
};

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

export interface IdleHelpOption {
  id: string;
  description: string;
}

interface ChatBotProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  username: string;
  isTyping?: boolean;
  disabled?: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  idleHelpCheckIn: boolean;
  idleHelpNoReasons: IdleHelpOption[];
  idleHelpYesReason?: IdleHelpOption;
  onIdleHelpChoiceNo: (reason: IdleHelpOption) => void;
  onIdleHelpChoiceYes: (reason: IdleHelpOption) => void;
  isIdleHelpSubmitting: boolean;
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
  isExpanded?: boolean;
  setIsExpanded?: (expanded: boolean) => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({
  messages,
  onSendMessage,
  username,
  isTyping,
  disabled = false,
  isOpen,
  setIsOpen,
  isMinimized,
  setIsMinimized,
  idleHelpCheckIn,
  idleHelpNoReasons,
  idleHelpYesReason,
  onIdleHelpChoiceNo,
  onIdleHelpChoiceYes,
  isIdleHelpSubmitting,
  agentState,
  embedded = false,
  isExpanded = false,
  setIsExpanded = () => {},
}) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- GANTI BAGIAN INI ---
  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen, isMinimized, isExpanded]);
  // -------------------------

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) {
      return;
    }

    if (input.trim() && !isTyping) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  if (!isOpen && !embedded) return null;

  const containerClasses = embedded
    ? "flex flex-col h-full w-full bg-[#f8faf9] relative overflow-hidden"
    : cn(
        "fixed bottom-12 right-6 bg-[#f8faf9] rounded-3xl shadow-2xl border border-emerald-500/20 flex flex-col overflow-hidden z-50 transition-all duration-300",
        isMinimized && "w-[240px]",
        !isMinimized && !isExpanded && "w-[360px]",
        !isMinimized && isExpanded && "w-[700px]",
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
              height: isMinimized ? "80px" : isExpanded ? "650px" : "500px",
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
          {/* {!embedded && (
            <div className="w-12 h-12 bg-white/90 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner">
              <div className="scale-[0.45] origin-center">
                <PandaMascot state={agentState} />
              </div>
            </div>
          )} */}
          <div>
            <h3
              className={cn(
                "font-black tracking-tight",
                embedded ? "text-sm" : "text-base",
              )}
            >
              Tanya Bamboost!
            </h3>
          </div>
        </div>
        {!embedded && (
          <div className="flex items-center gap-1">
            {!isMinimized && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                {isExpanded ? (
                  <Shrink className="w-4 h-4" />
                ) : (
                  <Expand className="w-4 h-4" />
                )}
              </button>
            )}
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
                    Kunyah masalah?
                  </p>
                  <p className="text-xs text-emerald-900 mt-1 font-black">
                    Saya di sini untuk membantu Anda merencanakan, debug, atau
                    mengoptimalkan kode Anda!
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
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-800 px-1">
                      {msg.role === "user" ? username : "BAMBOOST AI"}
                    </span>
                    {msg.type && msg.type !== "observational" && (
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-800 px-1">
                        {msg.type}
                      </span>
                    )}
                  </div>
                  <div
                    className={cn(
                      "p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm font-bold overflow-hidden space-y-2",
                      msg.role === "user"
                        ? "bg-emerald-800 text-white rounded-tr-none"
                        : "bg-white text-emerald-950 border border-emerald-300/50 rounded-tl-none",
                    )}
                  >
                    <ReactMarkdown
                      components={MarkdownComponents}
                      remarkPlugins={[remarkGfm]}
                    >
                      {msg.content}
                    </ReactMarkdown>
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

            {idleHelpCheckIn && (
              <div className="space-y-4">
                <div className="bg-white border border-emerald-300/60 rounded-3xl shadow-sm p-4 text-left">
                  <div className="text-[10px] uppercase tracking-[0.25em] font-black text-emerald-700 mb-2">
                    BAMBOOST AI
                  </div>
                  <p className="text-sm font-black text-emerald-950 mb-4">
                    Sudah cukup lama tanpa submit. Butuh bantuan?
                  </p>
                  <div className="grid gap-2">
                    {idleHelpNoReasons.map((reason) => (
                      <button
                        key={reason.id}
                        type="button"
                        disabled={isIdleHelpSubmitting}
                        onClick={() => onIdleHelpChoiceNo(reason)}
                        className="w-full text-left text-xs font-bold text-emerald-950 bg-white border border-emerald-300/80 rounded-xl px-3 py-2.5 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                      >
                        {reason.description}
                      </button>
                    ))}
                    {idleHelpYesReason && (
                      <button
                        type="button"
                        disabled={isIdleHelpSubmitting}
                        onClick={() => onIdleHelpChoiceYes(idleHelpYesReason)}
                        className="w-full text-left text-xs font-black text-white bg-emerald-700 border border-emerald-800 rounded-xl px-3 py-2.5 hover:bg-emerald-600 transition-colors disabled:opacity-50"
                      >
                        {isIdleHelpSubmitting
                          ? "Memuat…"
                          : idleHelpYesReason.description}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
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
                placeholder={
                  disabled
                    ? "Tantangan telah selesai. Klik Reattempt untuk mengobrol kembali."
                    : "Minta petunjuk dari Bamboost..."
                }
                disabled={disabled}
                className="w-full bg-white border border-emerald-400/50 rounded-2xl py-3.5 pl-5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all placeholder:text-emerald-600/50 font-black text-emerald-950"
              />
              <button
                type="submit"
                disabled={disabled || !input.trim() || isTyping}
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
