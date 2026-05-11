import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Send, User, Sparkles, X, Minimize2, Maximize2, Expand, Shrink, Zap } from "lucide-react";
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
          className="min-w-full border-collapse border border-emerald-200 text-sm"
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
        className="border border-emerald-200 px-3 py-2 bg-emerald-50 text-emerald-950 font-semibold text-left"
        {...props}
      >
        {children}
      </th>
    );
  },
  td({ children, ...props }) {
    return (
      <td
        className="border border-emerald-200 px-3 py-2 bg-white text-emerald-900"
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
        wrapLongLines={true}
        customStyle={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          borderRadius: "0.75rem",
          margin: "0.5rem 0",
          fontSize: "0.85rem"
        }}
        className="rounded-xl shadow-sm"
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    ) : (
      <code
        {...props}
        className={cn(
          className,
          "bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-mono text-xs whitespace-pre-wrap break-words",
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // FIX: Dynamic textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input, isOpen, isMinimized]);

  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen, isMinimized, isExpanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) {
      return;
    }

    if (input.trim() && !isTyping) {
      onSendMessage(input.trim());
      setInput("");
      // Reset height after submit
      if (textareaRef.current) {
         textareaRef.current.style.height = "auto";
      }
    }
  };

  const lastMessagePreview = messages.length
    ? messages[messages.length - 1].content.replace(/\s+/g, " ").trim()
    : "";
  
  // FIX: Trimming the message for minimized state
  const previewLabel = lastMessagePreview.length > 50
    ? `${lastMessagePreview.slice(0, 50)}...`
    : lastMessagePreview;

  if (!isOpen && !embedded) return null;

  const containerClasses = embedded
    ? "flex flex-col h-full w-full bg-[#f4f7f6] relative overflow-hidden"
    : cn(
        "fixed bottom-12 right-4 left-auto max-w-[calc(100%-2rem)] bg-[#f4f7f6] rounded-3xl shadow-2xl border border-emerald-500/20 flex flex-col overflow-hidden z-50",
        isMinimized && "w-[260px] h-[88px]",
        !isMinimized && !isExpanded && "w-[380px] h-[550px]",
        !isMinimized && isExpanded && "w-[700px] h-[650px]",
      );

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div
        className={cn(
          "bg-emerald-800 px-4 flex items-center justify-between text-white shrink-0 shadow-sm z-10",
          embedded ? "h-14" : "h-16",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <h3
              className={cn(
                "font-bold tracking-tight truncate flex items-center gap-2",
                embedded ? "text-sm" : "text-base",
              )}
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              Tanya Bamboost!
            </h3>
            {isMinimized && previewLabel && (
              <p
                className="mt-0.5 text-xs text-emerald-200/80 truncate w-[200px]"
                title={previewLabel}
              >
                {previewLabel}
              </p>
            )}
          </div>
        </div>
        {!embedded && (
          <div className="flex items-center gap-1">
            {!isMinimized && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                title={isExpanded ? "Perkecil" : "Perbesar"}
              >
                {isExpanded ? (
                  <Shrink className="w-4 h-4" />
                ) : (
                  <Expand className="w-4 h-4" />
                )}
              </button>
            )}
            {/* <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </button> */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-rose-500/80 rounded-lg transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#f4f7f6]"
          >
            {/* Empty State / Onboarding */}
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 opacity-80">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 shadow-inner">
                   <div className="scale-[0.6] origin-center translate-y-2">
                     <PandaMascot state="happy" />
                   </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-emerald-900 mb-2">
                    Aku BamBoost, siap membantu!
                    </h4>
                    <ul className="text-sm text-emerald-700 space-y-2 font-medium text-left bg-emerald-50 p-4 rounded-2xl border border-emerald-100 inline-block">
                    <li className="flex items-start gap-2">
                      <span className="shrink-0">💡</span> 
                      <span>"Bamboost, tolong kasih <b>hint</b> untuk logika ini?"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="shrink-0">🧩</span> 
                      <span>"Ada saran <b>approach (pendekatan)</b> lain nggak?"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="shrink-0">📝</span> 
                      <span>"Bisa kasih <b>contoh snippet</b> yang mirip?"</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Chat Bubbles */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex w-full gap-3",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row",
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1",
                    msg.role === "user"
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-emerald-200 text-emerald-800",
                  )}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <div className="scale-[0.25] origin-center translate-y-1">
                      <PandaMascot state={agentState} />
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div
                  className={cn(
                    "max-w-[85%] space-y-1",
                    msg.role === "user" ? "items-end text-right" : "items-start text-left",
                  )}
                >
                  {/* Sender Name & Type Label */}
                  <div className={cn(
                    "flex items-center gap-2",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}>
                    <span className="text-[10px] font-bold tracking-wider text-emerald-800/70 uppercase">
                      {msg.role === "user" ? username : "BAMBOOST"}
                    </span>
                    
                  
                    {msg.role === "assistant" && msg.type !== "observational" && (
                       <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm">
                         Balasan
                       </span>
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={cn(
                      "p-3.5 text-sm leading-relaxed shadow-sm break-words prose prose-sm max-w-none",
                      msg.role === "user"
                        ? "bg-emerald-700 text-white rounded-2xl rounded-tr-none prose-invert"
                        : "bg-white text-slate-800 border border-emerald-100/60 rounded-2xl rounded-tl-none font-medium prose-emerald",
                    )}
                  >
                    <ReactMarkdown
                      components={MarkdownComponents}
                      remarkPlugins={[remarkGfm]}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  <div className="text-[10px] font-medium text-emerald-600/60 px-1">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}

            {/* Proactive Idle Help Check-in */}
            {idleHelpCheckIn && (
              <div className="space-y-4 pt-4 border-t border-emerald-200/50">
                <div className="bg-white border-2 border-amber-200 rounded-3xl shadow-md p-5 text-left relative overflow-hidden">
                
                  <p className="text-sm font-bold text-slate-800 mb-5">
                    Saya perhatikan kamu terdiam cukup lama. Ada yang bikin bingung?
                  </p>
                  <div className="grid gap-2.5">
                    {idleHelpNoReasons.map((reason) => (
                      <button
                        key={reason.id}
                        type="button"
                        disabled={isIdleHelpSubmitting}
                        onClick={() => onIdleHelpChoiceNo(reason)}
                        className="w-full text-left text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50"
                      >
                        {reason.description}
                      </button>
                    ))}
                    {idleHelpYesReason && (
                      <button
                        type="button"
                        disabled={isIdleHelpSubmitting}
                        onClick={() => onIdleHelpChoiceYes(idleHelpYesReason)}
                        className="w-full text-left text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-200 rounded-xl px-4 py-3 hover:bg-emerald-200 transition-colors disabled:opacity-50 mt-2"
                      >
                        {isIdleHelpSubmitting
                          ? "Memuat hint..."
                          : "Ya, beri saya hint logika."}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-white border border-emerald-200 rounded-full flex items-center justify-center text-white shadow-sm mt-1">
                  <div className="scale-[0.25] origin-center translate-y-1">
                    <PandaMascot state="thinking" />
                  </div>
                </div>
                <div className="bg-white border border-emerald-100 px-4 py-3.5 rounded-2xl rounded-tl-none shadow-sm flex items-center h-[42px]">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FIX: Input Area (Multi-line & proper padding) */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white border-t border-emerald-100 shrink-0 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.05)]"
          >
            <div className="relative flex items-end gap-2 w-full">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={
                  disabled
                    ? "Tantangan selesai."
                    : "Ketik pertanyaanmu..."
                }
                disabled={disabled}
                className="flex-1 w-full min-h-[44px] overflow-y-auto resize-none bg-emerald-50/50 border border-emerald-200 rounded-xl py-3 pl-4 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all placeholder:text-emerald-700/40 font-medium text-emerald-950 whitespace-pre-wrap break-words"
                style={{ maxHeight: '120px' }}
              />
              <button
                type="submit"
                disabled={disabled || !input.trim() || isTyping}
                className="h-[44px] w-[44px] flex items-center justify-center bg-emerald-700 text-white rounded-xl hover:bg-emerald-600 disabled:bg-emerald-100 disabled:text-emerald-400 shrink-0 shadow-sm"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
            <div className="text-[10px] text-center text-emerald-600/60 mt-2 font-medium">
              Bamboost dapat membuat kesalahan. Tekan Shift + Enter untuk garis baru.
            </div>
          </form>
        </>
      )}
    </div>
  );
};