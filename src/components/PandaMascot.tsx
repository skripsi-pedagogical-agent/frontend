import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PandaMascotProps {
  state:
    | "idle"
    | "thinking"
    | "happy"
    | "stuck"
    | "talking"
    | "confused"
    | "sad"
    | "mad";
  message?: string;
}

export const PandaMascot: React.FC<PandaMascotProps> = ({ state, message }) => {
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Left Hand */}
        <motion.div
          animate={
            state === "happy"
              ? { rotate: [0, -26, 0], y: [0, -12, 0], x: [0, -6, 0] }
              : state === "thinking"
                ? { x: 8, y: -8, rotate: -15 } // Lebih rileks
                : state === "stuck" || state === "confused"
                  ? {
                      y: [-25, -35, -25],
                      x: [15, 20, 15],
                      rotate: [-35, -45, -35],
                    } // Garuk kepala lebih tinggi dan fokus
                  : state === "mad"
                    ? { x: [6, 10, 6], y: [0, -2, 0], rotate: [20, 32, 20] }
                    : state === "talking"
                      ? { x: [0, -7, 0], y: [0, -4, 0], rotate: [0, -14, 0] }
                      : { y: 0, x: 0, rotate: 0 }
          }
          transition={
            state === "happy" ||
            state === "talking" ||
            state === "stuck" ||
            state === "confused" ||
            state === "mad"
              ? {
                  duration:
                    state === "happy" ? 0.55 : state === "talking" ? 0.45 : 0.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : { type: "spring", stiffness: 240, damping: 20 }
          }
          style={{ transformOrigin: "top center" }}
          className="absolute left-4 top-[65%] w-7 h-9 bg-emerald-900 rounded-full z-20 shadow-md border-2 border-white/10"
        />

        {/* Right Hand */}
        <motion.div
          animate={
            state === "happy"
              ? { rotate: [0, 26, 0], y: [0, -12, 0], x: [0, 6, 0] }
              : state === "thinking"
                ? { x: -14, y: -22, rotate: 25 } // Hand to chin diturunkan agar tidak menutupi mata
                : state === "stuck" || state === "confused"
                  ? {
                      y: [-20, -30, -20],
                      x: [-12, -18, -12],
                      rotate: [30, 40, 30],
                    } // Garuk kepala kanan lebih tinggi
                  : state === "mad"
                    ? {
                        x: [-6, -10, -6],
                        y: [0, -2, 0],
                        rotate: [-20, -32, -20],
                      }
                    : state === "talking"
                      ? { x: [0, 7, 0], y: [0, -4, 0], rotate: [0, 14, 0] }
                      : { y: 0, x: 0, rotate: 0 }
          }
          transition={
            state === "happy" ||
            state === "talking" ||
            state === "stuck" ||
            state === "confused" ||
            state === "mad"
              ? {
                  duration:
                    state === "happy" ? 0.55 : state === "talking" ? 0.45 : 0.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : { type: "spring", stiffness: 240, damping: 20 }
          }
          style={{ transformOrigin: "top center" }}
          className="absolute right-4 top-[65%] w-7 h-9 bg-emerald-900 rounded-full z-20 shadow-md border-2 border-white/10"
        />

        <motion.div
          animate={{
            y: [0, -5, 0],
            rotate:
              state === "stuck" || state === "confused"
                ? [0, -5, 5, 0]
                : state === "mad"
                  ? [0, -2, 2, 0]
                  : 0,
            scale: state === "happy" ? [1, 1.1, 1] : 1,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
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
              animate={
                state === "mad" ? { rotate: 45, y: 2 } : { rotate: 12, y: 0 }
              }
              className="absolute top-8 left-4 w-6 h-8 bg-emerald-900 rounded-full opacity-90"
            />
            <motion.div
              animate={
                state === "mad" ? { rotate: -45, y: 2 } : { rotate: -12, y: 0 }
              }
              className="absolute top-8 right-4 w-6 h-8 bg-emerald-900 rounded-full opacity-90"
            />

            {/* Eyes */}
            {state === "happy" ? (
              <>
                <div className="absolute top-11 left-6 w-3 h-1 bg-emerald-900 rounded-full rotate-12" />
                <div className="absolute top-11 right-6 w-3 h-1 bg-emerald-900 rounded-full -rotate-12" />
              </>
            ) : state === "confused" ? (
              <>
                <div className="absolute top-11 left-6 w-2.5 h-2.5 border-2 border-white rounded-full" />
                <div className="absolute top-10 right-6 w-2.5 h-2.5 border-2 border-white rounded-full" />
              </>
            ) : state === "sad" || state === "stuck" || state === "mad" ? (
              <>
                <div className="absolute top-12 left-6 w-2 h-1 bg-emerald-900 rounded-full" />
                <div className="absolute top-12 right-6 w-2 h-1 bg-emerald-900 rounded-full" />
              </>
            ) : (
              <>
                <motion.div
                  animate={{ scaleY: [1, 0.1, 1] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    times: [0, 0.05, 0.1],
                  }}
                  className="absolute top-11 left-6 w-2.5 h-2.5 border-2 border-white rounded-full"
                />
                <motion.div
                  animate={{ scaleY: [1, 0.1, 1] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    times: [0, 0.05, 0.1],
                  }}
                  className="absolute top-11 right-6 w-2.5 h-2.5 border-2 border-white rounded-full"
                />
              </>
            )}

            {/* Nose */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 w-3 h-2 bg-emerald-900 rounded-full" />

            {/* Mouth */}
            <motion.div
              animate={
                state === "talking"
                  ? { scaleY: [1, 1.45, 1], rotate: 0, y: 0, scale: 1 }
                  : state === "happy"
                    ? { scale: 1.2, y: 1, rotate: 0, scaleY: 1 }
                    : state === "sad" || state === "stuck" || state === "mad"
                      ? { scaleY: -1, y: 0, rotate: 0, scale: 1 }
                      : { scaleY: 1, y: 0, rotate: 0, scale: 1 }
              }
              transition={
                state === "talking"
                  ? { duration: 0.35, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.2, ease: "easeOut" }
              }
              className={cn(
                "absolute top-19 left-1/2 -translate-x-1/2 w-4 h-1 border-b-2 border-emerald-900 rounded-full",
                state === "happy" && "border-b-4",
              )}
            />
          </div>

          {/* Thinking Bubbles */}
          <AnimatePresence>
            {state === "thinking" && (
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
            className="mt-4 bg-white p-4 rounded-3xl shadow-2xl border-2 border-emerald-500/20 max-w-[220px] relative"
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t-2 border-l-2 border-emerald-500/20 rotate-45" />
            <p className="text-sm text-emerald-950 font-black leading-relaxed text-center">
              {message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
