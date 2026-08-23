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
    badge?: number;
  }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'discover', label: 'Discover' },
    { id: 'pipeline', label: 'Content Pipeline' },
    { id: 'review', label: 'Review Queue', badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined },
    { id: 'published', label: 'Published' },
    { id: 'sources', label: 'Sources' },
    { id: 'catalogue', label: 'Back Catalogue' },
  ];

  return (
    <aside className="w-60 flex-shrink-0 bg-sidebar border-r border-border flex flex-col justify-between select-none h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-brand flex items-center justify-center text-white font-semibold text-sm">
            P
          </div>
          <div>
            <div className="font-semibold text-sm text-primary tracking-tight">
              Proofly
            </div>
            <p className="text-metadata text-secondary">
              Content Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
                isActive
                  ? 'bg-brand/15 text-primary font-medium'
                  : 'text-secondary hover:text-primary hover:bg-surface-raised'
              }`}
            >
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-status-warn-subtle text-status-warn border border-status-warn-border font-medium">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Simple Divider */}
        <div className="py-2">
          <div className="h-px bg-border my-1" />
        </div>

        {/* Brand Studio */}
        <button
          onClick={onOpenRepurpose}
          className="w-full flex items-center justify-between px-3 py-2 rounded text-sm text-secondary hover:text-primary hover:bg-surface-raised transition-colors"
        >
          <span>Brand Studio</span>
          <span className="text-xs text-muted font-mono">4 formats</span>
        </button>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex items-center gap-2 px-1 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isDegraded ? 'bg-status-warn' : 'bg-status-pass'
            }`}
          />
          <span className="text-secondary">
            {isDegraded ? 'Degraded Mode' : 'System Operational'}
          </span>
        </div>

        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs text-muted hover:text-primary transition-colors"
        >
          <span>Settings</span>
          <span className="text-muted font-mono text-xs">⌘,</span>
        </button>
      </div>
    </aside>
  );
};
