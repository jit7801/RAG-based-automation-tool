import React from 'react';

export type NavTabId =
  | 'overview'
  | 'discover'
  | 'pipeline'
  | 'review'
  | 'published'
  | 'sources'
  | 'catalogue';

interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  pendingReviewsCount: number;
  isDegraded: boolean;
  onOpenSettings: () => void;
  onOpenRepurpose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingReviewsCount,
  isDegraded,
  onOpenSettings,
  onOpenRepurpose,
}) => {
  const navItems: {
    id: NavTabId;
    label: string;
    badge?: string | number;
    badgeVariant?: 'default' | 'warn';
    icon: React.ReactNode;
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'discover',
      label: 'Discover',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      id: 'pipeline',
      label: 'Content Pipeline',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      id: 'review',
      label: 'Review Queue',
      badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined,
      badgeVariant: 'warn',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      id: 'published',
      label: 'Published',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'sources',
      label: 'Sources',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
    },
    {
      id: 'catalogue',
      label: 'Back Catalogue',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zm0 4h16M8 4v4m8-4v4" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-surface border-r border-border flex flex-col justify-between select-none h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-brand flex items-center justify-center text-white font-bold text-xs tracking-wide shadow-sm">
            G
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-foreground tracking-wider uppercase">
                GATEKEEPER
              </span>
              <span className="text-3xs font-mono px-1 rounded bg-surface-raised border border-border text-foreground-faint">
                v1.0
              </span>
            </div>
            <p className="text-3xs text-foreground-muted tracking-tight">
              Autonomous Content Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
        <div className="px-2 pb-1 text-3xs font-mono uppercase tracking-wider text-foreground-faint font-semibold">
          Platform
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-surface-active text-white border border-border font-semibold shadow-xs'
                  : 'text-foreground-muted hover:text-foreground hover:bg-surface-raised/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-brand' : 'text-foreground-faint'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`font-mono text-3xs px-1.5 py-0.2 rounded-full font-semibold ${
                    item.badgeVariant === 'warn'
                      ? 'bg-status-warn-bg text-status-warn border border-status-warn-border'
                      : 'bg-surface-raised text-foreground-muted'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Brand Studio Tool */}
        <div className="pt-3">
          <div className="px-2 pb-1 text-3xs font-mono uppercase tracking-wider text-foreground-faint font-semibold">
            Studio Tools
          </div>
          <button
            onClick={onOpenRepurpose}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-brand hover:text-white bg-brand/10 hover:bg-brand border border-brand/20 transition-all shadow-xs"
          >
            <div className="flex items-center gap-2">
              <span>⚡</span>
              <span>Brand Studio</span>
            </div>
            <span className="text-3xs font-mono bg-brand/20 px-1 py-0.5 rounded text-brand group-hover:text-white">
              4 Formats
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Section: System Status & Settings */}
      <div className="p-3 border-t border-border space-y-2 bg-surface/50">
        {/* System Health Compact Tile */}
        <div className="rounded-md border border-border-subtle bg-surface-raised p-2 text-3xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-foreground-faint font-mono uppercase tracking-wider">System Mode</span>
            <span
              className={`inline-flex items-center gap-1 font-mono font-medium ${
                isDegraded ? 'text-status-warn' : 'text-status-pass'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isDegraded ? 'bg-status-warn' : 'bg-status-pass'
                }`}
              />
              {isDegraded ? 'DEGRADED' : 'OPERATIONAL'}
            </span>
          </div>
          <p className="text-foreground-faint line-clamp-1 text-3xs">
            {isDegraded ? 'Local Fallback Engine Active' : 'Swytchcode & Weaviate Live'}
          </p>
        </div>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-foreground-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Gate Rules & Settings</span>
          </div>
          <span className="text-3xs font-mono text-foreground-faint">⌘,</span>
        </button>
      </div>
    </aside>
  );
};
