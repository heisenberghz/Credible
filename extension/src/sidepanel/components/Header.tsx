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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: '12px',
          }}
          aria-hidden="true"
        >
          🛡️
        </div>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
            Credible
          </h2>
          <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 500 }}>
            Defensive Security Analysis
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
          backgroundColor: isScanning ? '#F1F5F9' : '#EFF6FF',
          color: isScanning ? '#94A3B8' : '#2563EB',
          border: '1px solid',
          borderColor: isScanning ? '#E2E8F0' : '#BFDBFE',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: isScanning ? 'not-allowed' : 'pointer',
        }}
      >
        <span aria-hidden="true">{isScanning ? '⏳' : '⚡'}</span>
        <span>{isScanning ? 'Scanning...' : 'Scan Tab'}</span>
      </button>
    </header>
  );
};

