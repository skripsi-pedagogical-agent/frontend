import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PandaMascotProps {
  state: 'idle' | 'thinking' | 'happy' | 'stuck' | 'talking' | 'confused' | 'sad' | 'mad';
  message?: string;
}

export const PandaMascot: React.FC<PandaMascotProps> = ({ state, message }) => {
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Left Hand */}
        <motion.div
          animate={
            state === 'happy' ? { rotate: [0, -20, 0], y: [0, -10, 0] } :
            state === 'thinking' ? { x: 10, y: -5, rotate: -10 } :
            state === 'stuck' || state === 'confused' ? { y: -25, x: 15, rotate: -40 } :
            state === 'mad' ? { x: 5, y: 5, rotate: 20 } :
            state === 'talking' ? { x: [0, -5, 0], rotate: [0, -10, 0] } :
            { y: 0, x: 0, rotate: 0 }
          }
          transition={{ duration: 0.5, repeat: state === 'happy' || state === 'talking' ? Infinity : 0 }}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-8 bg-emerald-900 rounded-full z-0 shadow-sm"
        />

        {/* Right Hand */}
        <motion.div
          animate={
            state === 'happy' ? { rotate: [0, 20, 0], y: [0, -10, 0] } :
            state === 'thinking' ? { x: -25, y: -35, rotate: 45 } : // Hand to chin
            state === 'stuck' || state === 'confused' ? { y: -25, x: -15, rotate: 40 } :
            state === 'mad' ? { x: -5, y: 5, rotate: -20 } :
            state === 'talking' ? { x: [0, 5, 0], rotate: [0, 10, 0] } :
            { y: 0, x: 0, rotate: 0 }
          }
          transition={{ duration: 0.5, repeat: state === 'happy' || state === 'talking' ? Infinity : 0 }}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-8 bg-emerald-900 rounded-full z-20 shadow-sm"
        />

        <motion.div
          animate={{
            y: [0, -5, 0],
            rotate: state === 'stuck' || state === 'confused' ? [0, -5, 5, 0] : state === 'mad' ? [0, -2, 2, 0] : 0,
            scale: state === 'happy' ? [1, 1.1, 1] : 1
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-24 h-24 relative z-10"
        >
          {/* Panda Face */}
          <div className="absolute inset-0 bg-white rounded-full border-4 border-emerald-900 shadow-lg overflow-hidden">
            {/* Ears */}
            <div className="absolute -top-1 -left-1 w-8 h-8 bg-emerald-900 rounded-full" />
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-emerald-900 rounded-full" />
            
            {/* Eye Patches */}
            <motion.div 
              animate={state === 'mad' ? { rotate: 45, y: 2 } : { rotate: 12, y: 0 }}
              className="absolute top-8 left-4 w-6 h-8 bg-emerald-900 rounded-full opacity-90" 
            />
            <motion.div 
              animate={state === 'mad' ? { rotate: -45, y: 2 } : { rotate: -12, y: 0 }}
              className="absolute top-8 right-4 w-6 h-8 bg-emerald-900 rounded-full opacity-90" 
            />
            
            {/* Eyes */}
            {state === 'happy' ? (
              <>
                <div className="absolute top-11 left-6 w-3 h-1 bg-emerald-900 rounded-full rotate-12" />
                <div className="absolute top-11 right-6 w-3 h-1 bg-emerald-900 rounded-full -rotate-12" />
              </>
            ) : state === 'confused' ? (
              <>
                <div className="absolute top-11 left-6 w-2.5 h-2.5 border-2 border-white rounded-full" />
                <div className="absolute top-10 right-6 w-2.5 h-2.5 border-2 border-white rounded-full" />
              </>
            ) : state === 'sad' || state === 'stuck' || state === 'mad' ? (
              <>
                <div className="absolute top-12 left-6 w-2 h-1 bg-emerald-900 rounded-full" />
                <div className="absolute top-12 right-6 w-2 h-1 bg-emerald-900 rounded-full" />
              </>
            ) : (
              <>
                <motion.div 
                  animate={{ scaleY: [1, 0.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.05, 0.1] }}
                  className="absolute top-11 left-6 w-2.5 h-2.5 border-2 border-white rounded-full" 
                />
                <motion.div 
                  animate={{ scaleY: [1, 0.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.05, 0.1] }}
                  className="absolute top-11 right-6 w-2.5 h-2.5 border-2 border-white rounded-full" 
                />
              </>
            )}
            
            {/* Nose */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 w-3 h-2 bg-emerald-900 rounded-full" />
            
            {/* Mouth */}
            <motion.div 
              animate={
                state === 'talking' ? { scaleY: [1, 1.5, 1] } : 
                state === 'happy' ? { scale: 1.2, y: 1 } : 
                state === 'sad' || state === 'stuck' || state === 'mad' ? { rotate: 180, y: -2 } : {}
              }
              transition={{ duration: 0.2, repeat: state === 'talking' ? Infinity : 0 }}
              className={cn(
                "absolute top-19 left-1/2 -translate-x-1/2 w-4 h-1 border-b-2 border-emerald-900 rounded-full",
                state === 'happy' && "border-b-4"
              )}
            />
          </div>
          
          {/* Thinking Bubbles */}
          <AnimatePresence>
            {state === 'thinking' && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute -top-4 -right-2 flex gap-1"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ delay: i * 0.2, repeat: Infinity }}
                    className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm"
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Speech Bubble */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mt-4 bg-white p-4 rounded-2xl shadow-xl border border-emerald-100 max-w-[200px] relative"
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-emerald-100 rotate-45" />
            <p className="text-sm text-emerald-900 font-medium leading-relaxed">
              {message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
