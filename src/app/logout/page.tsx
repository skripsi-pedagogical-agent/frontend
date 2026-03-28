"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearAuthSession } from "@/src/services/authService";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    clearAuthSession();
    router.replace("/onboard");
  }, [router]);

  return (
    <main className="min-h-screen bg-[#f0f4f2] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl border border-emerald-200 px-6 py-5 text-emerald-900 font-black shadow-lg">
        Logging out...
      </div>
    </main>
  );
}
