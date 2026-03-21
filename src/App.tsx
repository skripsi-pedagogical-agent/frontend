import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, MessageSquare, HelpCircle, Terminal as TerminalIcon, ChevronRight, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { PandaMascot } from './components/PandaMascot';
import { CodeEditor } from './components/CodeEditor';
import { ChatBot, type Message } from './components/ChatBot';
import { SplashPage } from './components/SplashPage';
import { MainMenu } from './components/MainMenu';
import { getPedagogicalHint } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
// @ts-ignore
import Sk from 'skulpt';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TestCase {
  id: number;
  input: string;
  expectedOutput: string;
}

interface Problem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  description: string;
  starterCode: string;
  testCases: TestCase[];
  validator: (outputLines: string[]) => boolean;
}

// Problem definitions
const PROBLEMS: Problem[] = [
  {
    id: "fizzbuzz",
    title: "FizzBuzz Challenge",
    difficulty: "Easy",
    category: "Logic",
    description: `Write a program that prints the numbers from 1 to 100.
    
But for multiples of three print "Fizz" instead of the number and for the multiples of five print "Buzz". For numbers which are multiples of both three and five print "FizzBuzz".`,
    starterCode: `def fizzbuzz():
    for i in range(1, 101):
        if i % 3 == 0 and i % 5 == 0:
            print("FizzBuzz")
        elif i % 3 == 0:
            print("Fizz")
        elif i % 5 == 0:
            print("Buzz")
        else:
            print(i)

fizzbuzz()`,
    testCases: [
      { id: 1, input: "None", expectedOutput: "1\n2\nFizz\n4\nBuzz\n..." },
      { id: 2, input: "None", expectedOutput: "...98\nFizz\nBuzz" }
    ],
    validator: (outputLines: string[]) => {
      if (outputLines.length < 100) return false;
      for (let i = 1; i <= 100; i++) {
        let expected = "";
        if (i % 3 === 0 && i % 5 === 0) expected = "FizzBuzz";
        else if (i % 3 === 0) expected = "Fizz";
        else if (i % 5 === 0) expected = "Buzz";
        else expected = i.toString();
        if (outputLines[i-1]?.trim() !== expected) return false;
      }
      return true;
    }
  },
  {
    id: "sum-list",
    title: "Sum of a List",
    difficulty: "Easy",
    category: "Arrays",
    description: `Write a function sum_list(numbers) that takes a list of numbers and returns their sum.`,
    starterCode: `def sum_list(numbers):
    # Your code here
    pass

# Test your function
print(sum_list([1, 2, 3, 4, 5]))`,
    testCases: [
      { id: 1, input: "[1, 2, 3, 4, 5]", expectedOutput: "15" },
      { id: 2, input: "[10, -5, 20]", expectedOutput: "25" },
      { id: 3, input: "[]", expectedOutput: "0" }
    ],
    validator: (outputLines: string[]) => outputLines.length > 0
  },
  {
    id: "palindrome",
    title: "Palindrome Checker",
    difficulty: "Medium",
    category: "Strings",
    description: `Write a function is_palindrome(s) that checks if a string is a palindrome.`,
    starterCode: `def is_palindrome(s):
    # Your code here
    pass

# Test your function
print(is_palindrome("racecar"))`,
    testCases: [
      { id: 1, input: '"racecar"', expectedOutput: "True" },
      { id: 2, input: '"python"', expectedOutput: "False" }
    ],
    validator: (outputLines: string[]) => outputLines.length > 0
  },
  {
    id: "fib",
    title: "Fibonacci Sequence",
    difficulty: "Medium",
    category: "Recursion",
    description: `Write a function fib(n) that returns the n-th Fibonacci number.
    
The sequence starts: 0, 1, 1, 2, 3, 5, 8, 13, 21, ...
fib(0) = 0
fib(1) = 1`,
    starterCode: `def fib(n):
    # Your code here
    pass

# Test your function
print(fib(6))`,
    testCases: [
      { id: 1, input: "6", expectedOutput: "8" },
      { id: 2, input: "10", expectedOutput: "55" },
      { id: 3, input: "0", expectedOutput: "0" }
    ],
    validator: (outputLines: string[]) => outputLines.length > 0
  }
];

type AgentState = 'idle' | 'thinking' | 'happy' | 'stuck' | 'talking' | 'confused' | 'sad' | 'mad';
type View = 'splash' | 'menu' | 'editor';

export default function App() {
  const [view, setView] = useState<View>('splash');
  const [username, setUsername] = useState('');
  const [currentProblemId, setCurrentProblemId] = useState<string | null>(null);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<number>(1);
  
  const currentProblem = PROBLEMS.find(p => p.id === currentProblemId) || PROBLEMS[0];
  const selectedTestCase = currentProblem.testCases.find(tc => tc.id === selectedTestCaseId) || currentProblem.testCases[0];

  const [consoleTab, setConsoleTab] = useState<'testcase' | 'result'>('testcase');
  const [lastResult, setLastResult] = useState<{ 
    isCorrect: boolean; 
    output: string[]; 
    runtime: number;
    status: 'Accepted' | 'Wrong Answer' | 'Error';
  } | null>(null);
  const [consoleHeight, setConsoleHeight] = useState(256);
  const [isResizing, setIsResizing] = useState(false);

  const [code, setCode] = useState(currentProblem.starterCode);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [agentMessage, setAgentMessage] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasClickedMascot, setHasClickedMascot] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // Behavioral Metrics State
  const [idleTime, setIdleTime] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [deletionCount, setDeletionCount] = useState(0);
  const lastCodeLength = useRef(code.length);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Stuck Detection Logic
  useEffect(() => {
    if (view !== 'editor') return;

    const check = async () => {
      // IDLE COMMENT IF: (Idle Time > 30s)
      if (idleTime >= 30 && !agentMessage && (!isChatOpen || isMinimized)) {
        const idleMessages = [
          "Need a hand with the logic?",
          "I'm here if you need a hint!",
          "Take your time, I'm just watching!",
          "Stuck on a tricky part?",
          "Bamboost is ready to help!",
          "Thinking through the next step?",
          "Don't be shy to ask for a nudge!",
          "I wonder if there's a more efficient way to do this...",
          "You're doing great! Keep going!",
          "Coding is like a puzzle, and you're solving it!",
          "Maybe we should check the constraints again?",
          "I'm getting hungry... for some clean code!",
          "Is that a bug I see? No, just a feature in progress!"
        ];
        const randomMessage = idleMessages[Math.floor(Math.random() * idleMessages.length)];
        setAgentMessage(randomMessage);
        setAgentState('confused');
      }

      // STUCK DETECTED IF: (Idle Time > 90s) OR (3x Errors in 2 minutes) OR (Deletion Rate > 40%)
      const isIdle = idleTime >= 90;
      const isErrorProne = errorCount >= 3;
      const isDeletingTooMuch = deletionCount > (currentProblem.starterCode.length * 0.4);

      if ((isIdle || isErrorProne || isDeletingTooMuch) && !isChatOpen && chatMessages.length === 0) {
        setAgentState('stuck');
        const proactiveMessages = [
          `Hi ${username}! I noticed you might be stuck. I've prepared a little hint for you in the chat!`,
          `Hey ${username}, don't let this one get you down! I've got a small nudge for you in the chat.`,
          `Panda-power to the rescue! I've got a hint waiting for you in the chat, ${username}.`,
          `I see you're working hard, ${username}! If you need a fresh perspective, I've left a hint in the chat.`,
          `Stuck on a tricky bit? No worries! I've got a little something to help you move forward in the chat.`
        ];
        const proactiveMessage = proactiveMessages[Math.floor(Math.random() * proactiveMessages.length)];
        setAgentMessage(proactiveMessage);
        
        // Trigger Observational Mode Hint
        setIsTyping(true);
        const aiHint = await getPedagogicalHint(currentProblem.description, code);
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
    };

    // Only run check if idleTime is a multiple of 5 or at specific thresholds
    if (idleTime > 0 && (idleTime % 5 === 0 || idleTime === 30 || idleTime === 90)) {
      check();
    }
  }, [idleTime, errorCount, deletionCount, code, isChatOpen, chatMessages.length, view, username, currentProblem, agentMessage]);

  // Welcome Message
  useEffect(() => {
    if (view === 'editor' && chatMessages.length === 0 && !agentMessage) {
      const welcomes = [
        `Hey ${username}! Ready to crush this problem? I'm your panda-tutor, Bamboost! I'll be here to help you every step of the way. If you ever feel like you're hitting a wall, just click on me and we can talk it through!`,
        `Welcome to the editor, ${username}! Let's write some clean code together. I've got my eyes on the logic, so feel free to experiment. If you get stuck, I've got plenty of hints ready for you!`,
        `Hi ${username}! I'm Bamboost. I'll be watching your progress and helping out if you get stuck! Coding can be tricky, but with a bit of panda-power, we'll solve this in no time!`,
        `Great to see you, ${username}! This problem looks fun. Don't worry, I've got your back if things get tricky. I'm really good at spotting those sneaky little bugs!`,
        `Ready for a challenge, ${username}? I've got my bamboo snacks ready and I'm all set to help you code! What's our first move?`,
        `Hello ${username}! I'm so excited to see how you solve this one. Remember, there are no mistakes, only learning opportunities! I'm here to support you!`,
        `Bamboost reporting for duty, ${username}! Let's make some magic happen with Python. I'm all ears (and paws) if you need any guidance!`
      ];
      setAgentMessage(welcomes[Math.floor(Math.random() * welcomes.length)]);
      setAgentState('happy');
      
      // Clear welcome after 15 seconds
      const timer = setTimeout(() => {
        setAgentMessage(null);
        setAgentState('idle');
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [view, username]);

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
    
    // Reset agent if they were stuck/talking/sad/confused/mad/idle-commenting
    if (['stuck', 'talking', 'sad', 'confused', 'mad'].includes(agentState) || agentMessage) {
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
  const runCode = (testCaseInput?: string) => {
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

    // Prepare code to run
    let codeToRun = code;
    
    // If a test case input is provided, we try to call the function with it
    // This assumes the user has defined the function as requested
    if (testCaseInput && testCaseInput !== "None") {
      const functionName = currentProblem.id.replace('-', '_');
      // Append a call to the function with the test case input
      codeToRun += `\n\n# Auto-generated test case call\nprint(${functionName}(${testCaseInput}))`;
    }

    const startTime = performance.now();
    // @ts-ignore
    const myPromise = Sk.misceval.asyncToPromise(() => {
      // @ts-ignore
      return Sk.importMainWithBody("<stdin>", false, codeToRun, true);
    });

    myPromise.then(
      () => {
        const endTime = performance.now();
        const runtime = Math.round(endTime - startTime);
        if (currentLine) outputBuffer.push(currentLine);
        
        setIsRunning(false);
        const finalOutput = outputBuffer.filter(l => l.trim() !== "");
        setOutput(finalOutput);

        if (finalOutput.length === 0) {
          setAgentState('confused');
          setAgentMessage("I don't see any output. Did you forget to call your function or use print()?");
          setLastResult({ isCorrect: false, output: ["No output produced."], runtime, status: 'Error' });
          setConsoleTab('result');
          return;
        }

        // Check if the output matches the expected output
        const lastOutput = finalOutput[finalOutput.length - 1].trim();
        const expected = selectedTestCase.expectedOutput.trim();
        
        const isCorrect = currentProblem.id === 'fizzbuzz' 
          ? currentProblem.validator(finalOutput)
          : lastOutput === expected;

        setLastResult({ 
          isCorrect, 
          output: finalOutput, 
          runtime, 
          status: isCorrect ? 'Accepted' : 'Wrong Answer' 
        });
        setConsoleTab('result');

        if (isCorrect) {
          setAgentState('happy');
          setAgentMessage(`Excellent ${username}! Your logic is correct for this test case.`);
        } else {
          setAgentState('talking');
          setAgentMessage("I've run your code! It produced output, but it doesn't match the expected result for this test case.");
        }
      },
      (err: any) => {
        setIsRunning(false);
        const errorMessage = err.toString();
        const finalOutput = [`Error: ${errorMessage}`];
        setOutput(finalOutput);
        setLastResult({ isCorrect: false, output: finalOutput, runtime: 0, status: 'Error' });
        setConsoleTab('result');
        
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

    const aiHint = await getPedagogicalHint(currentProblem.description, code, content);
    
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

  const handleSplashComplete = (name: string) => {
    setUsername(name);
    setView('menu');
  };

  const handleSelectProblem = (id: string) => {
    const problem = PROBLEMS.find(p => p.id === id);
    if (problem) {
      setCurrentProblemId(id);
      setCode(problem.starterCode);
      setOutput([]);
      setChatMessages([]);
      setAgentMessage(null);
      setAgentState('idle');
      setIdleTime(0);
      setErrorCount(0);
      setDeletionCount(0);
      setSelectedTestCaseId(1);
      setView('editor');
    }
  };

  // 6. Resize Handler
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight > 100 && newHeight < window.innerHeight * 0.8) {
        setConsoleHeight(newHeight);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  if (view === 'splash') {
    return <SplashPage onComplete={handleSplashComplete} />;
  }

  if (view === 'menu') {
    return <MainMenu username={username} problems={PROBLEMS} onSelectProblem={handleSelectProblem} />;
  }

  return (
    <div className="h-screen bg-[#a8b4af] flex flex-col font-sans text-emerald-950 overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-[#f0f4f2] border-b border-emerald-500/30 px-6 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setView('menu')}
            className="p-2 hover:bg-emerald-300/50 rounded-xl transition-colors mr-2 text-emerald-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-emerald-900 rounded-xl flex items-center justify-center shadow-emerald-950/20 shadow-lg">
            <span className="text-white font-bold text-xl">{username.charAt(0).toUpperCase()}</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-emerald-950">Bamboost</h1>
          <div className="ml-4 px-3 py-1 bg-emerald-300/60 rounded-full border border-emerald-400/50">
            <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">Hello, {username}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-950 bg-emerald-300/40 px-3 py-1.5 rounded-lg border border-emerald-400/50">
            <div className={cn("w-2 h-2 rounded-full", idleTime > 30 ? "bg-amber-700 animate-pulse" : "bg-emerald-700")} />
            Idle: {idleTime}s | Errors: {errorCount}
          </div>
          <button className="p-2 hover:bg-emerald-300/50 rounded-full transition-colors">
            <HelpCircle className="w-5 h-5 text-emerald-900" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Problem Description */}
        <div className="w-[25%] flex flex-col border-r border-emerald-500/30 bg-[#e8edea] overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-8">
            {/* Problem Header */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-900 text-white rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black tracking-tight text-emerald-950">{currentProblem.title}</h2>
              </div>
              
              <div className="flex gap-2">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                  currentProblem.difficulty === "Easy" ? "bg-emerald-300 text-emerald-950" :
                  currentProblem.difficulty === "Medium" ? "bg-amber-300 text-amber-950" : "bg-red-300 text-red-950"
                )}>
                  {currentProblem.difficulty}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-300 text-slate-900 text-[10px] font-black uppercase tracking-widest">
                  {currentProblem.category}
                </span>
              </div>

              <div className="prose prose-emerald max-w-none">
                <p className="text-emerald-950 font-black leading-relaxed whitespace-pre-wrap text-sm">
                  {currentProblem.description}
                </p>
              </div>
            </section>

            {/* Constraints or Examples could go here */}
            <section className="space-y-4 pt-8 border-t border-emerald-400/50">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700">Examples</h3>
              {currentProblem.testCases.map((tc, idx) => (
                <div key={tc.id} className="space-y-2">
                  <p className="text-[11px] font-black text-emerald-900">Example {idx + 1}:</p>
                  <div className="bg-white/90 rounded-xl p-3 space-y-2 border border-emerald-400/50 shadow-sm">
                    <p className="text-[10px] font-mono font-black"><span className="text-emerald-700">Input:</span> {tc.input}</p>
                    <p className="text-[10px] font-mono font-black"><span className="text-emerald-700">Output:</span> {tc.expectedOutput}</p>
                  </div>
                </div>
              ))}
            </section>
          </div>
        </div>

        {/* Middle Panel: Editor & Console */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e] min-h-0 overflow-hidden">
          {/* Editor Header */}
          <div className="h-12 bg-[#252526] px-4 flex items-center justify-between border-b border-[#3d3d3d] shrink-0">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-emerald-500" />
              <span className="text-[#cccccc] text-xs font-bold tracking-wider">main.py</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => runCode(selectedTestCase.input)}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-lg text-[11px] font-bold hover:bg-emerald-600/30 transition-all disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Test Case
              </button>
              <button 
                onClick={() => runCode()}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-500 transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20"
              >
                Run Code
              </button>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 relative">
            <CodeEditor code={code} onChange={handleCodeChange} />
          </div>

          {/* Resizer Handle */}
          <div 
            onMouseDown={startResizing}
            className={cn(
              "h-1.5 bg-[#3d3d3d] hover:bg-emerald-600 cursor-ns-resize transition-colors shrink-0 z-20",
              isResizing && "bg-emerald-600"
            )}
          />

          {/* Console Area (Darker Theme) */}
          <div 
            style={{ height: `${consoleHeight}px` }}
            className="bg-[#081410] border-t border-emerald-900/50 flex flex-col flex-shrink-0 overflow-hidden"
          >
            {/* Console Tabs */}
            <div className="h-10 bg-[#0a1a14] px-4 flex items-center gap-4 border-b border-emerald-900/30">
              <button 
                onClick={() => setConsoleTab('testcase')}
                className={cn(
                  "h-full px-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2",
                  consoleTab === 'testcase' ? "text-emerald-400 border-emerald-500" : "text-emerald-700 border-transparent hover:text-emerald-500"
                )}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Testcase
              </button>
              <button 
                onClick={() => setConsoleTab('result')}
                className={cn(
                  "h-full px-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2",
                  consoleTab === 'result' ? "text-emerald-400 border-emerald-500" : "text-emerald-700 border-transparent hover:text-emerald-500"
                )}
              >
                <TerminalIcon className="w-3.5 h-3.5" />
                Test Result
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {consoleTab === 'testcase' ? (
                <div className="space-y-4">
                  {/* Case Selection within Tab */}
                  <div className="flex gap-2">
                    {currentProblem.testCases.map((tc) => (
                      <button
                        key={tc.id}
                        onClick={() => setSelectedTestCaseId(tc.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                          selectedTestCaseId === tc.id 
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40" 
                            : "bg-emerald-950/50 text-emerald-500 hover:bg-emerald-900/50 border border-emerald-900/30"
                        )}
                      >
                        Case {tc.id}
                      </button>
                    ))}
                  </div>

                  {/* Input Display */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 mb-1.5 block">Input</label>
                      <div className="bg-[#050d0a] border border-emerald-900/30 rounded-xl p-3 font-mono text-xs text-emerald-100">
                        {selectedTestCase.input === "None" ? "No input required" : selectedTestCase.input}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 mb-1.5 block">Expected Output</label>
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
                      <p className="text-xs font-bold text-emerald-700 italic">Run your code to see the results...</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Status Header */}
                      <div className="flex items-center justify-between border-b border-emerald-900/20 pb-3">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-lg font-black uppercase tracking-tighter",
                            lastResult.status === 'Accepted' ? "text-emerald-400" : "text-red-400"
                          )}>
                            {lastResult.status}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                            Runtime: {lastResult.runtime}ms
                          </span>
                        </div>
                        {lastResult.status === 'Accepted' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>

                      {/* Result Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 block">Your Output</label>
                          <div className={cn(
                            "bg-[#050d0a] border rounded-xl p-3 font-mono text-xs whitespace-pre-wrap min-h-[60px]",
                            lastResult.isCorrect ? "border-emerald-900/30 text-emerald-100" : "border-red-900/30 text-red-100 bg-red-950/10"
                          )}>
                            {lastResult.output.length > 0 ? lastResult.output.join('\n') : "No output"}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 block">Expected Output</label>
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

        {/* Right Panel: Mascot & ChatBot */}
        <div className="w-[25%] flex flex-col border-l border-emerald-400/30 bg-white overflow-hidden">
          <div className="flex-1 flex flex-col p-6 space-y-6">
            {/* Mascot Section */}
            <div className="flex flex-col items-center py-8 space-y-6">
              <button 
                onClick={() => {
                  setIsChatOpen(true);
                  setHasClickedMascot(true);
                }}
                className="group relative w-48 h-48 bg-transparent rounded-[4rem] flex items-center justify-center overflow-hidden transition-all hover:scale-105 active:scale-95 border-4 border-transparent hover:border-emerald-200"
              >
                <div className="scale-150">
                  <PandaMascot state={agentState} />
                </div>
                {/* Message Bubble Indicator */}
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

      {/* Floating ChatBot */}
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

      {/* Footer / Status Bar */}
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
