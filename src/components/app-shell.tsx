"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CircleHelp, Gauge, Layers3, ReceiptText, Search, Settings2, UploadCloud } from "lucide-react";
import { Brand } from "./brand";

const nav = [
  ["/dashboard", "Command Center", Gauge],
  ["/recoveries", "Recoveries", ReceiptText],
  ["/modules", "Modules", Layers3],
  ["/ingest", "Connect & Upload", UploadCloud],
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="sidebar-top"><Brand /></div>
      <nav className="sidebar-nav">
        <div className="nav-label">Workspace</div>
        {nav.map(([href,label,Icon]) => <Link key={href as string} href={href as string} className={`nav-item ${path.startsWith(href as string) ? "active" : ""}`}>
          <Icon size={18}/><span>{label as string}</span>
        </Link>)}
      </nav>
      <div className="sidebar-bottom">
        <Link href="#" className="nav-item"><CircleHelp size={18}/><span>Help center</span></Link>
        <Link href="#" className="nav-item"><Settings2 size={18}/><span>Settings</span></Link>
        <div className="workspace-card"><span className="workspace-avatar">A</span><div><strong>Acme Holdings</strong><small>Enterprise demo</small></div></div>
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <button className="command-search"><Search size={17}/><span>Search spend, vendors, findings…</span><kbd>⌘ K</kbd></button>
        <div className="top-actions"><span className="live-dot"><i/> Live monitoring</span><button className="icon-button"><Bell size={18}/></button><span className="avatar">AA</span></div>
      </header>
      <div className="page-wrap">{children}</div>
    </main>
  </div>
}
