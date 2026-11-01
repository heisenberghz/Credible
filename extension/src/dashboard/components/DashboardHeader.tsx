import React from 'react';
import { AnalysisReport } from '../../types/analysis';
import { downloadDossier } from '../utils/dossierExporter';

interface DashboardHeaderProps {
  report: AnalysisReport | null;
  onScan: () => void;
  isScanning: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  report,
  onScan,
  isScanning,
}) => {
  return (
    <header className="dashboard-header" data-testid="dashboard-header">
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Brand & Monogram */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.12)',
            }}
            aria-hidden="true"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
              <path d="M12 3v18M3 12h18" strokeDasharray="2 2" strokeWidth="1.5" stroke="#94A3B8" />
              <circle cx="12" cy="12" r="3" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1 }}>
                CREDIBLE COMMAND CENTER
              </h1>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  letterSpacing: '0.04em',
                }}
              >
                v2.4 AUDIT
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>
              Defensive Cybersecurity Full-Scale Forensic Dossier
            </p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {report && (
            <>
              <button
                onClick={() => downloadDossier(report, 'markdown')}
                data-testid="export-markdown-btn"
                title="Download complete forensic audit dossier in Markdown"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>↓ EXPORT DOSSIER (.MD)</span>
              </button>

              <button
                onClick={() => downloadDossier(report, 'json')}
                data-testid="export-json-btn"
                title="Download raw report schema in JSON format"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 10px',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>JSON</span>
              </button>
            </>
          )}

          <button
            onClick={onScan}
            disabled={isScanning}
            data-testid="dashboard-scan-btn"
            title="Trigger full scan of active Chrome tab"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
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
              boxShadow: isScanning ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.12)',
              transition: 'all 0.15s ease',
            }}
          >
            <span aria-hidden="true">{isScanning ? '⏳' : '⚡'}</span>
            <span>{isScanning ? 'SCANNING...' : 'SCAN ACTIVE TAB'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

