import React, { useEffect, useState } from 'react';
import { AnalysisReport, AssessmentStatus, AnalysisMode, Confidence } from '../types/analysis';
import { DashboardHeader } from './components/DashboardHeader';
import { ScanLedger } from './components/ScanLedger';
import { TrustDnaPanel } from '../sidepanel/components/TrustDnaPanel';
import { ProofModePanel } from '../sidepanel/components/ProofModePanel';
import { NextBestActionList } from '../sidepanel/components/NextBestActionList';
import { ScoreGauge } from '../sidepanel/components/ScoreGauge';
import { apiClient } from '../services/api-client';

const DEMO_REPORTS: AnalysisReport[] = [
  {
    request_id: 'demo-scen-1-benign',
    status: 'completed',
    assessment_status: AssessmentStatus.BENIGN,
    score: 97,
    summary: 'Standard corporate recruitment patterns observed. No upfront fee requests, deposit demands, or deceptive patterns detected in analyzed content.',
    analyzed_url: 'http://localhost:8080/benign.html',
    mode: AnalysisMode.PAGE,
    timestamp: new Date().toISOString(),
    findings: [],
    trust_dna: [
      {
        id: 'payment_risk',
        name: 'Payment Risk',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.HIGH,
        summary: 'No upfront fee requests, deposit demands, or cryptocurrency transfer language observed in content.',
        dimension_score: 99,
        evidence: [],
        limitations: ['Absence of detected payment requests is not a guarantee that off-platform fees will not be requested later.'],
      },
      {
        id: 'identity_risk',
        name: 'Identity Risk',
        status: 'unknown' as any,
        confidence: Confidence.LOW,
        summary: 'Domain conforms to standard naming conventions, but corporate identity was not independently verified via registrar records.',
        dimension_score: 75,
        evidence: [],
        limitations: ['Independent corporate registrar lookup and WHOIS ownership queries were not performed to preserve user privacy.'],
      },
      {
        id: 'social_engineering_risk',
        name: 'Social Engineering Risk',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.MEDIUM,
        summary: 'No artificial urgency, scarcity countdowns, or unrealistic promises observed in content.',
        dimension_score: 98,
        evidence: [],
        limitations: [],
      },
      {
        id: 'data_exposure_risk',
        name: 'Data Exposure Risk',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.HIGH,
        summary: 'No illicit credential harvesting or premature personal identity document collection observed.',
        dimension_score: 99,
        evidence: [],
        limitations: [],
      },
      {
        id: 'link_domain_risk',
        name: 'Link and Domain Risk',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.HIGH,
        summary: 'Secure local development loopback context with standard link structure.',
        dimension_score: 100,
        evidence: [],
        limitations: [],
      },
      {
        id: 'evidence_confidence',
        name: 'Evidence Confidence',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.MEDIUM,
        summary: 'Assessment grounded reliably on client-observable deterministic heuristic rules.',
        dimension_score: 92,
        evidence: [],
        limitations: [],
      },
    ],
    proof_mode: [],
    next_best_actions: [
      "Navigate to the organization's official website directly by typing its address into your browser.",
      "Search for the specific job or internship listing on the company's verified careers portal.",
      "Verify the recruiter's identity using independently sourced contact information.",
    ],
    checks: {
      executed: ['url.ip_host', 'url.suspicious_tld', 'content.payment_pressure', 'content.urgency', 'content.credential_pressure'],
      not_executed: [],
      unavailable: [],
      failed: [],
    },
    limitations: ['Static client analysis cannot guarantee offline corporate legitimacy.'],
  },
  {
    request_id: 'demo-scen-2-suspicious',
    status: 'completed',
    assessment_status: AssessmentStatus.SUSPICIOUS,
    score: 28,
    summary: 'High-threat fraudulent recruitment pattern detected: demands $250 upfront cryptocurrency deposit, creates artificial 24h scarcity pressure, and prematurely harvests passport and bank details.',
    analyzed_url: 'http://localhost:8080/suspicious.html',
    mode: AnalysisMode.PAGE,
    timestamp: new Date().toISOString(),
    findings: [
      {
        id: 'content-payment_pressure',
        title: 'Upfront Payment or Deposit Requested',
        description: 'Explicit request for upfront payment, registration fee, or security deposit detected.',
        severity: 'high' as any,
        confidence: Confidence.HIGH,
        status: 'detected' as any,
        evidence: [
          {
            source: 'visible_text',
            excerpt: 'Prior to equipment shipment, selected applicants must pay a refundable security deposit of $250 via bitcoin wallet or wire transfer.',
            reason: 'Legitimate employers and university internships do not charge candidates money to apply or work.',
          },
        ],
        check_id: 'content.payment_pressure',
        source: 'deterministic' as any,
        limitations: ['Legitimate employers never demand fee payments via crypto or wire transfer.'],
        recommended_action: 'Do not transfer any fees, deposits, or advance money for an internship or job offer.',
      },
      {
        id: 'content-urgency',
        title: 'Urgency and Scarcity Pressure',
        description: 'Language creating artificial urgency or pressure to act quickly without independent review.',
        severity: 'medium' as any,
        confidence: Confidence.MEDIUM,
        status: 'detected' as any,
        evidence: [
          {
            source: 'visible_text',
            excerpt: 'Urgent Announcement: Only 2 openings remaining for immediate hire! This offer expires in 24 hours.',
            reason: 'Artificial scarcity pressure designed to bypass critical thinking.',
          },
        ],
        check_id: 'content.urgency',
        source: 'deterministic' as any,
        limitations: ['Scammers use artificial deadlines to rush victims.'],
        recommended_action: 'Pause and verify opportunity independently before taking rushed action.',
      },
    ],
    trust_dna: [
      {
        id: 'payment_risk',
        name: 'Payment Risk',
        status: 'warning_found' as any,
        confidence: Confidence.HIGH,
        summary: 'Mandatory upfront fee or cryptocurrency security deposit requested.',
        dimension_score: 15,
        evidence: [],
        limitations: [],
      },
      {
        id: 'identity_risk',
        name: 'Identity Risk',
        status: 'unknown' as any,
        confidence: Confidence.LOW,
        summary: 'Corporate entity uncorroborated via independent business registries.',
        dimension_score: 75,
        evidence: [],
        limitations: ['WHOIS ownership records not queried.'],
      },
      {
        id: 'social_engineering_risk',
        name: 'Social Engineering Risk',
        status: 'warning_found' as any,
        confidence: Confidence.HIGH,
        summary: 'Artificial 24-hour expiration countdown timer detected.',
        dimension_score: 30,
        evidence: [],
        limitations: [],
      },
      {
        id: 'data_exposure_risk',
        name: 'Data Exposure Risk',
        status: 'warning_found' as any,
        confidence: Confidence.HIGH,
        summary: 'Demands government passport and bank account details on initial unauthenticated form.',
        dimension_score: 20,
        evidence: [],
        limitations: [],
      },
      {
        id: 'link_domain_risk',
        name: 'Link and Domain Risk',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.HIGH,
        summary: 'Local loopback URL structure.',
        dimension_score: 95,
        evidence: [],
        limitations: [],
      },
      {
        id: 'evidence_confidence',
        name: 'Evidence Confidence',
        status: 'warning_found' as any,
        confidence: Confidence.HIGH,
        summary: 'Multiple overlapping deterministic heuristics triggered across text and form fields.',
        dimension_score: 95,
        evidence: [],
        limitations: [],
      },
    ],
    proof_mode: [
      {
        finding_id: 'content-payment_pressure',
        title: 'Upfront Payment or Deposit Requested',
        observed: 'Prior to equipment shipment, selected applicants must pay a refundable security deposit of $250 via bitcoin wallet or wire transfer.',
        location: 'body > form > p',
        why_it_matters: 'Explicit request for upfront payment, registration fee, or security deposit detected.',
        check_id: 'content.payment_pressure',
        is_deterministic: true,
        confidence: Confidence.HIGH,
        limitations: ['Legitimate employers never charge candidates money to apply or work.'],
      },
      {
        finding_id: 'content-urgency',
        title: 'Urgency and Scarcity Pressure',
        observed: 'Urgent Announcement: Only 2 openings remaining for immediate hire! This offer expires in 24 hours.',
        location: 'body > div.callout',
        why_it_matters: 'Language creating artificial urgency or pressure to act quickly without independent review.',
        check_id: 'content.urgency',
        is_deterministic: true,
        confidence: Confidence.MEDIUM,
        limitations: ['Attacks frequently create artificial deadlines to prevent victims from consulting others.'],
      },
    ],
    next_best_actions: [
      'Do not transfer any fees, deposits, or advance money for an internship or job offer.',
      'Refrain from uploading government identity cards or bank details before formal verification.',
      'Visit the official employer or organization website independently to check for official openings.',
      'If contacted via messaging apps (Telegram/WhatsApp), request confirmation through an official corporate email domain.',
    ],
    checks: {
      executed: ['url.ip_host', 'url.suspicious_tld', 'content.payment_pressure', 'content.urgency', 'content.data_exposure'],
      not_executed: [],
      unavailable: [],
      failed: [],
    },
    limitations: ['Deterministic rules verified.'],
  },
];

export const DashboardApp: React.FC = () => {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [history, setHistory] = useState<AnalysisReport[]>(DEMO_REPORTS);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Load latest report and scan history from chrome.storage if available
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['credible_latest_report', 'credible_scan_history'], (res) => {
        if (res.credible_latest_report) {
          setReport(res.credible_latest_report);
        } else {
          setReport(DEMO_REPORTS[0]);
        }

        if (res.credible_scan_history && Array.isArray(res.credible_scan_history)) {
          setHistory(res.credible_scan_history);
        }
      });
    } else {
      setReport(DEMO_REPORTS[0]);
    }
  }, []);

  const handleSelectReport = (selected: AnalysisReport) => {
    setReport(selected);
  };

  const handleClearHistory = () => {
    setHistory([]);
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.remove(['credible_scan_history']);
    }
  };

  const handleTriggerScan = async () => {
    if (isScanning) return;
    setIsScanning(true);

    try {
      if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
          const activeTab = tabs[0];
          if (!activeTab?.id) {
            setIsScanning(false);
            return;
          }

          chrome.tabs.sendMessage(activeTab.id, { type: 'EXTRACT_PAGE_CONTENT' }, async (response) => {
            if (response && response.success && response.data) {
              try {
                const newReport = await apiClient.analyzePage(response.data);

                setReport(newReport);
                setHistory((prev) => [newReport, ...prev.filter((p) => p.request_id !== newReport.request_id)]);

                if (chrome.storage?.local) {
                  chrome.storage.local.set({
                    credible_latest_report: newReport,
                    credible_scan_history: [newReport, ...history],
                  });
                }
              } catch (e) {
                console.error('Scan failed:', e);
              }
            }
            setIsScanning(false);
          });
        });
      } else {
        // Fallback for tests/preview
        setTimeout(() => {
          setIsScanning(false);
        }, 800);
      }
    } catch {
      setIsScanning(false);
    }
  };

  if (!report) {
    return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'monospace' }}>INITIALIZING COMMAND CENTER...</div>;
  }

  const score = report.score ?? 100;
  const isThreat = report.assessment_status === AssessmentStatus.SUSPICIOUS || score < 50;
  const isCaution = report.assessment_status === AssessmentStatus.CAUTION || (score >= 50 && score < 85);

  let verdictBg = '#ECFDF5';
  let verdictText = '#065F46';
  let verdictBorder = '#A7F3D0';
  let verdictLabel = 'CLEAN SIGNALS';

  if (isThreat) {
    verdictBg = '#FFF1F2';
    verdictText = '#9F1239';
    verdictBorder = '#FECDD3';
    verdictLabel = 'CRITICAL THREAT DETECTED';
  } else if (isCaution) {
    verdictBg = '#FFFBEB';
    verdictText = '#92400E';
    verdictBorder = '#FDE68A';
    verdictLabel = 'CAUTION / UNVERIFIED';
  }

  return (
    <div className="dashboard-container" data-testid="dashboard-container">
      <DashboardHeader report={report} onScan={handleTriggerScan} isScanning={isScanning} />

      <main className="dashboard-main">
        {/* HERO EXECUTIVE OVERVIEW */}
        <section className="arch-card" data-testid="dashboard-hero" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            {/* Left: Score Gauge & Threat Verdict */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <ScoreGauge score={score} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    data-testid="dashboard-verdict-pill"
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: verdictBg,
                      color: verdictText,
                      border: `1px solid ${verdictBorder}`,
                    }}
                  >
                    {verdictLabel}
                  </span>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748B' }}>
                    {report.findings.length} FINDINGS DETECTED
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#334155', maxWidth: '640px', lineHeight: 1.5 }}>
                  {report.summary}
                </p>
              </div>
            </div>

            {/* Right: Telemetry Details */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#64748B',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '12px 16px',
                minWidth: '280px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span>TARGET:</span>
                <strong style={{ color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }} title={report.analyzed_url}>
                  {report.analyzed_url}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>SCAN MODE:</span>
                <strong style={{ color: '#0F172A', textTransform: 'uppercase' }}>{report.mode}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>CHECKS EXECUTED:</span>
                <strong style={{ color: '#0F172A' }}>{report.checks.executed.length} RULES</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>TIMESTAMP:</span>
                <strong style={{ color: '#0F172A' }}>
                  {report.timestamp ? new Date(report.timestamp).toLocaleTimeString() : 'Recent'}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* 2-COLUMN FORENSIC WORKBENCH */}
        <div className="dashboard-grid">
          {/* LEFT COLUMN: Trust DNA & Action Runbook */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <TrustDnaPanel dimensions={report.trust_dna} />
            <NextBestActionList actions={report.next_best_actions} />
          </div>

          {/* RIGHT COLUMN: Proof Mode Audit Trace & Investigation Ledger */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ProofModePanel entries={report.proof_mode} />
            <ScanLedger
              history={history}
              selectedId={report.request_id}
              onSelect={handleSelectReport}
              onClear={handleClearHistory}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
