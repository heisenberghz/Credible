import React, { useEffect, useState } from 'react';
import { AnalysisReport, AssessmentStatus, AnalysisMode, Confidence } from '../types/analysis';
import { ExtensionMessage, MessageType } from '../types/extension';
import { DashboardHeader } from './components/DashboardHeader';
import { ScanLedger } from './components/ScanLedger';
import { BenchmarkSwitcher } from './components/BenchmarkSwitcher';
import { HeuristicMatrix } from './components/HeuristicMatrix';
import { FindingList } from '../sidepanel/components/FindingList';
import { ChecksAndLimitations } from '../sidepanel/components/ChecksAndLimitations';
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
  {
    request_id: 'demo-scen-3-ambiguous',
    status: 'completed',
    assessment_status: AssessmentStatus.CAUTION,
    score: 62,
    summary: 'Caution warranted. Informal research project (Nova Research Labs) with task-based pay. Lacks corporate registrar verification; no fee demands or credential pressure observed.',
    analyzed_url: 'http://localhost:8080/ambiguous.html',
    mode: AnalysisMode.PAGE,
    timestamp: new Date().toISOString(),
    findings: [
      {
        id: 'context-informal_entity',
        title: 'Unchartered Community Entity',
        description: 'Informal community initiative lacking independent business registration.',
        severity: 'medium' as any,
        confidence: Confidence.LOW,
        status: 'detected' as any,
        evidence: [
          {
            source: 'visible_text',
            excerpt: 'Nova Research Labs is an informal research initiative benchmarking open multimodal models.',
            reason: 'Open community projects lack corporate legal recourse if compensation disputes arise.',
          },
        ],
        check_id: 'context.informal_entity',
        source: 'ai_interpreted' as any,
        limitations: ['Open-source projects are often legitimate, but lack formal corporate backing.'],
        recommended_action: 'Confirm project legitimacy through public open-source code repositories.',
      },
    ],
    trust_dna: [
      {
        id: 'payment_risk',
        name: 'Payment Risk',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.HIGH,
        summary: 'No upfront fees or deposit demands detected in analyzed content.',
        dimension_score: 95,
        evidence: [],
        limitations: [],
      },
      {
        id: 'identity_risk',
        name: 'Identity Risk',
        status: 'unknown' as any,
        confidence: Confidence.LOW,
        summary: 'Informal initiative without corporate business registration records.',
        dimension_score: 60,
        evidence: [],
        limitations: ['Corporate registrar records unverified.'],
      },
      {
        id: 'social_engineering_risk',
        name: 'Social Engineering Risk',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.MEDIUM,
        summary: 'Standard project description without urgency timers.',
        dimension_score: 90,
        evidence: [],
        limitations: [],
      },
      {
        id: 'data_exposure_risk',
        name: 'Data Exposure Risk',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.HIGH,
        summary: 'No sensitive document uploads requested upfront.',
        dimension_score: 95,
        evidence: [],
        limitations: [],
      },
      {
        id: 'link_domain_risk',
        name: 'Link and Domain Risk',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.HIGH,
        summary: 'Clean standard URL structure.',
        dimension_score: 98,
        evidence: [],
        limitations: [],
      },
      {
        id: 'evidence_confidence',
        name: 'Evidence Confidence',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.MEDIUM,
        summary: 'Heuristic checks complete with moderate confidence.',
        dimension_score: 70,
        evidence: [],
        limitations: [],
      },
    ],
    proof_mode: [
      {
        finding_id: 'context-informal_entity',
        title: 'Unchartered Community Entity',
        observed: 'Nova Research Labs is an informal research initiative benchmarking open multimodal models.',
        location: 'body > section',
        why_it_matters: 'Grassroots projects lack corporate legal recourse if compensation disputes arise.',
        check_id: 'context.informal_entity',
        is_deterministic: false,
        confidence: Confidence.LOW,
        limitations: ['Open-source projects are often legitimate but require escrow verification.'],
      },
    ],
    next_best_actions: [
      'Confirm project legitimacy through public open-source code repositories.',
      'Clarify payment mechanisms and escrow arrangements before performing extensive work.',
    ],
    checks: {
      executed: ['url.ip_host', 'url.suspicious_tld', 'content.payment_pressure'],
      not_executed: [],
      unavailable: [],
      failed: [],
    },
    limitations: [],
  },
];

export const DashboardApp: React.FC = () => {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [history, setHistory] = useState<AnalysisReport[]>(DEMO_REPORTS);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Load latest report and scan history from runtime/storage & listen for live updates
  useEffect(() => {
    // 1. Check background service worker for active report
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: MessageType.GET_LATEST_REPORT }, (res) => {
        if (!chrome.runtime.lastError && res?.report) {
          setReport(res.report);
          setHistory((prev) => [res.report, ...prev.filter((p) => p.request_id !== res.report.request_id)]);
        }
      });
    }

    // 2. Check storage for cached reports
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['credible_latest_report', 'credible_scan_history'], (res) => {
        if (res.credible_latest_report) {
          setReport((current) => current || res.credible_latest_report);
        } else {
          setReport((current) => current || DEMO_REPORTS[0]);
        }

        if (res.credible_scan_history && Array.isArray(res.credible_scan_history)) {
          setHistory((prev) => {
            const combined = [...res.credible_scan_history, ...prev];
            const unique = Array.from(new Map(combined.map((item) => [item.request_id, item])).values());
            return unique;
          });
        }
      });
    } else {
      setReport(DEMO_REPORTS[0]);
    }

    // 3. Listen for live SCAN_SUCCESS messages from background/sidepanel
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      const listener = (message: ExtensionMessage) => {
        if (message.type === MessageType.SCAN_SUCCESS && message.report) {
          setReport(message.report);
          setHistory((prev) => [message.report, ...prev.filter((p) => p.request_id !== message.report.request_id)]);
        }
      };
      chrome.runtime.onMessage.addListener(listener);
      return () => {
        chrome.runtime.onMessage.removeListener(listener);
      };
    }
  }, []);

  const handleSelectReport = (selected: AnalysisReport) => {
    setReport(selected);
  };

  const handleCopySummary = async () => {
    if (!report) return;
    try {
      const summaryText = `[Credible Forensic Dossier]\nTarget: ${report.analyzed_url}\nScore: ${report.score ?? 100}/100\nVerdict: ${report.assessment_status}\nSummary: ${report.summary}`;
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(summaryText);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
      }
    } catch {
      // Graceful fallback
    }
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
        chrome.tabs.query({ currentWindow: true }, async (tabs) => {
          // Identify the active target web tab (skipping internal chrome:// and extension:// URLs)
          const targetTab = tabs.find(
            (t) => t.url && !t.url.startsWith('chrome-extension://') && !t.url.startsWith('chrome://') && !t.url.startsWith('about:')
          ) || tabs[0];

          if (!targetTab?.id || !targetTab.url || targetTab.url.startsWith('chrome-extension://') || targetTab.url.startsWith('chrome://')) {
            alert('To scan a live web page, please open a website in a tab (e.g. any job board, article, or demo page) and click Scan.');
            setIsScanning(false);
            return;
          }

          chrome.tabs.sendMessage(targetTab.id, { type: 'EXTRACT_PAGE_CONTENT' }, async (response) => {
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
            } else {
              // If content script was not injected yet on a fresh tab, try background service worker
              if (chrome.runtime?.sendMessage) {
                chrome.runtime.sendMessage({ type: 'REQUEST_SCAN', tabId: targetTab.id }, (bgResponse) => {
                  if (bgResponse && bgResponse.report) {
                    setReport(bgResponse.report);
                    setHistory((prev) => [bgResponse.report, ...prev.filter((p) => p.request_id !== bgResponse.report.request_id)]);
                  }
                });
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

  const handleSelectBenchmark = (scenarioId: string) => {
    const found = history.find((h) => h.request_id === scenarioId) || DEMO_REPORTS.find((d) => d.request_id === scenarioId);
    if (found) {
      handleSelectReport(found);
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
        {/* BENCHMARK SCENARIO SWITCHER */}
        <BenchmarkSwitcher selectedId={report.request_id} onSelect={handleSelectBenchmark} />

        {/* FORENSIC HORIZON CONSOLE (UNIFIED HIGH-DENSITY TELEMETRY DECK) */}
        <div className="forensic-horizon-deck" data-testid="forensic-horizon-deck">
          {/* Panel 1: Chronograph Dial & Verdict */}
          <div className="horizon-panel horizon-verdict-panel">
            <div style={{ width: '84px', height: '84px', flexShrink: 0 }}>
              <ScoreGauge score={score} size={84} variant="dial-only" />
            </div>
            <div className="horizon-verdict-info">
              <span className="horizon-micro-label">OVERALL VERDICT</span>
              <span
                data-testid="dashboard-verdict-pill"
                className="horizon-verdict-pill"
                style={{
                  backgroundColor: verdictBg,
                  color: verdictText,
                  borderColor: verdictBorder,
                }}
              >
                {verdictLabel}
              </span>
              <div className="horizon-threat-count" style={{ color: isThreat ? '#E11D48' : '#059669' }}>
                {report.findings.length > 0 ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>{report.findings.length} Threat Vectors Triggered</span>
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>0 Threat Vectors Triggered</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="horizon-divider" />

          {/* Panel 2: Target Intelligence Telemetry */}
          <div className="horizon-panel horizon-target-panel">
            <div className="horizon-panel-header">
              <span className="horizon-micro-label">INVESTIGATION TARGET</span>
              <span className="horizon-protocol-badge">
                {report.analyzed_url.startsWith('https') ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                )}
                <span>{report.analyzed_url.startsWith('https') ? 'HTTPS' : 'HTTP'}</span>
              </span>
            </div>
            <div className="horizon-url-box" title={report.analyzed_url}>
              <code className="horizon-url-code">{report.analyzed_url}</code>
            </div>
            <div className="horizon-meta-row">
              <span>Mode: <strong style={{ color: '#0F172A' }}>{report.mode.toUpperCase()}</strong></span>
              <span>•</span>
              <span>Scanned: <strong style={{ color: '#0F172A' }}>{report.timestamp ? new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}</strong></span>
            </div>
          </div>

          {/* Divider */}
          <div className="horizon-divider" />

          {/* Panel 3: Heuristic Coverage & Defensive Privacy */}
          <div className="horizon-panel horizon-rules-panel">
            <div className="horizon-panel-header">
              <span className="horizon-micro-label">HEURISTIC DENSITY</span>
              <span className="horizon-privacy-chip">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>100% CLIENT PRIVACY</span>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', margin: '2px 0' }}>
              <span className="density-number">{report.checks?.executed?.length || 10}</span>
              <span className="density-label">Rules Evaluated</span>
            </div>
            <div className="horizon-progress-track">
              <div className="track-bar track-pass" style={{ flex: Math.max(1, (report.checks?.executed?.length || 10) - report.findings.length) }} />
              {report.findings.length > 0 && (
                <div className="track-bar track-flag" style={{ flex: report.findings.length }} />
              )}
            </div>
            <div className="horizon-meta-row">
              <span style={{ color: '#059669', fontWeight: 700 }}>✓ {(report.checks?.executed?.length || 10) - report.findings.length} Passed</span>
              <span>•</span>
              <span style={{ color: report.findings.length > 0 ? '#E11D48' : '#64748B', fontWeight: report.findings.length > 0 ? 800 : 500 }}>
                {report.findings.length} Flagged
              </span>
            </div>
          </div>
        </div>

        {/* EXECUTIVE NARRATIVE SUMMARY */}
        <section className="arch-card" data-testid="dashboard-hero" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0052FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginTop: '2px', flexShrink: 0 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  EXECUTIVE THREAT NARRATIVE
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={handleCopySummary}
                    data-testid="dashboard-copy-summary-btn"
                    className={`btn-copy ${copiedSummary ? 'copied' : ''}`}
                    title="Copy executive assessment summary"
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>{copiedSummary ? 'Copied' : 'Copy Summary'}</span>
                  </button>
                  <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    AI + HEURISTIC SYNTHESIS
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '14px', color: '#1E293B', lineHeight: 1.55, margin: 0, fontWeight: 500 }}>
                {report.summary}
              </p>
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  fontSize: '11px',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ color: '#0052FF', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  Epistemic Boundary:
                </span>
                <span>Absence of a warning is not proof of safety. Heuristic indicators evaluate observable patterns; independent verification via official employer channels is strongly advised.</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2-COLUMN PRIMARY FORENSIC WORKBENCH */}
        <div className="dashboard-grid">
          {/* LEFT COLUMN: Threat Findings (Evidence-First), Trust DNA & Rule Matrix */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FindingList findings={report.findings} />
            <TrustDnaPanel dimensions={report.trust_dna} />
            <HeuristicMatrix report={report} />
            <ChecksAndLimitations checks={report.checks} limitations={report.limitations} />
          </div>

          {/* RIGHT COLUMN: Proportionate Runbook, Proof Trace & Ledger */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <NextBestActionList actions={report.next_best_actions} />
            <ProofModePanel entries={report.proof_mode} showEmptyCleanState={true} />
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
