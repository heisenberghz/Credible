import { AnalysisReport, FindingSource } from '../../types/analysis';

function describeAttribution(source: FindingSource | undefined, isDeterministic: boolean): string {
  const resolved =
    source ?? (isDeterministic ? FindingSource.DETERMINISTIC : FindingSource.AI_INTERPRETED);

  switch (resolved) {
    case FindingSource.RECONCILED:
      return 'Reconciled (Rules + AI)';
    case FindingSource.AI_INTERPRETED:
      return 'AI Semantic Inference';
    default:
      return 'Deterministic Heuristic';
  }
}

export function generateMarkdownDossier(report: AnalysisReport): string {
  const timestamp = report.timestamp ? new Date(report.timestamp).toUTCString() : new Date().toUTCString();
  const score = report.score ?? 100;

  let markdown = `# CREDIBLE SECURITY AUDIT DOSSIER
**Report ID:** \`${report.request_id}\`  
**Generated:** ${timestamp}  
**Target URL:** \`${report.analyzed_url}\`  
**Scan Mode:** ${report.mode.toUpperCase()}  

---

## 1. EXECUTIVE VERDICT
- **Credibility Safety Index:** **${score} / 100**
- **Assessment Verdict:** **${report.assessment_status.toUpperCase()}**
- **Summary:** ${report.summary}

---

## 2. TRUST DNA MULTIDIMENSIONAL PROFILE (6 VECTORS)
`;

  if (report.trust_dna && report.trust_dna.length > 0) {
    markdown += `| Dimension | Status | Certainty | Heuristic Score | Summary |\n`;
    markdown += `|---|---|---|---|---|\n`;
    report.trust_dna.forEach((dim) => {
      markdown += `| **${dim.name}** | \`${dim.status}\` | ${dim.confidence} | ${dim.dimension_score ?? 'N/A'}/100 | ${dim.summary} |\n`;
    });
  } else {
    markdown += `*No Trust DNA vectors recorded.*\n`;
  }

  markdown += `\n---

## 3. PROOF MODE FORENSIC TRACE (${report.findings.length} FINDINGS)
`;

  if (report.proof_mode && report.proof_mode.length > 0) {
    report.proof_mode.forEach((entry, idx) => {
      markdown += `### Finding ${idx + 1}: ${entry.title}\n`;
      markdown += `- **Location / Selector:** \`${entry.location}\`\n`;
      markdown += `- **Engine Attribution:** ${describeAttribution(entry.source, entry.is_deterministic)}${entry.check_id ? ` (Rule: \`${entry.check_id}\`)` : ''}\n`;
      markdown += `- **Certainty:** ${entry.confidence}\n\n`;
      markdown += `> **Observed DOM Signal:**  \n> "${entry.observed}"\n\n`;
      markdown += `**Threat Interpretation:**  \n${entry.why_it_matters}\n\n`;
      if (entry.limitations && entry.limitations.length > 0) {
        markdown += `**Confidence Limitations:**  \n${entry.limitations.join(' • ')}\n\n`;
      }
    });
  } else {
    markdown += `*✓ Clean signatures. No threat indicators detected.*\n\n`;
  }

  markdown += `---

## 4. PROPORTIONATE NEXT BEST ACTIONS
`;

  if (report.next_best_actions && report.next_best_actions.length > 0) {
    report.next_best_actions.forEach((act, idx) => {
      markdown += `${idx + 1}. ${act}\n`;
    });
  } else {
    markdown += `1. Navigate to official employer website independently.\n2. Confirm role on verified careers portal.\n`;
  }

  markdown += `\n---
*Audit compiled automatically by Credible Defensive Security Engine (Manifest V3).*
`;

  return markdown;
}

export function downloadDossier(report: AnalysisReport, format: 'markdown' | 'json' = 'markdown') {
  let content = '';
  let filename = `credible-audit-${report.request_id.slice(0, 8)}`;
  let mimeType = 'text/plain';

  if (format === 'markdown') {
    content = generateMarkdownDossier(report);
    filename += '.md';
    mimeType = 'text/markdown';
  } else {
    content = JSON.stringify(report, null, 2);
    filename += '.json';
    mimeType = 'application/json';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

