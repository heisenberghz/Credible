import React from 'react';

interface HeaderProps {
  onScan: () => void;
  isScanning: boolean;
  elapsedSeconds?: number;
}

export const Header: React.FC<HeaderProps> = ({ onScan, isScanning, elapsedSeconds }) => {
  return (
    <header
      className="sidepanel-header"
      data-testid="sidepanel-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        borderBottom: '1px solid #ECEFF5',
        backgroundColor: '#FFFFFF',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        boxShadow: '0 2px 8px rgba(17, 24, 39, 0.03)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#111827',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L3 7V12C3 17.5 6.8 22.7 12 24C17.2 22.7 21 17.5 21 12V7L12 2Z" fill="#111827" stroke="#FFFFFF" strokeWidth="1.5" />
            <path d="M12 6L7 12L12 18L17 12L12 6Z" fill="#D4FF00" />
          </svg>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em', margin: 0, lineHeight: 1.1 }}>
              CREDIBLE
            </h2>
            <span style={{ fontSize: '9px', fontWeight: 800, backgroundColor: '#D4FF00', color: '#111827', padding: '1px 5px', borderRadius: '4px', letterSpacing: '0.04em' }}>
              PRO
            </span>
          </div>
          <span style={{ fontSize: '10.5px', color: '#8E95A5', fontWeight: 500, display: 'block' }}>
            Defensive Security Engine
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          type="button"
          onClick={() => {
            if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
              chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/index.html') });
            }
          }}
          data-testid="open-dashboard-btn"
          title="Open Full Command Center Dashboard in a new tab"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 9px',
            backgroundColor: '#F4F5F8',
            color: '#111827',
            border: '1px solid #ECEFF5',
            borderRadius: '999px',
            fontSize: '10.5px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span>DASHBOARD</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>

        <button
          onClick={onScan}
          disabled={isScanning}
          data-testid="header-scan-btn"
          title={isScanning ? 'AI analysis can take up to about a minute on the free tier' : 'Analyze current active tab'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '6px 12px',
            backgroundColor: isScanning ? '#E5E7EB' : '#111827',
            color: isScanning ? '#6B7280' : '#FFFFFF',
            border: 'none',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.02em',
            cursor: isScanning ? 'not-allowed' : 'pointer',
            boxShadow: isScanning ? 'none' : '0 2px 8px rgba(17, 24, 39, 0.12)',
            transition: 'all 0.15s ease',
          }}
        >
          {isScanning ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="loading-spinner" aria-hidden="true">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#D4FF00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          )}
          <span>
            {isScanning
              ? `SCANNING${typeof elapsedSeconds === 'number' ? ` ${elapsedSeconds}s` : '...'}`
              : 'SCAN TAB'}
          </span>
        </button>
      </div>
    </header>
  );
};
