import React from 'react';
import { AnalysisReport } from '../../types/analysis';

interface HeuristicMatrixProps {
  report: AnalysisReport;
}

interface HeuristicRuleDefinition {
  id: string;
  name: string;
  category: 'Financial' | 'Social Engineering' | 'Identity' | 'Privacy' | 'Network';
  cleanSummary: string;
}

const KNOWN_RULES: Record<string, HeuristicRuleDefinition> = {
  'content.payment_pressure': {
    id: 'content.payment_pressure',
    name: 'Upfront Payment & Deposit Demand',
    category: 'Financial',
    cleanSummary: 'No upfront fee requests, cryptocurrency transfers, or security deposit demands observed in content.',
  },
  'content.urgency': {
    id: 'content.urgency',
    name: 'Artificial Urgency & Scarcity',
    category: 'Social Engineering',
    cleanSummary: 'No artificial countdown timers, immediate expiration threats, or rushed decision pressure detected.',
  },
  'content.credential_pressure': {
    id: 'content.credential_pressure',
    name: 'Premature Credential Harvesting',
    category: 'Privacy',
    cleanSummary: 'No illicit password requests, recovery token collection, or two-factor prompt patterns observed.',
  },
  'content.data_exposure': {
    id: 'content.data_exposure',
    name: 'Identity Document Harvesting',
    category: 'Privacy',
    cleanSummary: 'No premature requests for government IDs, passport uploads, or bank statement attachments.',
  },
  'url.ip_host': {
    id: 'url.ip_host',
    name: 'Raw IP Host Detection',
    category: 'Network',
    cleanSummary: 'Domain name conforms to standard DNS hostname conventions; not a bare numeric IP address.',
  },
  'url.suspicious_tld': {
    id: 'url.suspicious_tld',
    name: 'High-Risk TLD & Registrar Verification',
    category: 'Identity',
    cleanSummary: 'Domain extension is standard and does not belong to known high-abuse phishing TLD registries.',
  },
  'url.lookalike': {
    id: 'url.lookalike',
    name: 'Brand Typosquatting & Lookalike',
    category: 'Identity',
    cleanSummary: 'No visual homoglyph substitutions or deceptive brand character permutations detected.',
  },
  'context.informal_entity': {
    id: 'context.informal_entity',
    name: 'Corporate Registrar Corroboration',
    category: 'Identity',
    cleanSummary: 'Standard corporate or institutional entity structure observed in analyzed content.',
  },
};

export const HeuristicMatrix: React.FC<HeuristicMatrixProps> = ({ report }) => {
  const executedChecks = (report.checks?.executed || []).filter((id): id is string => typeof id === 'string');
  const findings = report.findings || [];

  // Map each check to its status
  const findingCheckIds = findings.map((f) => f.check_id).filter((id): id is string => typeof id === 'string');
  const allCheckIds = Array.from(new Set([...executedChecks, ...findingCheckIds]));

  const rulesList = allCheckIds.map((checkId) => {
    const matchingFinding = findings.find((f) => f.check_id === checkId);
    const ruleDef = KNOWN_RULES[checkId] || {
      id: checkId,
      name: checkId.replace(/^[a-z]+\./, '').replace(/_/g, ' ').toUpperCase(),
      category: 'Identity' as const,
      cleanSummary: 'Passed observable deterministic heuristic check.',
    };

    return {
      id: checkId,
      name: ruleDef.name,
      category: ruleDef.category,
      isFlagged: Boolean(matchingFinding),
      finding: matchingFinding,
      cleanSummary: ruleDef.cleanSummary,
    };
  });

  const flaggedCount = rulesList.filter((r) => r.isFlagged).length;
  const passedCount = rulesList.filter((r) => !r.isFlagged).length;

  return (
    <section
      className="arch-card"
      data-testid="heuristic-matrix-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px 24px',
      }}
    >
      {/* Header with KPI Counts */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: '#0F172A',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                fontFamily: 'monospace',
                margin: 0,
              }}
            >
              Forensic Heuristic Rules Matrix ({rulesList.length})
            </h3>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: '#F1F5F9',
                color: '#475569',
                fontFamily: 'monospace',
                border: '1px solid #CBD5E1',
              }}
            >
              DETERMINISTIC ENGINE
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0 0' }}>
            Transparent verification record of all observable heuristic rules evaluated on this page.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontFamily: 'monospace' }}>
          <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', fontWeight: 700 }}>
            ✓ {passedCount} PASSED CLEAN
          </span>
          {flaggedCount > 0 && (
            <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#FFF1F2', color: '#9F1239', border: '1px solid #FECDD3', fontWeight: 700 }}>
              ⚠️ {flaggedCount} FLAGGED THREATS
            </span>
          )}
        </div>
      </div>

      {/* Rules Table */}
      <div
        style={{
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontFamily: 'monospace', fontSize: '11px', textTransform: 'uppercase' }}>
              <th style={{ padding: '10px 14px', width: '24%' }}>Rule & Identifier</th>
              <th style={{ padding: '10px 14px', width: '12%' }}>Domain</th>
              <th style={{ padding: '10px 14px', width: '12%' }}>Verification</th>
              <th style={{ padding: '10px 14px', width: '52%' }}>Observable Heuristic Finding</th>
            </tr>
          </thead>
          <tbody>
            {rulesList.map((rule, idx) => (
              <tr
                key={rule.id}
                style={{
                  borderBottom: idx < rulesList.length - 1 ? '1px solid #F1F5F9' : 'none',
                  backgroundColor: rule.isFlagged ? '#FFFDFD' : '#FFFFFF',
                }}
              >
                {/* Rule Name & ID */}
                <td style={{ padding: '12px 14px', verticalAlign: 'top', wordBreak: 'break-word' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>
                    {rule.name}
                  </div>
                  <code style={{ fontSize: '10px', color: '#64748B', backgroundColor: '#F1F5F9', padding: '1px 4px', borderRadius: '3px', display: 'inline-block', maxWidth: '100%', wordBreak: 'break-all' }}>
                    {rule.id}
                  </code>
                </td>

                {/* Category */}
                <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#475569',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    {rule.category}
                  </span>
                </td>

                {/* Status Badge */}
                <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                  {rule.isFlagged ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#FFF1F2',
                        color: '#9F1239',
                        border: '1px solid #FECDD3',
                      }}
                    >
                      ⚠️ FLAGGED
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#ECFDF5',
                        color: '#065F46',
                        border: '1px solid #A7F3D0',
                      }}
                    >
                      ✓ PASS
                    </span>
                  )}
                </td>

                {/* Finding Description */}
                <td style={{ padding: '12px 14px', verticalAlign: 'top', color: '#334155', lineHeight: 1.45 }}>
                  {rule.isFlagged ? (
                    <div>
                      <strong style={{ color: '#9F1239' }}>{rule.finding?.title}: </strong>
                      <span>{rule.finding?.description}</span>
                      {rule.finding?.evidence && rule.finding.evidence.length > 0 && (
                        <div
                          style={{
                            marginTop: '6px',
                            padding: '6px 10px',
                            backgroundColor: '#FFF1F2',
                            border: '1px solid #FECDD3',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            color: '#9F1239',
                          }}
                        >
                          &ldquo;{rule.finding.evidence[0].excerpt}&rdquo;
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: '#475569' }}>{rule.cleanSummary}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
