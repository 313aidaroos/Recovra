"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  BookOpenText,
  Building2,
  ChevronsUpDown,
  CircleHelp,
  FileBarChart,
  FileStack,
  Gauge,
  Layers3,
  LogIn,
  LogOut,
  Menu,
  PlugZap,
  ReceiptText,
  Search,
  Settings2,
  ShieldCheck,
  WalletCards,
  X,
} from "lucide-react";
import { signOutAction, switchOrganizationAction } from "@/lib/auth/actions";
import { Brand } from "./brand";

export type ShellNotification = { id: string; title: string; body: string; href: string; tone: "info" | "warn" | "risk" };

export type ShellWorkspace =
  | { mode: "demo"; canSignIn: boolean }
  | {
      mode: "live";
      organizationName: string;
      organizations: Array<{ id: string; name: string }>;
      activeOrganizationId: string;
      role: string;
      userEmail: string;
      userInitials: string;
      notifications: ShellNotification[];
    };

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

export function AppShell({ children, workspace }: { children: React.ReactNode; workspace: ShellWorkspace }) {
  const path = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [orgSwitcherOpen, setOrgSwitcherOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);
  const live = workspace.mode === "live";
  const notifications = live ? workspace.notifications : [];

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
        <Link href="/documents" className="nav-item"><CircleHelp size={18}/><span>Getting started</span></Link>
        <Link href="/settings" className={`nav-item ${path.startsWith("/settings") ? "active" : ""}`}><Settings2 size={18}/><span>Settings</span></Link>
        {live ? (
          <div className="workspace-card interactive">
            <button type="button" className="workspace-switch" onClick={() => setOrgSwitcherOpen((value) => !value)} aria-expanded={orgSwitcherOpen}>
              <span className="workspace-avatar">{workspace.organizationName.slice(0, 1).toUpperCase()}</span>
              <div><strong>{workspace.organizationName}</strong><small>{workspace.role} · live workspace</small></div>
              {workspace.organizations.length > 1 && <ChevronsUpDown size={14}/>}
            </button>
            {orgSwitcherOpen && workspace.organizations.length > 1 && (
              <form action={switchOrganizationAction} className="workspace-menu">
                {workspace.organizations.map((organization) => (
                  <button key={organization.id} type="submit" name="organization_id" value={organization.id} className={organization.id === workspace.activeOrganizationId ? "active" : ""}>{organization.name}</button>
                ))}
              </form>
            )}
          </div>
        ) : (
          <div className="workspace-card"><span className="workspace-avatar">A</span><div><strong>Acme Holdings</strong><small>Sample workspace</small></div></div>
        )}
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <button className="mobile-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={19}/></button>
        <button className="command-search" onClick={() => setSearchOpen(true)}><Search size={17}/><span>Search spend, vendors, findings…</span><kbd>⌘ K</kbd></button>
        <div className="top-actions">
          {live ? (
            <span className="demo-environment live">{workspace.organizationName}</span>
          ) : (
            <>
              <span className="demo-environment">Sample workspace</span>
              {workspace.canSignIn && <Link href="/login" className="primary-button"><LogIn size={14}/> Sign in</Link>}
            </>
          )}
          <button className="icon-button" aria-label="Open notifications" onClick={() => setNotificationsOpen((value) => !value)}><Bell size={18}/>{(!live || notifications.length > 0) && <i className="notification-dot"/>}</button>
          {live ? (
            <form action={signOutAction} className="user-menu">
              <span className="avatar" title={workspace.userEmail}>{workspace.userInitials}</span>
              <button type="submit" className="icon-button" aria-label="Sign out" title="Sign out"><LogOut size={16}/></button>
            </form>
          ) : (
            <span className="avatar">AA</span>
          )}
        </div>
        {notificationsOpen && (
          <aside className="notification-panel">
            <div className="popover-head"><strong>Pending actions</strong><button aria-label="Close notifications" onClick={() => setNotificationsOpen(false)}><X size={16}/></button></div>
            {live ? (
              notifications.length === 0
                ? <div className="notification-item"><i/><div><strong>You are all caught up</strong><small>Approval requests and audit results will appear here.</small></div></div>
                : notifications.map((item) => (
                  <Link href={item.href} className="notification-item" key={item.id} onClick={() => setNotificationsOpen(false)}>
                    <i className={item.tone === "info" ? undefined : item.tone}/><div><strong>{item.title}</strong><small>{item.body}</small></div>
                  </Link>
                ))
            ) : (
              <>
                <div className="notification-item"><i className="risk"/><div><strong>3 findings need review</strong><small>NorthStar Parcel · $24,180 at risk · sample</small></div></div>
                <div className="notification-item"><i className="warn"/><div><strong>Contract renews in 18 days</strong><small>DataDesk enterprise license · sample</small></div></div>
                <div className="notification-item"><i/><div><strong>Evidence package complete</strong><small>Rapid 3PL · ready for follow-up · sample</small></div></div>
              </>
            )}
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
            {live ? (
              <>
                <Link href="/opportunities" onClick={() => setSearchOpen(false)}><ShieldCheck size={17}/><div><strong>Recovery opportunities</strong><small>Open findings ranked by value</small></div></Link>
                <Link href="/documents" onClick={() => setSearchOpen(false)}><FileStack size={17}/><div><strong>Upload documents</strong><small>Invoices, rate sheets, contracts</small></div></Link>
                <Link href="/recoveries" onClick={() => setSearchOpen(false)}><WalletCards size={17}/><div><strong>Recovery center</strong><small>Approvals and claims in flight</small></div></Link>
              </>
            ) : (
              <>
                <Link href="/opportunities/RCV-2481" onClick={() => setSearchOpen(false)}><ShieldCheck size={17}/><div><strong>RCV-2481 · NorthStar Parcel</strong><small>Residential surcharge discrepancy</small></div></Link>
                <Link href="/contracts" onClick={() => setSearchOpen(false)}><BookOpenText size={17}/><div><strong>Parcel Services Agreement</strong><small>Contract · expires Dec 2027</small></div></Link>
              </>
            )}
          </div>
          <footer><span>{live ? "Full-text search ships with the next release" : "Demo search preview"}</span><kbd>ESC</kbd></footer>
        </section>
      </div>
    )}
  </div>
}
