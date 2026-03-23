"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChallengeWorkspace } from "@/src/components/ChallengeWorkspace";
import {
  getProblemBySlug,
  mapBackendProblemToFrontend,
  type Problem,
} from "@/src/lib/problems";
import { fetchProblemsFromBackend } from "@/src/services/problemsService";

const USERNAME_STORAGE_KEY = "bamboost.username";

export default function ChallengePage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const [username, setUsername] = useState("");
  const [problem, setProblem] = useState<Problem | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initPage = async () => {
      const storedName = window.localStorage.getItem(USERNAME_STORAGE_KEY);

      if (!storedName) {
        router.replace("/onboard");
        return;
      }

      setUsername(storedName);

      if (!params?.slug) {
        setProblem(undefined);
        setIsReady(true);
        return;
      }

      try {
        const backendResponse = await fetchProblemsFromBackend();
        const backendProblem = backendResponse.results.find(
          (item) => item.slug === params.slug,
        );

        if (backendProblem) {
          setProblem(mapBackendProblemToFrontend(backendProblem));
        } else {
          // Fallback to static list for local-only problems.
          setProblem(getProblemBySlug(params.slug));
        }
      } catch {
        // Fallback to static list when backend is unavailable.
        setProblem(getProblemBySlug(params.slug));
      } finally {
        setIsReady(true);
      }
    };

    void initPage();
  }, [params?.slug, router]);

  if (!isReady) {
    return null;
  }

  if (!problem) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f0f4f2] p-6">
        <div className="max-w-lg rounded-3xl bg-white border border-emerald-200 p-8 text-center shadow-lg">
          <h1 className="text-2xl font-black text-emerald-900">
            Challenge tidak ditemukan
          </h1>
          <p className="mt-3 text-emerald-700 font-bold">
            Slug challenge tidak valid. Pilih challenge dari halaman utama.
          </p>
          <button
            onClick={() => router.push("/home")}
            className="mt-6 px-5 py-3 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-600 transition-colors"
          >
            Kembali ke Main Menu
          </button>
        </div>
      </main>
    );
  }

  return (
    <ChallengeWorkspace
      username={username}
      problem={problem}
      onBack={() => router.push("/home")}
    />
  );
}
