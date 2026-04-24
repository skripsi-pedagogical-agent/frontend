"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainMenu } from "@/src/components/MainMenu";
import { Problem, mapBackendProblemToFrontend } from "@/src/lib/problems";
import { fetchProblemsFromBackend } from "@/src/services/problemsService";
import { getStoredAuthUser, isAuthenticated } from "@/src/services/authService";

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("Guest");
  const [loggedIn, setLoggedIn] = useState(false);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initPage = async () => {
      try {
        const authUser = getStoredAuthUser();
        setLoggedIn(isAuthenticated());
        setUsername(authUser?.name || authUser?.username || "Guest");

        // Fetch problems from backend
        try {
          const backendResponse = await fetchProblemsFromBackend();
          const mappedProblems = backendResponse.results.map(
            mapBackendProblemToFrontend,
          );
          setProblems(mappedProblems);
        } catch (fetchError) {
          console.error("Failed to fetch problems from backend:", fetchError);
          setError(
            "Gagal memuat masalah. Silakan periksa koneksi Anda dan coba lagi.",
          );
          // Keep empty state when backend fails.
          setProblems([]);
        }

        setIsReady(true);
      } finally {
        setIsLoading(false);
      }
    };

    initPage();
  }, [router]);

  const handleSelectProblem = (problemId: string) => {
    router.push(`/challenge/${problemId}`);
  };

  const handleAuthAction = () => {
    if (loggedIn) {
      router.push("/logout");
      return;
    }

    router.push("/onboard");
  };

  if (!isReady || isLoading) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f2]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-bold text-red-900 mb-2">
            Kesalahan Memuat Masalah
          </h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <MainMenu
      username={username}
      isLoggedIn={loggedIn}
      onAuthAction={handleAuthAction}
      problems={problems}
      onSelectProblem={handleSelectProblem}
    />
  );
}
