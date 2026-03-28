"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PandaMascot } from "@/src/components/PandaMascot";
import {
  isAuthenticated,
  login,
  register,
  type LoginRequest,
  type RegisterRequest,
} from "@/src/services/authService";

export default function OnboardPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState<LoginRequest>({
    username: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState<RegisterRequest>({
    username: "",
    name: "",
    password: "",
    password_confirm: "",
  });

  const nextPath = useMemo(() => {
    if (typeof window === "undefined") return "/home";
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");

    if (!next || !next.startsWith("/")) {
      return "/home";
    }

    return next;
  }, []);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/home");
    }
  }, [router]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    setError(null);
    setIsSubmitting(true);
    try {
      await login(loginForm);
      router.replace(nextPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login gagal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();

    if (registerForm.password !== registerForm.password_confirm) {
      setError("Password dan konfirmasi password harus sama.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await register(registerForm);
      await login({
        username: registerForm.username,
        password: registerForm.password,
      });
      router.replace(nextPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Register gagal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f2] flex flex-col items-center justify-center p-6 font-sans text-emerald-950">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-200/50 p-10 border border-emerald-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-100/30 rounded-full -ml-16 -mb-16 blur-3xl opacity-50" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-8">
          <div className="w-32 h-32 bg-emerald-50 rounded-[2rem] flex items-center justify-center shadow-inner overflow-hidden">
            <div className="scale-110">
              <PandaMascot state="happy" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-emerald-900">
              Bamboost
            </h1>
            <p className="text-emerald-700 font-bold">
              Login untuk mulai challenge coding
            </p>
          </div>

          <div className="w-full flex bg-emerald-50 rounded-2xl p-1 border border-emerald-200">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`w-1/2 py-2 rounded-xl text-sm font-black transition-colors ${
                mode === "login"
                  ? "bg-emerald-600 text-white"
                  : "text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`w-1/2 py-2 rounded-xl text-sm font-black transition-colors ${
                mode === "register"
                  ? "bg-emerald-600 text-white"
                  : "text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              Register
            </button>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="w-full space-y-4">
              <input
                autoFocus
                type="text"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                placeholder="Username"
                className="w-full bg-emerald-50 border-2 border-emerald-200 rounded-2xl py-3 px-5 text-sm font-bold text-emerald-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all placeholder:text-emerald-400"
                required
              />
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                placeholder="Password"
                className="w-full bg-emerald-50 border-2 border-emerald-200 rounded-2xl py-3 px-5 text-sm font-bold text-emerald-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all placeholder:text-emerald-400"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? "Memproses..." : "Masuk"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="w-full space-y-4">
              <input
                autoFocus
                type="text"
                value={registerForm.username}
                onChange={(e) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                placeholder="Username"
                className="w-full bg-emerald-50 border-2 border-emerald-200 rounded-2xl py-3 px-5 text-sm font-bold text-emerald-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all placeholder:text-emerald-400"
                required
              />
              <input
                type="text"
                value={registerForm.name}
                onChange={(e) =>
                  setRegisterForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nama"
                className="w-full bg-emerald-50 border-2 border-emerald-200 rounded-2xl py-3 px-5 text-sm font-bold text-emerald-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all placeholder:text-emerald-400"
                required
              />
              <input
                type="password"
                value={registerForm.password}
                onChange={(e) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                placeholder="Password"
                className="w-full bg-emerald-50 border-2 border-emerald-200 rounded-2xl py-3 px-5 text-sm font-bold text-emerald-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all placeholder:text-emerald-400"
                required
              />
              <input
                type="password"
                value={registerForm.password_confirm}
                onChange={(e) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    password_confirm: e.target.value,
                  }))
                }
                placeholder="Konfirmasi password"
                className="w-full bg-emerald-50 border-2 border-emerald-200 rounded-2xl py-3 px-5 text-sm font-bold text-emerald-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all placeholder:text-emerald-400"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? "Memproses..." : "Daftar"}
              </button>
            </form>
          )}

          {error && (
            <p className="w-full text-left text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
