"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  MessageSquare,
  Play,
  Terminal as TerminalIcon,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ChatBot, type Message } from "@/src/components/ChatBot";
import { CodeEditor } from "@/src/components/CodeEditor";
import { PandaMascot } from "@/src/components/PandaMascot";
import { getPedagogicalHint } from "@/src/services/geminiService";
import type { Problem } from "@/src/lib/problems";
// @ts-ignore
import Sk from "skulpt";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AgentState =
  | "idle"
  | "thinking"
  | "happy"
  | "stuck"
  | "talking"
  | "confused"
  | "sad"
  | "mad";

interface ChallengeWorkspaceProps {
  username: string;
  problem: Problem;
  onBack: () => void;
}

export function ChallengeWorkspace({
  username,
  problem,
  onBack,
}: ChallengeWorkspaceProps) {
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<number>(1);
  const selectedTestCase =
    problem.testCases.find((tc) => tc.id === selectedTestCaseId) ||
    problem.testCases[0];

  const [consoleTab, setConsoleTab] = useState<"testcase" | "result">(
    "testcase",
  );
  const [lastResult, setLastResult] = useState<{
    isCorrect: boolean;
    output: string[];
    runtime: number;
    status: "Accepted" | "Wrong Answer" | "Error";
  } | null>(null);
  const [consoleHeight, setConsoleHeight] = useState(256);
  const [isResizing, setIsResizing] = useState(false);

  const [code, setCode] = useState(problem.starterCode);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [agentMessage, setAgentMessage] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasClickedMascot, setHasClickedMascot] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const [idleTime, setIdleTime] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [deletionCount, setDeletionCount] = useState(0);
  const lastCodeLength = useRef(code.length);

  useEffect(() => {
    setCode(problem.starterCode);
    setSelectedTestCaseId(1);
    setOutput([]);
    setLastResult(null);
    setConsoleTab("testcase");
    setAgentMessage(null);
    setAgentState("idle");
    setChatMessages([]);
    setIdleTime(0);
    setErrorCount(0);
    setDeletionCount(0);
    lastCodeLength.current = problem.starterCode.length;
  }, [problem]);

  useEffect(() => {
    if (chatMessages.length === 0 && !agentMessage) {
      const welcomes = [
        `Hey ${username}! Ready to crush this problem? I'm your panda-tutor, Bamboost!`,
        `Welcome to the editor, ${username}! Let's write some clean code together.`,
        `Hi ${username}! I'm Bamboost. I'll be watching your progress and helping out if you get stuck!`,
      ];
      setAgentMessage(welcomes[Math.floor(Math.random() * welcomes.length)]);
      setAgentState("happy");

      const timer = setTimeout(() => {
        setAgentMessage(null);
        setAgentState("idle");
      }, 8000);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [chatMessages.length, agentMessage, username]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdleTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (idleTime === 30 && !agentMessage && (!isChatOpen || isMinimized)) {
      setAgentState("confused");
      setAgentMessage(
        "Need a hand with the logic? I can give you a hint in chat.",
      );
    }
  }, [agentMessage, idleTime, isChatOpen, isMinimized]);

  useEffect(() => {
    const isIdle = idleTime >= 90;
    const isErrorProne = errorCount >= 3;
    const isDeletingTooMuch = deletionCount > problem.starterCode.length * 0.4;

    const triggerHint = async () => {
      if (
        (isIdle || isErrorProne || isDeletingTooMuch) &&
        !isChatOpen &&
        chatMessages.length === 0
      ) {
        setAgentState("stuck");
        setAgentMessage(
          `Hi ${username}, kamu kelihatan stuck. Aku kirim hint ke chat ya.`,
        );

        setIsTyping(true);
        const aiHint = await getPedagogicalHint(problem.description, code);
        setIsTyping(false);

        const newMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: aiHint.hint,
          type: "observational",
          timestamp: new Date(),
        };

        setChatMessages([newMessage]);
        setIsChatOpen(true);
        setAgentState("talking");
      }
    };

    if (idleTime > 0 && (idleTime % 5 === 0 || idleTime === 90)) {
      void triggerHint();
    }
  }, [
    chatMessages.length,
    code,
    deletionCount,
    errorCount,
    idleTime,
    isChatOpen,
    problem.description,
    problem.starterCode.length,
    username,
  ]);

  const handleCodeChange = (newCode: string | undefined) => {
    if (newCode === undefined) return;

    const diff = lastCodeLength.current - newCode.length;
    if (diff > 0) {
      setDeletionCount((prev) => prev + diff);
    }

    setCode(newCode);
    lastCodeLength.current = newCode.length;
    setIdleTime(0);

    if (
      ["stuck", "talking", "sad", "confused", "mad"].includes(agentState) ||
      agentMessage
    ) {
      setAgentState("idle");
      setAgentMessage(null);
    }
  };

  const runCode = (testCaseInput?: string) => {
    setIsRunning(true);
    setAgentState("thinking");
    setOutput([]);

    const outputBuffer: string[] = [];
    let currentLine = "";

    // @ts-ignore
    Sk.configure({
      output: (text: string) => {
        currentLine += text;
        if (text.includes("\n")) {
          const lines = currentLine.split("\n");
          currentLine = lines.pop() || "";
          outputBuffer.push(...lines);
        }
      },
      read: (x: string) => {
        // @ts-ignore
        if (
          Sk.builtinFiles === undefined ||
          Sk.builtinFiles.files[x] === undefined
        ) {
          throw new Error(`File not found: '${x}'`);
        }
        // @ts-ignore
        return Sk.builtinFiles.files[x];
      },
      execLimit: 5000,
    });

    let codeToRun = code;

    if (testCaseInput && testCaseInput !== "None") {
      const functionName = problem.id.replace("-", "_");
      codeToRun += `\n\n# Auto-generated test case call\nprint(${functionName}(${testCaseInput}))`;
    }

    const startTime = performance.now();
    // @ts-ignore
    const runPromise = Sk.misceval.asyncToPromise(() => {
      // @ts-ignore
      return Sk.importMainWithBody("<stdin>", false, codeToRun, true);
    });

    runPromise.then(
      () => {
        const runtime = Math.round(performance.now() - startTime);
        if (currentLine) outputBuffer.push(currentLine);

        setIsRunning(false);
        const finalOutput = outputBuffer.filter((line) => line.trim() !== "");
        setOutput(finalOutput);

        if (finalOutput.length === 0) {
          setAgentState("confused");
          setAgentMessage(
            "I don't see any output. Did you forget to call your function or use print()?",
          );
          setLastResult({
            isCorrect: false,
            output: ["No output produced."],
            runtime,
            status: "Error",
          });
          setConsoleTab("result");
          return;
        }

        const lastOutput = finalOutput[finalOutput.length - 1]?.trim() ?? "";
        const expected = selectedTestCase.expectedOutput.trim();
        const isCorrect =
          problem.id === "fizzbuzz"
            ? problem.validator(finalOutput)
            : lastOutput === expected;

        setLastResult({
          isCorrect,
          output: finalOutput,
          runtime,
          status: isCorrect ? "Accepted" : "Wrong Answer",
        });
        setConsoleTab("result");

        if (isCorrect) {
          setAgentState("happy");
          setAgentMessage(
            `Excellent ${username}! Logic kamu sudah benar untuk test case ini.`,
          );
        } else {
          setAgentState("talking");
          setAgentMessage(
            "Output kamu belum sesuai expected result. Kita cek step-by-step ya.",
          );
        }
      },
      (err: unknown) => {
        setIsRunning(false);
        const errorMessage = String(err);
        const finalOutput = [`Error: ${errorMessage}`];
        setOutput(finalOutput);
        setLastResult({
          isCorrect: false,
          output: finalOutput,
          runtime: 0,
          status: "Error",
        });
        setConsoleTab("result");

        if (errorMessage.includes("IndentationError")) {
          setAgentState("sad");
          setAgentMessage(
            "Oops! Python sensitif soal indentasi. Cek lagi spasi di blok fungsi atau loop.",
          );
        } else {
          setAgentState("mad");
          setAgentMessage("Eksekusi gagal. Lihat detail error di panel hasil.");
        }
        setErrorCount((prev) => prev + 1);
      },
    );
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setAgentState("thinking");

    const aiHint = await getPedagogicalHint(problem.description, code, content);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: aiHint.hint,
      type: aiHint.type,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
    setAgentState("talking");
    setAgentMessage(aiHint.hint);
  };

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight > 100 && newHeight < window.innerHeight * 0.8) {
          setConsoleHeight(newHeight);
        }
      }
    },
    [isResizing],
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <div className="h-screen bg-[#a8b4af] flex flex-col font-sans text-emerald-950 overflow-hidden">
      <header className="h-16 bg-[#f0f4f2] border-b border-emerald-500/30 px-6 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-emerald-300/50 rounded-xl transition-colors mr-2 text-emerald-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-emerald-900 rounded-xl flex items-center justify-center shadow-emerald-950/20 shadow-lg">
            <span className="text-white font-bold text-xl">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-emerald-950">
            Bamboost
          </h1>
          <div className="ml-4 px-3 py-1 bg-emerald-300/60 rounded-full border border-emerald-400/50">
            <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
              Hello, {username}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-950 bg-emerald-300/40 px-3 py-1.5 rounded-lg border border-emerald-400/50">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                idleTime > 30 ? "bg-amber-700 animate-pulse" : "bg-emerald-700",
              )}
            />
            Idle: {idleTime}s | Errors: {errorCount}
          </div>
          <button
            className="p-2 hover:bg-emerald-300/50 rounded-full transition-colors"
            type="button"
          >
            <HelpCircle className="w-5 h-5 text-emerald-900" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="w-[25%] flex flex-col border-r border-emerald-500/30 bg-[#e8edea] overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-900 text-white rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black tracking-tight text-emerald-950">
                  {problem.title}
                </h2>
              </div>

              <div className="flex gap-2">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                    problem.difficulty === "Easy"
                      ? "bg-emerald-300 text-emerald-950"
                      : problem.difficulty === "Medium"
                        ? "bg-amber-300 text-amber-950"
                        : "bg-red-300 text-red-950",
                  )}
                >
                  {problem.difficulty}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-300 text-slate-900 text-[10px] font-black uppercase tracking-widest">
                  {problem.category}
                </span>
              </div>

              <div className="prose prose-emerald max-w-none">
                <p className="text-emerald-950 font-black leading-relaxed whitespace-pre-wrap text-sm">
                  {problem.description}
                </p>
              </div>
            </section>

            <section className="space-y-4 pt-8 border-t border-emerald-400/50">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700">
                Examples
              </h3>
              {problem.testCases.map((tc, index) => (
                <div key={tc.id} className="space-y-2">
                  <p className="text-[11px] font-black text-emerald-900">
                    Example {index + 1}:
                  </p>
                  <div className="bg-white/90 rounded-xl p-3 space-y-2 border border-emerald-400/50 shadow-sm">
                    <p className="text-[10px] font-mono font-black">
                      <span className="text-emerald-700">Input:</span>{" "}
                      {tc.input}
                    </p>
                    <p className="text-[10px] font-mono font-black">
                      <span className="text-emerald-700">Output:</span>{" "}
                      {tc.expectedOutput}
                    </p>
                  </div>
                </div>
              ))}
            </section>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-[#1e1e1e] min-h-0 overflow-hidden">
          <div className="h-12 bg-[#252526] px-4 flex items-center justify-between border-b border-[#3d3d3d] shrink-0">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-emerald-500" />
              <span className="text-[#cccccc] text-xs font-bold tracking-wider">
                main.py
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => runCode(selectedTestCase.input)}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-lg text-[11px] font-bold hover:bg-emerald-600/30 transition-all disabled:opacity-50"
                type="button"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Test Case
              </button>
              <button
                onClick={() => runCode()}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-500 transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20"
                type="button"
              >
                Run Code
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            <CodeEditor code={code} onChange={handleCodeChange} />
          </div>

          <div
            onMouseDown={startResizing}
            className={cn(
              "h-1.5 bg-[#3d3d3d] hover:bg-emerald-600 cursor-ns-resize transition-colors shrink-0 z-20",
              isResizing && "bg-emerald-600",
            )}
          />

          <div
            style={{ height: `${consoleHeight}px` }}
            className="bg-[#081410] border-t border-emerald-900/50 flex flex-col flex-shrink-0 overflow-hidden"
          >
            <div className="h-10 bg-[#0a1a14] px-4 flex items-center gap-4 border-b border-emerald-900/30">
              <button
                onClick={() => setConsoleTab("testcase")}
                className={cn(
                  "h-full px-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2",
                  consoleTab === "testcase"
                    ? "text-emerald-400 border-emerald-500"
                    : "text-emerald-700 border-transparent hover:text-emerald-500",
                )}
                type="button"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Testcase
              </button>
              <button
                onClick={() => setConsoleTab("result")}
                className={cn(
                  "h-full px-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2",
                  consoleTab === "result"
                    ? "text-emerald-400 border-emerald-500"
                    : "text-emerald-700 border-transparent hover:text-emerald-500",
                )}
                type="button"
              >
                <TerminalIcon className="w-3.5 h-3.5" />
                Test Result
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {consoleTab === "testcase" ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {problem.testCases.map((tc) => (
                      <button
                        key={tc.id}
                        onClick={() => setSelectedTestCaseId(tc.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                          selectedTestCaseId === tc.id
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                            : "bg-emerald-950/50 text-emerald-500 hover:bg-emerald-900/50 border border-emerald-900/30",
                        )}
                        type="button"
                      >
                        Case {tc.id}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 mb-1.5 block">
                        Input
                      </label>
                      <div className="bg-[#050d0a] border border-emerald-900/30 rounded-xl p-3 font-mono text-xs text-emerald-100">
                        {selectedTestCase.input === "None"
                          ? "No input required"
                          : selectedTestCase.input}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 mb-1.5 block">
                        Expected Output
                      </label>
                      <div className="bg-[#050d0a] border border-emerald-900/30 rounded-xl p-3 font-mono text-xs text-emerald-100 whitespace-pre-wrap">
                        {selectedTestCase.expectedOutput}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {!lastResult ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                      <div className="w-12 h-12 bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-800">
                        <Play className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-emerald-700 italic">
                        Run your code to see the results...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between border-b border-emerald-900/20 pb-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "text-lg font-black uppercase tracking-tighter",
                              lastResult.status === "Accepted"
                                ? "text-emerald-400"
                                : "text-red-400",
                            )}
                          >
                            {lastResult.status}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                            Runtime: {lastResult.runtime}ms
                          </span>
                        </div>
                        {lastResult.status === "Accepted" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 block">
                            Your Output
                          </label>
                          <div
                            className={cn(
                              "bg-[#050d0a] border rounded-xl p-3 font-mono text-xs whitespace-pre-wrap min-h-[60px]",
                              lastResult.isCorrect
                                ? "border-emerald-900/30 text-emerald-100"
                                : "border-red-900/30 text-red-100 bg-red-950/10",
                            )}
                          >
                            {lastResult.output.length > 0
                              ? lastResult.output.join("\n")
                              : "No output"}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 block">
                            Expected Output
                          </label>
                          <div className="bg-[#050d0a] border border-emerald-900/30 rounded-xl p-3 font-mono text-xs text-emerald-100 whitespace-pre-wrap min-h-[60px]">
                            {selectedTestCase.expectedOutput}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-[25%] flex flex-col border-l border-emerald-400/30 bg-white overflow-hidden">
          <div className="flex-1 flex flex-col p-6 space-y-6">
            <div className="flex flex-col items-center py-8 space-y-6">
              <button
                onClick={() => {
                  setIsChatOpen(true);
                  setHasClickedMascot(true);
                }}
                className="group relative w-48 h-48 bg-transparent rounded-[4rem] flex items-center justify-center overflow-hidden transition-all hover:scale-105 active:scale-95 border-4 border-transparent hover:border-emerald-200"
                type="button"
              >
                <div className="scale-150">
                  <PandaMascot state={agentState} />
                </div>
                {!isChatOpen && !hasClickedMascot && (
                  <div className="absolute top-4 right-4 w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                )}
              </button>

              <AnimatePresence mode="wait">
                {agentMessage && (!isChatOpen || isMinimized) && (
                  <motion.div
                    key={agentMessage}
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    className="relative bg-[#f8faf9] border-2 border-emerald-400/30 p-6 rounded-[2.5rem] shadow-xl shadow-emerald-900/10 text-center max-w-[280px]"
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#f8faf9] border-t-2 border-l-2 border-emerald-400/30 rotate-45" />
                    <p className="text-sm font-black text-emerald-950 leading-relaxed">
                      {agentMessage}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <ChatBot
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        isTyping={isTyping}
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
        agentState={agentState}
      />

      <footer className="h-8 bg-emerald-950 text-emerald-100 px-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            System Online
          </div>
          <div className="text-emerald-500/60">|</div>
          <div>Python 3.10</div>
        </div>
        <div className="flex items-center gap-4">
          <div>UTF-8</div>
          <div className="text-emerald-500/60">|</div>
          <div>Line 1, Col 1</div>
        </div>
      </footer>
    </div>
  );
}
