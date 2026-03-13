import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, MessageSquare, HelpCircle, Terminal as TerminalIcon, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { PandaMascot } from './components/PandaMascot';
import { CodeEditor } from './components/CodeEditor';
import { ChatBot, type Message } from './components/ChatBot';
import { getPedagogicalHint } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
// @ts-ignore
import Sk from 'skulpt';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Problem definition
const PROBLEM = {
  title: "FizzBuzz Challenge",
  description: `Write a program that prints the numbers from 1 to 100.
  
But for multiples of three print "Fizz" instead of the number and for the multiples of five print "Buzz". For numbers which are multiples of both three and five print "FizzBuzz".`,
  starterCode: `def fizzbuzz():
    # Your code here
    pass

fizzbuzz()`,
};

type AgentState = 'idle' | 'thinking' | 'happy' | 'stuck' | 'talking' | 'confused' | 'sad' | 'mad';

export default function App() {
  const [code, setCode] = useState(PROBLEM.starterCode);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [agentMessage, setAgentMessage] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // Behavioral Metrics State
  const [idleTime, setIdleTime] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [deletionCount, setDeletionCount] = useState(0);
  const lastCodeLength = useRef(code.length);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Stuck Detection Logic
  const checkStuck = useCallback(async () => {
    // STUCK DETECTED IF: (Idle Time > 60s) OR (3x Errors in 2 minutes) OR (Deletion Rate > 40%)
    const isIdle = idleTime >= 60;
    const isErrorProne = errorCount >= 3;
    const isDeletingTooMuch = deletionCount > (PROBLEM.starterCode.length * 0.4);

    if ((isIdle || isErrorProne || isDeletingTooMuch) && !isChatOpen && chatMessages.length === 0) {
      setAgentState('stuck');
      const proactiveMessage = "Hi! I noticed you might be stuck. Would you like a small nudge to help you move forward?";
      setAgentMessage(proactiveMessage);
      
      // Trigger Observational Mode Hint
      setIsTyping(true);
      const aiHint = await getPedagogicalHint(PROBLEM.description, code);
      setIsTyping(false);

      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: aiHint.hint,
        type: 'observational',
        timestamp: new Date()
      };
      
      setChatMessages([newMessage]);
      setIsChatOpen(true);
      setAgentState('talking');
    }
  }, [idleTime, errorCount, deletionCount, code, isChatOpen, chatMessages.length]);

  // 2. Idle Tracking (Now based on code changes)
  useEffect(() => {
    const interval = setInterval(() => {
      setIdleTime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // 3. Code Change Tracking (Deletion Rate)
  const handleCodeChange = (newCode: string | undefined) => {
    if (newCode === undefined) return;
    
    const diff = lastCodeLength.current - newCode.length;
    if (diff > 0) {
      setDeletionCount(prev => prev + diff);
    }
    
    setCode(newCode);
    lastCodeLength.current = newCode.length;
    setIdleTime(0);
    
    // Reset agent if they were stuck/talking/sad/confused/mad
    if (['stuck', 'talking', 'sad', 'confused', 'mad'].includes(agentState)) {
      setAgentState('idle');
      setAgentMessage(null);
    }
  };

  const checkFizzBuzzCorrectness = (outputLines: string[]) => {
    if (outputLines.length < 100) return false;
    // We check the first 100 lines
    for (let i = 1; i <= 100; i++) {
      let expected = "";
      if (i % 3 === 0 && i % 5 === 0) expected = "FizzBuzz";
      else if (i % 3 === 0) expected = "Fizz";
      else if (i % 5 === 0) expected = "Buzz";
      else expected = i.toString();
      
      if (outputLines[i-1].trim() !== expected) return false;
    }
    return true;
  };

  // 4. Real Python Interpreter using Skulpt
  const runCode = () => {
    setIsRunning(true);
    setAgentState('thinking');
    setOutput([]); // Clear terminal on run
    
    const outputBuffer: string[] = [];
    let currentLine = "";

    // @ts-ignore
    Sk.configure({
      output: (text: string) => {
        currentLine += text;
        if (text.includes('\n')) {
          const lines = currentLine.split('\n');
          currentLine = lines.pop() || "";
          outputBuffer.push(...lines);
        }
      },
      read: (x: string) => {
        // @ts-ignore
        if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
          throw "File not found: '" + x + "'";
        // @ts-ignore
        return Sk.builtinFiles["files"][x];
      },
      // Limit execution to prevent infinite loops
      execLimit: 5000, 
    });

    // @ts-ignore
    const myPromise = Sk.misceval.asyncToPromise(() => {
      // @ts-ignore
      return Sk.importMainWithBody("<stdin>", false, code, true);
    });

    myPromise.then(
      () => {
        if (currentLine) outputBuffer.push(currentLine);
        
        setIsRunning(false);
        const finalOutput = outputBuffer.filter(l => l.trim() !== "");
        setOutput(finalOutput);

        if (finalOutput.length === 0) {
          setAgentState('confused');
          setAgentMessage("I don't see any output. Did you forget to call your function or use print()?");
          return;
        }

        const isCorrect = checkFizzBuzzCorrectness(finalOutput);
        if (isCorrect) {
          setAgentState('happy');
          setAgentMessage("Excellent! Your FizzBuzz logic is correct and working perfectly.");
        } else {
          setAgentState('talking');
          setAgentMessage("I've run your code! It produced output, but it doesn't quite match the FizzBuzz rules yet. Check the terminal!");
        }
      },
      (err: any) => {
        setIsRunning(false);
        const errorMessage = err.toString();
        setOutput([`Error: ${errorMessage}`]);
        
        if (errorMessage.includes("IndentationError")) {
          setAgentState('sad');
          setAgentMessage("Oops! Python is very picky about indentation. Make sure your code inside the function and loop is indented correctly.");
        } else {
          setAgentState('mad');
          setAgentMessage("Something went wrong with the execution. Check the error message in the terminal!");
        }
        setErrorCount(prev => prev + 1);
      }
    );
  };

  // Check for stuck state periodically
  useEffect(() => {
    const timer = setInterval(checkStuck, 5000);
    return () => clearInterval(timer);
  }, [checkStuck]);

  // 5. Chat Handlers
  const handleSendMessage = async (content: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setAgentState('thinking');

    const aiHint = await getPedagogicalHint(PROBLEM.description, code, content);
    
    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiHint.hint,
      type: aiHint.type,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, assistantMsg]);
    setIsTyping(false);
    setAgentState('talking');
    setAgentMessage(aiHint.hint);
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col font-sans text-emerald-950">
      {/* Header */}
      <header className="h-16 bg-white border-b border-emerald-100 px-6 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-emerald-200 shadow-lg">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-emerald-900">Bamboost</h1>
          <div className="ml-4 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Pedagogical Agent v1.0</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50/50 px-3 py-1.5 rounded-lg border border-emerald-100">
            <div className={cn("w-2 h-2 rounded-full", idleTime > 30 ? "bg-amber-400 animate-pulse" : "bg-emerald-400")} />
            Idle: {idleTime}s | Errors: {errorCount}
          </div>
          <button className="p-2 hover:bg-emerald-50 rounded-full transition-colors">
            <HelpCircle className="w-5 h-5 text-emerald-600" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* ChatBot Component */}
        <ChatBot 
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
          isOpen={isChatOpen}
          setIsOpen={setIsChatOpen}
        />

        {/* Floating Chat Button */}
        {!isChatOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-8 right-8 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:bg-emerald-500 transition-colors"
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}

        {/* Left Panel: Problem & Agent */}
        <div className="w-1/3 flex flex-col border-r border-emerald-100 bg-white overflow-y-auto">
          <div className="p-8 space-y-8">
            {/* Mascot Section */}
            <div className="flex justify-center py-4">
              <PandaMascot state={agentState} message={agentMessage || undefined} />
            </div>

            {/* Problem Description */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-emerald-900">{PROBLEM.title}</h2>
              </div>
              <div className="prose prose-emerald max-w-none">
                <p className="text-emerald-800 leading-relaxed whitespace-pre-wrap">
                  {PROBLEM.description}
                </p>
              </div>
            </section>

            {/* Hint Section */}
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Pedagogical Hint
                    </h3>
                    <button 
                      onClick={() => setShowHint(false)}
                      className="text-emerald-400 hover:text-emerald-600"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-emerald-800 italic leading-relaxed">
                    "Think about how you can use the modulo operator (%) to check if a number is divisible by 3 or 5. What happens if both are true?"
                  </p>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors">
                      Planning Hint
                    </button>
                    <button className="flex-1 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors">
                      Debugging Hint
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Panel: Editor & Terminal */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e] min-h-0 overflow-hidden">
          {/* Editor Toolbar */}
          <div className="h-12 bg-[#2d2d2d] border-b border-[#3d3d3d] px-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[#cccccc] text-sm font-medium">
                <ChevronRight className="w-4 h-4" />
                main.py
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={runCode}
                disabled={isRunning}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-lg",
                  isRunning 
                    ? "bg-emerald-800 text-emerald-400 cursor-not-allowed" 
                    : "bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95"
                )}
              >
                <Play className={cn("w-4 h-4", isRunning && "animate-pulse")} />
                {isRunning ? "Running..." : "Run Code"}
              </button>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 relative">
            <CodeEditor code={code} onChange={handleCodeChange} />
          </div>

          {/* Terminal Area */}
          <div className="h-48 bg-[#1e1e1e] border-t border-[#3d3d3d] flex flex-col flex-shrink-0">
            <div className="h-10 bg-[#252526] px-4 flex items-center gap-2 border-b border-[#3d3d3d]">
              <TerminalIcon className="w-4 h-4 text-[#cccccc]" />
              <span className="text-[#cccccc] text-xs font-bold uppercase tracking-wider">Output Terminal</span>
            </div>
            <div className="flex-1 p-4 font-mono text-sm overflow-y-auto">
              {output.length === 0 ? (
                <div className="text-[#555555] italic">Run your code to see the output...</div>
              ) : (
                output.map((line, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "mb-1",
                      line.startsWith("Error") ? "text-red-400" : "text-emerald-400"
                    )}
                  >
                    <span className="text-[#555555] mr-2">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-8 bg-emerald-900 text-emerald-100 px-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            System Online
          </div>
          <div className="text-emerald-400/60">|</div>
          <div>Python 3.10</div>
        </div>
        <div className="flex items-center gap-4">
          <div>UTF-8</div>
          <div className="text-emerald-400/60">|</div>
          <div>Line 1, Col 1</div>
        </div>
      </footer>
    </div>
  );
}
