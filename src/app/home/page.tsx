"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainMenu } from "@/src/components/MainMenu";
import { PROBLEMS } from "@/src/lib/problems";

const USERNAME_STORAGE_KEY = "bamboost.username";

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedName = window.localStorage.getItem(USERNAME_STORAGE_KEY);

    if (!storedName) {
      router.replace("/onboard");
      return;
    }

    setUsername(storedName);
    setIsReady(true);
  }, [router]);

  const handleSelectProblem = (problemId: string) => {
    router.push(`/challenge/${problemId}`);
  };

  if (!isReady) {
    return null;
  }

  return (
    <MainMenu
      username={username}
      problems={PROBLEMS}
      onSelectProblem={handleSelectProblem}
    />
  );
}
