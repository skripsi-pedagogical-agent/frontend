import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { PandaMascot } from './PandaMascot';

interface SplashPageProps {
  onComplete: (name: string) => void;
}

export const SplashPage: React.FC<SplashPageProps> = ({ onComplete }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f2] flex flex-col items-center justify-center p-6 font-sans text-emerald-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-200/50 p-10 border border-emerald-100 relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-100/30 rounded-full -ml-16 -mb-16 blur-3xl opacity-50" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-8">
          <div className="w-32 h-32 bg-emerald-50 rounded-[2rem] flex items-center justify-center shadow-inner overflow-hidden">
            <div className="scale-110">
              <PandaMascot state="happy" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-emerald-900">Bamboost</h1>
            <p className="text-emerald-700 font-bold">Tutor coding Socratic yang ramah Anda</p>
          </div>

          <div className="w-full space-y-6">
            <div className="space-y-2 text-left">
              <label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-emerald-600 ml-1">
                Siapa nama Anda?
              </label>
              <form onSubmit={handleSubmit} className="relative group">
                <input
                  autoFocus
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama Anda..."
                  className="w-full bg-emerald-50 border-2 border-emerald-200 rounded-2xl py-4 px-6 text-lg font-bold text-emerald-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all placeholder:text-emerald-400"
                />
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-200"
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              </form>
            </div>

            <div className="flex items-center gap-2 justify-center text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">
              <Sparkles className="w-3 h-3" />
              Siap untuk mengunyah beberapa kode?
            </div>
          </div>
        </div>
      </motion.div>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-emerald-700 text-xs font-black uppercase tracking-widest"
      >
        Python 3.10 • Pedagogical Agent v1.0
      </motion.p>
    </div>
  );
};
