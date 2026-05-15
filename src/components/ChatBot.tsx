import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  Send,
  User,
  Sparkles,
  X,
  Expand,
  Shrink,
  Zap,
} from "lucide-react";
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
          fontSize: "0.85rem",
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
          "bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-mono text-xs whitespace-pre-wrap wrap-break-word",
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
  proactive?: boolean;
}

export interface StuckHelpOption {
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
  helpCheckInType: "idle" | "error" | null;
  stuckHelpNoReasons: StuckHelpOption[];
  stuckHelpYesReason?: StuckHelpOption;
  onStuckHelpChoiceNo: (reason: StuckHelpOption) => void;
  onStuckHelpChoiceYes: (reason: StuckHelpOption) => void;
  isStuckHelpSubmitting: boolean;
  agentState:
    | "idle"
    | "thinking"
    | "happy"
    | "stuck"
    | "talking"
    | "confused"
    | "sad"
    | "mad"
    | "sleeping";
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
  helpCheckInType,
  stuckHelpNoReasons,
  stuckHelpYesReason,
  onStuckHelpChoiceNo,
  onStuckHelpChoiceYes,
  isStuckHelpSubmitting,
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
  const previewLabel =
    lastMessagePreview.length > 50
      ? `${lastMessagePreview.slice(0, 50)}...`
      : lastMessagePreview;

  if (!isOpen && !embedded) return null;

  const containerClasses = embedded
    ? "flex flex-col h-full w-full bg-emerald-50/40 relative overflow-hidden"
    : cn(
        "fixed bottom-12 right-4 left-auto max-w-[calc(100%-2rem)] bg-emerald-50/40 rounded-lg shadow-xl border border-emerald-200 flex flex-col overflow-hidden z-50",
        isMinimized && "w-[260px] h-[88px]",
        !isMinimized && !isExpanded && "w-[380px] h-[550px]",
        !isMinimized && isExpanded && "w-[700px] h-[650px]",
      );

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div
        className={cn(
          "bg-white px-4 flex items-center justify-between text-slate-900 shrink-0 border-b border-emerald-200 z-10",
          embedded ? "h-14" : "h-14",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50 flex items-center justify-center">
            <div className="scale-[0.32] origin-center">
              <PandaMascot state={agentState} />
            </div>
          </div>
          <div className="min-w-0 leading-none">
            <h3
              className={cn(
                "font-bold tracking-tight truncate flex items-center gap-2 leading-tight",
                embedded ? "text-sm" : "text-base",
              )}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Tanya Bamboost!
            </h3>
            {!isMinimized && (
              <p className="mt-1 text-[11px] font-semibold text-emerald-700/75 truncate leading-tight">
                Bamboost sedang menemani sesi codingmu
              </p>
            )}
            {isMinimized && previewLabel && (
              <p
                className="mt-0.5 text-xs text-emerald-700/75 truncate w-[200px]"
                title={previewLabel}
              >
                {previewLabel}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!embedded && !isMinimized && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
              title={isExpanded ? "Perkecil" : "Perbesar"}
              type="button"
            >
              {isExpanded ? (
                <Shrink className="w-4 h-4" />
              ) : (
                <Expand className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-emerald-50 rounded-md transition-colors ml-1 text-emerald-700 hover:text-emerald-950"
            title="Tutup chat"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-5 bg-emerald-50/40 relative"
          >
            {/* Empty State / Onboarding */}
            {messages.length === 0 && (
              <div className="relative h-full flex flex-col items-center justify-center text-center p-6 space-y-4 opacity-90">
                <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center text-emerald-700 border border-emerald-200 shadow-sm">
                   <div className="scale-[0.56] origin-center">
                     <PandaMascot state="happy" />
                   </div>
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 mb-2">
                    Aku BamBoost, siap membantu!
                  </h4>
                  <ul className="text-sm text-emerald-900 space-y-2 font-medium text-left bg-white p-4 rounded-lg border border-emerald-200 inline-block shadow-sm">
                    <li className="flex items-start gap-2">
                      <span className="shrink-0">💡</span>
                      <span>
                        "Bamboost, tolong kasih <b>hint</b> untuk logika ini?"
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="shrink-0">🧩</span>
                      <span>
                        "Ada saran <b>approach (pendekatan)</b> lain nggak?"
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="shrink-0">📝</span>
                      <span>
                        "Bisa kasih <b>contoh snippet</b> yang mirip?"
                      </span>
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
                    "w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-1",
                    msg.role === "user"
                      ? "bg-emerald-700 text-white"
                      : "bg-white border border-emerald-200 text-emerald-800",
                  )}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <div className="scale-[0.23] origin-center">
                      <PandaMascot state={agentState} />
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div
                  className={cn(
                    "max-w-[85%] space-y-1",
                    msg.role === "user"
                      ? "items-end text-right"
                      : "items-start text-left",
                  )}
                >
                  {/* Sender Name & Type Label */}
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      msg.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <span className="text-[10px] font-bold tracking-wider text-emerald-800/70 uppercase">
                      {msg.role === "user" ? username : "BAMBOOST"}
                    </span>
                    {msg.role === "assistant" && msg.proactive ? (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-300 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm">
                        <Zap className="h-3 w-3" />
                        Sigap
                      </span>
                    ) : msg.role === "assistant" &&
                      msg.type !== "observational" ? (
                      <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm">
                        Balasan
                      </span>
                    ) : null}
                  </div>

                  {/* Bubble */}
                  <div
                    className={cn(
                      "p-3 text-sm leading-relaxed break-words prose prose-sm max-w-none rounded-lg border shadow-sm",
                      msg.role === "user"
                        ? "bg-emerald-700 text-white border-emerald-700 prose-invert"
                        : "bg-white text-slate-800 border-emerald-200 font-medium prose-emerald shadow-sm",
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

            {/* Proactive Help Check-in */}
            {helpCheckInType !== null && (
              <div className="space-y-4 pt-4 border-t border-emerald-200/50">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left relative overflow-hidden">
                  <p className="text-sm font-bold text-slate-800 mb-5">
                    {helpCheckInType === "error"
                      ? "Kelihatannya kamu kesulitan memperbaiki error. Ada yang bingung?"
                      : "Saya perhatikan kamu terdiam cukup lama. Ada yang bikin bingung?"}
                  </p>
                  <div className="grid gap-2.5">
                    {stuckHelpNoReasons.map((reason) => (
                      <button
                        key={reason.id}
                        type="button"
                        disabled={isStuckHelpSubmitting}
                        onClick={() => onStuckHelpChoiceNo(reason)}
                        className="w-full text-left text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md px-4 py-3 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50"
                      >
                        {reason.description}
                      </button>
                    ))}
                    {stuckHelpYesReason && (
                      <button
                        type="button"
                        disabled={isStuckHelpSubmitting}
                        onClick={() => onStuckHelpChoiceYes(stuckHelpYesReason)}
                        className="w-full text-left text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-200 rounded-md px-4 py-3 hover:bg-emerald-200 transition-colors disabled:opacity-50 mt-2"
                      >
                        {isStuckHelpSubmitting
                          ? "Memuat hint..."
                          : "Ya, beri saya hint."}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-white border border-emerald-200 rounded-md flex items-center justify-center text-white mt-1">
                  <div className="scale-[0.23] origin-center">
                    <PandaMascot state="thinking" />
                  </div>
                </div>
                <div className="bg-white border border-emerald-200 px-4 py-3.5 rounded-lg flex items-center h-[42px] shadow-sm">
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
            className="p-3 bg-white border-t border-emerald-200 shrink-0"
          >
            <div className="relative flex items-end gap-2 w-full">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={
                  disabled
                    ? "Chat belum aktif."
                    : "Ketik pertanyaanmu..."
                }
                disabled={disabled}
                className="flex-1 w-full min-h-[44px] overflow-y-auto resize-none bg-emerald-50/60 border border-emerald-200 rounded-md py-3 pl-4 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors placeholder:text-emerald-700/45 font-medium text-emerald-950 whitespace-pre-wrap break-words"
                style={{ maxHeight: "120px" }}
              />
              <button
                type="submit"
                disabled={disabled || !input.trim() || isTyping}
                className="h-[44px] w-[44px] flex items-center justify-center bg-emerald-700 text-white rounded-md hover:bg-emerald-600 disabled:bg-emerald-100 disabled:text-emerald-400 shrink-0"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
            <div className="text-[10px] text-center text-emerald-700/65 mt-2 font-medium">
              Bamboost dapat membuat kesalahan. Tekan Shift + Enter untuk garis baru.
            </div>
          </form>
        </>
      )}
    </div>
  );
};
