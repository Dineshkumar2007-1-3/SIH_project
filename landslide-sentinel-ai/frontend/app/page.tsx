import Link from "next/link";

export default function Home() {
  const links = [
    { href: "/dashboard", label: "Dashboard", desc: "Live risk overview & recent predictions" },
    { href: "/map", label: "Risk Map", desc: "Geographic view of monitored sites" },
    { href: "/alerts", label: "Alerts", desc: "Active landslide risk alerts" },
    { href: "/reports", label: "Reports", desc: "Community & field observations" },
  ];

  return (
    <div className="space-y-8">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Landslide Sentinel AI
        </h1>
        <p className="mt-3 text-slate-400 max-w-xl mx-auto">
          Monitoring rainfall, slope, and soil conditions to predict landslide
          risk before it happens.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-600 transition-colors"
          >
            <h2 className="text-lg font-semibold text-white">{link.label}</h2>
            <p className="mt-1 text-sm text-slate-400">{link.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
