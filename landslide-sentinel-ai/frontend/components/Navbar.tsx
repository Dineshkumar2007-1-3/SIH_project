"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="hidden">
      {/* Navigation is handled by Sidebar component */}
      <Link href="/" className="font-semibold text-white">
        Landslide Sentinel AI
      </Link>
    </header>
  );
}
