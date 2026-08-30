"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  // Redirect to dashboard by default
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-purple))" }}>
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 19h20L12 2zm0 4l7 13H5l7-13z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-white">Loading Sentinel AI…</h1>
      </div>
    </div>
  );
}
