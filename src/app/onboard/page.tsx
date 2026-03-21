"use client";

import { useRouter } from "next/navigation";
import { SplashPage } from "@/src/components/SplashPage";

const USERNAME_STORAGE_KEY = "bamboost.username";

export default function OnboardPage() {
  const router = useRouter();

  const handleComplete = (name: string) => {
    window.localStorage.setItem(USERNAME_STORAGE_KEY, name);
    router.push("/home");
  };

  return <SplashPage onComplete={handleComplete} />;
}
