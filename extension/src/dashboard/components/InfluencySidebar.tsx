import React from 'react';

interface InfluencySidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  threatCount?: number;
  historyCount?: number;
  heuristicsCount?: number;
}

export const InfluencySidebar: React.FC<InfluencySidebarProps> = ({
  activeTab,
  onTabChange,
  threatCount = 0,
  historyCount = 3,
  heuristicsCount = 0,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'home', target: 'dashboard-header' },
    { id: 'scan', label: 'Verdict', icon: 'radar', target: 'forensic-workbench-section' },
    { id: 'trust-dna', label: 'Trust DNA', icon: 'dna', badge: '6', target: 'trust-dna-panel' },
    { id: 'heuristics', label: 'Heuristics', icon: 'matrix', badge: heuristicsCount > 0 ? String(heuristicsCount) : undefined, target: 'heuristic-matrix-panel' },
    { id: 'proof-mode', label: 'Proof Mode', icon: 'evidence', badge: threatCount > 0 ? String(threatCount) : undefined, target: 'proof-mode-panel' },
    { id: 'ledger', label: 'Scan Ledger', icon: 'history', badge: String(historyCount), target: 'scan-ledger' },
  ];

  const renderIcon = (type: string) => {
    switch (type) {
      case 'home':
        return (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case 'radar':
        return (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="m16.2 7.8-2 6.3-6.4 2 2-6.3z" />
          </svg>
        );
      case 'dna':
        return (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
        );
      case 'matrix':
        return (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>
        );
      case 'evidence':
        return (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        );
      case 'history':
      default:
        return (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
    }
  };

  return (
    <aside className="influency-sidebar" aria-label="Workstation Navigation">
      <div>
        {/* Brand Monogram & Lockup */}
        <div className="influency-brand-lockup">
          <div className="influency-brand-mark" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L3 7V12C3 17.5 6.8 22.7 12 24C17.2 22.7 21 17.5 21 12V7L12 2Z" fill="#111827" />
              <path d="M12 6L7 12L12 18L17 12L12 6Z" fill="#D4FF00" />
            </svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span className="influency-brand-title">CREDIBLE</span>
            <span className="sidebar-pro-chip">PRO</span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="influency-nav-list" role="navigation">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onTabChange(item.id);
                  const el = document.querySelector(`[data-testid="${item.target}"]`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`influency-nav-item ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="influency-nav-icon">{renderIcon(item.icon)}</span>
                <span className="influency-nav-label">{item.label}</span>
                {item.badge && (
                  <span className="influency-nav-badge">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Security Engine Status Card */}
      <div className="influency-upgrade-card">
        <div className="influency-upgrade-crown" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <p className="influency-upgrade-title">Defensive Engine</p>
        <p className="influency-upgrade-desc">
          Zero client PII leakage. Heuristics online.
        </p>
        <button
          type="button"
          className="influency-upgrade-btn"
          onClick={() => {
            const el = document.querySelector('[data-testid="proof-mode-panel"]');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          View Full Trace
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </aside>
  );
};
