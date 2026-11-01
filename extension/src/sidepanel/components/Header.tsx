import React from 'react';
import { CredibleLogoMark } from '../../components/CredibleLogoMark';

interface HeaderProps {
  onScan: () => void;
  isScanning: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onScan, isScanning }) => {
  return (
    <header
      className="sidepanel-header"
      data-testid="sidepanel-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid #1E293B',
        backgroundColor: '#090D16',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #1E293B, #0F172A)',
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 12px rgba(0, 82, 255, 0.3)',
          }}
          aria-hidden="true"
        >
          <CredibleLogoMark size={20} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 1.2, margin: 0 }}>
              CREDIBLE
            </h2>
            <span style={{ fontSize: '9px', fontWeight: 800, fontFamily: 'monospace', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#E2E8F0', border: '1px solid rgba(255, 255, 255, 0.18)', letterSpacing: '0.04em' }}>
              v2.4 AUDIT
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500, letterSpacing: '-0.01em', display: 'block' }}>
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
            gap: '5px',
            padding: '6px 10px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            color: '#F1F5F9',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderRadius: '6px',
            fontSize: '11px',
            fontFamily: 'monospace',
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
          title="Analyze current active tab"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: isScanning ? 'rgba(255, 255, 255, 0.1)' : '#0052FF',
            color: isScanning ? '#64748B' : '#FFFFFF',
            border: '1px solid',
            borderColor: isScanning ? 'transparent' : '#0052FF',
            borderRadius: '6px',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            cursor: isScanning ? 'not-allowed' : 'pointer',
            boxShadow: isScanning ? 'none' : '0 0 14px rgba(0, 82, 255, 0.4)',
            transition: 'all 0.15s ease',
          }}
        >
          {isScanning ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="loading-spinner" aria-hidden="true">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          )}
          <span>{isScanning ? 'SCANNING...' : 'SCAN TAB'}</span>
        </button>
      </div>
    </header>
  );
};
