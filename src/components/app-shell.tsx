"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  BookOpenText,
  Building2,
  CircleHelp,
  FileBarChart,
  FileStack,
  Gauge,
  Layers3,
  Menu,
  PlugZap,
  ReceiptText,
  Search,
  Settings2,
  ShieldCheck,
  WalletCards,
  X,
} from "lucide-react";
import { Brand } from "./brand";

const navigation = [
  {
    label: "Recovery",
    items: [
      ["/dashboard", "Command Center", Gauge],
      ["/opportunities", "Recovery Opportunities", ShieldCheck],
      ["/recoveries", "Recoveries", WalletCards],
    ],
  },
  {
    label: "Spend intelligence",
    items: [
      ["/invoices", "Invoices", ReceiptText],
      ["/contracts", "Contracts", BookOpenText],
      ["/vendors", "Vendors", Building2],
      ["/documents", "Documents", FileStack],
    ],
  },
  {
    label: "Platform",
    items: [
      ["/integrations", "Integrations", PlugZap],
      ["/reports", "Reports", FileBarChart],
      ["/modules", "Industry Modules", Layers3],
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return <div className="app-shell">
    {sidebarOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={closeSidebar} />}
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <div className="sidebar-top"><Brand /></div>
      <nav className="sidebar-nav">
        {navigation.map((section) => (
          <div className="nav-section" key={section.label}>
            <div className="nav-label">{section.label}</div>
            {section.items.map(([href, label, Icon]) => (
              <Link
                key={href as string}
                href={href as string}
                onClick={closeSidebar}
                className={`nav-item ${path.startsWith(href as string) ? "active" : ""}`}
              >
                <Icon size={17}/><span>{label as string}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <Link href="#" className="nav-item"><CircleHelp size={18}/><span>Help center</span></Link>
        <Link href="/settings" className="nav-item"><Settings2 size={18}/><span>Settings</span></Link>
        <div className="workspace-card"><span className="workspace-avatar">A</span><div><strong>Acme Holdings</strong><small>Enterprise demo</small></div></div>
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <button className="mobile-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={19}/></button>
        <button className="command-search" onClick={() => setSearchOpen(true)}><Search size={17}/><span>Search spend, vendors, findings…</span><kbd>⌘ K</kbd></button>
        <div className="top-actions">
          <span className="demo-environment">Sample workspace</span>
          <button className="icon-button" aria-label="Open notifications" onClick={() => setNotificationsOpen((value) => !value)}><Bell size={18}/><i className="notification-dot"/></button>
          <span className="avatar">AA</span>
        </div>
        {notificationsOpen && (
          <aside className="notification-panel">
            <div className="popover-head"><strong>Pending actions</strong><button aria-label="Close notifications" onClick={() => setNotificationsOpen(false)}><X size={16}/></button></div>
            <div className="notification-item"><i className="risk"/><div><strong>3 findings need review</strong><small>NorthStar Parcel · $24,180 at risk</small></div></div>
            <div className="notification-item"><i className="warn"/><div><strong>Contract renews in 18 days</strong><small>DataDesk enterprise license</small></div></div>
            <div className="notification-item"><i/><div><strong>Evidence package complete</strong><small>Rapid 3PL · ready for follow-up</small></div></div>
          </aside>
        )}
      </header>
      <div className="page-wrap">{children}</div>
    </main>
    {searchOpen && (
      <div className="modal-backdrop" role="presentation" onMouseDown={() => setSearchOpen(false)}>
        <section className="command-modal" role="dialog" aria-modal="true" aria-label="Global search" onMouseDown={(event) => event.stopPropagation()}>
          <label><Search size={18}/><input autoFocus placeholder="Search invoices, vendors, contracts, findings…"/></label>
          <div className="search-group"><span>Quick access</span>
            <Link href="/opportunities/RCV-2481" onClick={() => setSearchOpen(false)}><ShieldCheck size={17}/><div><strong>RCV-2481 · NorthStar Parcel</strong><small>Residential surcharge discrepancy</small></div></Link>
            <Link href="/contracts" onClick={() => setSearchOpen(false)}><BookOpenText size={17}/><div><strong>Parcel Services Agreement</strong><small>Contract · expires Dec 2027</small></div></Link>
          </div>
          <footer><span>Demo search preview</span><kbd>ESC</kbd></footer>
        </section>
      </div>
    )}
  </div>
}
