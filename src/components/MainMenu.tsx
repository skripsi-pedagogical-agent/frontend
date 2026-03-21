import React from 'react';
import { motion } from 'motion/react';
import { Play, CheckCircle2, ChevronRight, Sparkles, Code2, Terminal } from 'lucide-react';
import { PandaMascot } from './PandaMascot';

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
}

interface MainMenuProps {
  username: string;
  problems: Problem[];
  onSelectProblem: (problemId: string) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ username, problems, onSelectProblem }) => {
  return (
    <div className="min-h-screen bg-[#f0f4f2] flex flex-col font-sans text-emerald-950 overflow-y-auto">
      {/* Header */}
      <header className="h-20 bg-white border-b border-emerald-200 px-8 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-700 rounded-2xl flex items-center justify-center shadow-emerald-200 shadow-lg">
            <span className="text-white font-black text-2xl">{username.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-emerald-900 leading-none">Bamboost</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-1">Main Menu</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Welcome,</p>
            <p className="text-lg font-black text-emerald-900 leading-none">{username}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-8 space-y-12">
        {/* Hero Section */}
        <section className="relative bg-emerald-600 rounded-[3rem] p-12 text-white overflow-hidden shadow-2xl shadow-emerald-200">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full -ml-32 -mb-32 blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-sm">
                <Sparkles className="w-4 h-4" />
                Daily Challenge Available
              </div>
              <h2 className="text-5xl font-black tracking-tight leading-tight">Ready to chew on some code, {username}?</h2>
              <p className="text-white text-lg font-bold max-w-xl">
                I've prepared a few challenges for you today. Let's practice your Python skills together!
              </p>
            </div>
            <div className="w-48 h-48 bg-white rounded-[3rem] flex items-center justify-center shadow-2xl shrink-0 overflow-hidden">
              <div className="scale-150">
                <PandaMascot state="talking" />
              </div>
            </div>
          </div>
        </section>

        {/* Challenges Grid */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-tight text-emerald-900 flex items-center gap-3">
              <Code2 className="w-8 h-8 text-emerald-700" />
              Available Challenges
            </h3>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-600">
              <Terminal className="w-4 h-4" />
              Python 3.10
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map((problem, index) => (
              <motion.button
                key={problem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onSelectProblem(problem.id)}
                className="group relative bg-white rounded-[2rem] p-8 text-left border border-emerald-100 hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-100 transition-all active:scale-[0.98] flex flex-col h-full"
              >
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      problem.difficulty === 'Easy' ? "bg-emerald-100 text-emerald-700" :
                      problem.difficulty === 'Medium' ? "bg-amber-100 text-amber-700" :
                      "bg-rose-100 text-rose-700"
                    )}>
                      {problem.difficulty}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                      {problem.category}
                    </span>
                  </div>
                  
                  <h4 className="text-xl font-black text-emerald-900 group-hover:text-emerald-700 transition-colors">
                    {problem.title}
                  </h4>
                  
                  <p className="text-sm text-emerald-800 font-bold line-clamp-3 leading-relaxed">
                    {problem.description}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Not Started</span>
                  </div>
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-all">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      </main>

      <footer className="p-8 text-center text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em]">
        Chew Code • Grow Strong • Bamboost v1.0
      </footer>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
