import React from 'react';

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
        borderBottom: '1px solid #E2E8F0',
        backgroundColor: '#FFFFFF',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            backgroundColor: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            flexShrink: 0,
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.12)',
          }}
          aria-hidden="true"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
            <path d="M12 3v18M3 12h18" strokeDasharray="2 2" strokeWidth="1.5" stroke="#94A3B8" />
            <circle cx="12" cy="12" r="3" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
          </svg>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 1.2 }}>
              CREDIBLE
            </h2>
            <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'monospace', padding: '1px 5px', borderRadius: '4px', backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', letterSpacing: '0.04em' }}>
              v2.4 AUDIT
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500, letterSpacing: '-0.01em' }}>
            Defensive Security Engine
          </span>
        </div>
      </div>

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
          backgroundColor: isScanning ? '#F1F5F9' : '#0F172A',
          color: isScanning ? '#94A3B8' : '#FFFFFF',
          border: '1px solid',
          borderColor: isScanning ? '#E2E8F0' : '#0F172A',
          borderRadius: '6px',
          fontSize: '11px',
          fontFamily: 'monospace',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          cursor: isScanning ? 'not-allowed' : 'pointer',
          boxShadow: isScanning ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.08)',
          transition: 'all 0.15s ease',
        }}
      >
        <span aria-hidden="true">{isScanning ? '⏳' : '⚡'}</span>
        <span>{isScanning ? 'SCANNING...' : 'SCAN TAB'}</span>
      </button>
    </header>
  );
};

