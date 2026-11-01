CREDIBLE
Know before you trust.
AI-powered
Defensive cybersecurity
Chrome Extension · Manifest V3

Product Requirements Document (PRD)
Team: Reservoir Dogs · Vaibhav, Akshay, Ayush, Harshith
Status: Proposed · Hackathon MVP · No implementation started


1. Executive summary
Credible is an AI-powered defensive cybersecurity Chrome extension that helps users recognize suspicious online opportunities and social-engineering attempts before they share sensitive information, click questionable links, or make payments.
It analyzes user-selected text or relevant content from a webpage, combines AI-assisted interpretation with deterministic security rules, and presents an explainable risk report.
Unlike a tool that simply labels a website “safe” or “unsafe,” Credible aims to answer four questions:
- What looks suspicious?
- What evidence supports that concern?
- What remains unknown?
- What should the user do next?
The initial use case is online internships, job offers, scholarships, freelance projects, and recruitment messages. The underlying defensive approach can later extend to other forms of online social engineering.
Product vision
Make everyday cybersecurity accessible to people who are not security experts, by turning confusing online threats into understandable evidence and practical protective actions.
Core value proposition
Credible transforms AI-based threat analysis into explainable, actionable cybersecurity guidance directly inside the browser.
2. Problem statement
Online scams and social-engineering attacks often exploit trust rather than technical vulnerabilities.
An attacker may impersonate a legitimate company, invent an internship, request an upfront fee, use urgency to pressure an applicant, or direct the user to a page designed to collect personal information.
Users often lack the time, security knowledge, or reliable evidence needed to assess these situations.
Existing detection approaches can also leave users with unanswered questions: a score alone does not explain what triggered a warning or how to verify the claim independently.
Credible addresses this gap by combining contextual analysis, transparent risk indicators, evidence attribution, and practical mitigation guidance.
3. Goals and non-goals
Goals
1. Detect potential social-engineering and opportunity-related warning signs.
2. Explain each finding using relevant text and its reasoning.
3. Distinguish verified evidence, suspicious indicators, and unknown information.
4. Recommend safe, prioritized next actions.
5. Operate directly within Chrome with minimal permissions.
6. Protect user privacy and resist malicious webpage instructions.
7. Demonstrate a working end-to-end defensive-security workflow at the hackathon.
Non-goals for the MVP
- Guaranteeing that a website, employer, or opportunity is legitimate.
- Replacing antivirus software, endpoint detection, or enterprise security systems.
- Automatically blocking websites, submitting reports, or contacting companies.
- Running penetration tests or scanning systems for vulnerabilities.
- Claiming that AI can determine fraud from writing style alone.
- Collecting browsing history or monitoring every page in the background.
- Building a large community-reputation database before the core product works.
4. Target users









Primary: Students and fresh graduates
Need to assess internships, recruitment messages, placement opportunities, and scholarship offers.











Secondary: Freelancers and job seekers
Need to assess clients, job postings, payment arrangements, and requests for personal information.











Future: Digital safety educators
Need understandable examples of phishing, impersonation, manipulation, and online risk.



5. Core product features
Feature 1 — Trust DNA
MVP
A multidimensional assessment rather than a single opaque scam score.
Risk dimension	What Credible examines
Payment risk	Upfront fees, deposits, or unusual payment requests
Identity risk	Possible impersonation or inconsistent organization details
Social-engineering risk	Urgency, coercive language, unrealistic promises, and manipulation
Data-exposure risk	Requests for sensitive information or documents
Link and domain risk	Suspicious URL patterns and possible lookalike domains
Evidence confidence	How well the available evidence supports the findings
Each dimension receives a status such as warning found, no indicator detected in checked content, or unknown.
A lack of detected warning signs must never be presented as proof that an opportunity is safe.
Feature 2 — Proof Mode
MVP · Key differentiator
Every significant warning should provide an explanation that users can inspect.
A finding contains:
- The relevant sentence or observable indicator.
- The type of risk involved.
- Why the indicator matters.
- Evidence or source links, when available.
- Confidence and verification status.
- What additional information could change the assessment.
Example:
Finding: An upfront registration fee is requested before the internship begins.

Reason: Paying an unverified party creates financial risk. This request warrants independent verification but does not, by itself, prove fraud.

The report should separate directly observed text from AI interpretation and externally corroborated facts.
Feature 3 — Next Best Action
MVP
Credible turns analysis into a practical response plan.
Example actions:
1. Pause before paying or sharing sensitive documents.
2. Visit the organization's official website independently.
3. Check whether the opportunity appears on its official careers page.
4. Verify the recruiter through independently sourced contact details.
5. Reassess the opportunity after gathering additional evidence.
Actions should be tailored to the findings and prioritize reducing potential harm.
Feature 4 — Select-to-Verify
MVP
Users select suspicious text on a page and request a focused analysis.
Examples include:
- “Pay a refundable fee to reserve your internship.”
- “Guaranteed high income with no experience.”
- “Send your identity documents immediately to secure selection.”
The extension analyzes the selected statement in its surrounding context rather than interpreting isolated words as conclusive evidence.
Feature 5 — Impersonation Radar
Stretch goal
Examine possible identity inconsistencies, such as:
- Domains resembling a known organization's domain.
- Company names that conflict across the listing and application page.
- Recruiter contact details that cannot be corroborated.
- An opportunity that cannot be found through independently accessed official channels.
This feature must distinguish a suspicious resemblance from a confirmed impersonation. Legitimate companies may use third-party recruitment platforms.
Feature 6 — Opportunity Consistency Check
Stretch goal
Compare claims within the current page and, when available, independent sources.
Potential discrepancies include employer identity, role, compensation, location, eligibility, and application process.
Credible should state which claims conflict and link to the evidence. It must not invent corroboration or interpret missing information as proof of wrongdoing.
Feature 7 — Privacy-first design
MVP requirement
- Analyze only after an explicit user action.
- Request only the browser permissions required by implemented features.
- Send only necessary content to the backend.
- Keep AI API keys on the backend, never inside the extension.
- Avoid storing page content by default.
- Explain when page text will be sent to a remote AI service.
- Provide a clear error when content cannot be accessed or analyzed.
6. User experience and workflow

Step 1 — Encounter
The user opens a potentially suspicious opportunity in Chrome.




Step 2 — Analyze
The user clicks the Credible extension or selects a suspicious statement and requests an analysis.




Step 3 — Assess
The backend applies deterministic checks and AI-assisted interpretation to the submitted content.




Step 4 — Understand
The user reviews Trust DNA, evidence-backed findings, unknowns, and confidence limitations.




Step 5 — Act
The user follows the suggested verification or protective actions before proceeding.



7. Functional requirements
ID	Requirement	Acceptance criteria
FR-01	Analyze selected text	User can submit selected text and receive a structured assessment
FR-02	Analyze page content	User can request analysis of relevant readable content from the active page
FR-03	Detect warning indicators	Rules identify supported patterns such as upfront fee requests and urgency signals
FR-04	Generate Trust DNA	Report contains separate risk dimensions and explicit unknown states
FR-05	Explain findings	Each finding includes a reason and relevant observed evidence
FR-06	Recommend actions	Report contains practical, prioritized next steps
FR-07	Validate AI output	Backend rejects or repairs malformed responses before displaying them
FR-08	Handle failures	Users receive a clear message when analysis is unavailable
FR-09	Protect user data	Analysis is user-initiated and API secrets remain server-side
FR-10	Resist hostile content	Instructions embedded in analyzed webpages cannot override the analysis policy
FR-11	Display uncertainty	Missing evidence is not treated as proof of legitimacy or fraud
FR-12	Support demo testing	Team can run repeatable benign, suspicious, and ambiguous test cases
8. Technical architecture
Recommended stack
Layer	Technology	Purpose
Browser extension	Chrome Manifest V3	Extension platform and lifecycle
Popup UI	React + TypeScript + Vite	Report interface and user interactions
Content extraction	TypeScript content script	Extract selected text or relevant readable page content
Background logic	Extension service worker	Coordinate extension actions and requests
Backend API	Python + FastAPI	Validate requests and orchestrate analysis
AI analysis	LLM API	Interpret context and generate structured explanations
Security engine	Python deterministic rules	Detect explicit patterns and normalize findings
Validation	Pydantic	Validate input and output schemas
HTML processing	Beautiful Soup, if required	Parse supported HTML fetched by the backend
Testing	pytest and extension test cases	Validate behavior, security, and reliability
Version control	GitHub	Collaboration and code review
A database is not required for the initial MVP. Avoid persistent storage until there is a clear use case.
Architecture diagram
#chatgpt-mermaid-_r_7f3_{font-family:"Yu Gothic UI",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:14px;fill:rgb(255, 255, 255);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-_r_7f3_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_7f3_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_7f3_ .error-icon{fill:rgba(255, 255, 255, 0.03);}#chatgpt-mermaid-_r_7f3_ .error-text{fill:rgb(255, 255, 255);stroke:rgb(255, 255, 255);}#chatgpt-mermaid-_r_7f3_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-_r_7f3_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-_r_7f3_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-_r_7f3_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-_r_7f3_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-_r_7f3_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-_r_7f3_ .marker{fill:rgba(255, 255, 255, 0.498);stroke:rgba(255, 255, 255, 0.498);}#chatgpt-mermaid-_r_7f3_ .marker.cross{stroke:rgba(255, 255, 255, 0.498);}#chatgpt-mermaid-_r_7f3_ svg{font-family:"Yu Gothic UI",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:14px;}#chatgpt-mermaid-_r_7f3_ p{margin:0;}#chatgpt-mermaid-_r_7f3_ .label{font-family:"Yu Gothic UI",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:rgb(255, 255, 255);}#chatgpt-mermaid-_r_7f3_ .cluster-label text{fill:rgb(255, 255, 255);}#chatgpt-mermaid-_r_7f3_ .cluster-label span{color:rgb(255, 255, 255);}#chatgpt-mermaid-_r_7f3_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-_r_7f3_ .label text,#chatgpt-mermaid-_r_7f3_ span{fill:rgb(255, 255, 255);color:rgb(255, 255, 255);}#chatgpt-mermaid-_r_7f3_ .node rect,#chatgpt-mermaid-_r_7f3_ .node circle,#chatgpt-mermaid-_r_7f3_ .node ellipse,#chatgpt-mermaid-_r_7f3_ .node polygon,#chatgpt-mermaid-_r_7f3_ .node path{fill:rgb(17, 40, 19);stroke:rgb(58, 132, 63);stroke-width:1px;}#chatgpt-mermaid-_r_7f3_ .rough-node .label text,#chatgpt-mermaid-_r_7f3_ .node .label text,#chatgpt-mermaid-_r_7f3_ .image-shape .label,#chatgpt-mermaid-_r_7f3_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-_r_7f3_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-_r_7f3_ .rough-node .label,#chatgpt-mermaid-_r_7f3_ .node .label,#chatgpt-mermaid-_r_7f3_ .image-shape .label,#chatgpt-mermaid-_r_7f3_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-_r_7f3_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-_r_7f3_ .root .anchor path{fill:rgba(255, 255, 255, 0.498)!important;stroke-width:0;stroke:rgba(255, 255, 255, 0.498);}#chatgpt-mermaid-_r_7f3_ .arrowheadPath{fill:rgba(255, 255, 255, 0.498);}#chatgpt-mermaid-_r_7f3_ .edgePath .path{stroke:rgba(255, 255, 255, 0.498);stroke-width:1px;}#chatgpt-mermaid-_r_7f3_ .flowchart-link{stroke:rgba(255, 255, 255, 0.498);fill:none;}#chatgpt-mermaid-_r_7f3_ .edgeLabel{background-color:rgb(0, 0, 0);text-align:center;}#chatgpt-mermaid-_r_7f3_ .edgeLabel p{background-color:rgb(0, 0, 0);}#chatgpt-mermaid-_r_7f3_ .edgeLabel rect{opacity:0.5;background-color:rgb(0, 0, 0);fill:rgb(0, 0, 0);}#chatgpt-mermaid-_r_7f3_ .labelBkg{background-color:rgba(0, 0, 0, 0.5);}#chatgpt-mermaid-_r_7f3_ .cluster rect{fill:rgba(255, 255, 255, 0.03);stroke:rgba(255, 255, 255, 0.082);stroke-width:1px;}#chatgpt-mermaid-_r_7f3_ .cluster text{fill:rgb(255, 255, 255);}#chatgpt-mermaid-_r_7f3_ .cluster span{color:rgb(255, 255, 255);}#chatgpt-mermaid-_r_7f3_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"Yu Gothic UI",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:12px;background:rgba(255, 255, 255, 0.03);border:1px solid rgba(255, 255, 255, 0.082);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-_r_7f3_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(255, 255, 255);}#chatgpt-mermaid-_r_7f3_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-_r_7f3_ .icon-shape,#chatgpt-mermaid-_r_7f3_ .image-shape{background-color:rgb(0, 0, 0);text-align:center;}#chatgpt-mermaid-_r_7f3_ .icon-shape p,#chatgpt-mermaid-_r_7f3_ .image-shape p{background-color:rgb(0, 0, 0);padding:2px;}#chatgpt-mermaid-_r_7f3_ .icon-shape .label rect,#chatgpt-mermaid-_r_7f3_ .image-shape .label rect{opacity:0.5;background-color:rgb(0, 0, 0);fill:rgb(0, 0, 0);}#chatgpt-mermaid-_r_7f3_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-_r_7f3_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-_r_7f3_ .node .neo-node{stroke:rgb(58, 132, 63);}#chatgpt-mermaid-_r_7f3_ [data-look="neo"].node rect,#chatgpt-mermaid-_r_7f3_ [data-look="neo"].cluster rect,#chatgpt-mermaid-_r_7f3_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-_r_7f3_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_7f3_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-_r_7f3_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-_r_7f3_-gradient);stroke-width:1px;}#chatgpt-mermaid-_r_7f3_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_7f3_ [data-look="neo"].node .neo-line path{stroke:rgb(58, 132, 63);filter:none;}#chatgpt-mermaid-_r_7f3_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-_r_7f3_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_7f3_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-_r_7f3_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-_r_7f3_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_7f3_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-_r_7f3_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_7f3_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(140, 223, 173);}#chatgpt-mermaid-_r_7f3_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(140, 223, 173);}#chatgpt-mermaid-_r_7f3_ .node tspan[font-weight="normal"],#chatgpt-mermaid-_r_7f3_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-_r_7f3_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(2, 28, 12);stroke:rgb(26, 75, 45);stroke-width:1px;}#chatgpt-mermaid-_r_7f3_ .node rect,#chatgpt-mermaid-_r_7f3_ .node circle,#chatgpt-mermaid-_r_7f3_ .node ellipse,#chatgpt-mermaid-_r_7f3_ .node polygon,#chatgpt-mermaid-_r_7f3_ .node path{fill:rgb(0, 55, 22);stroke:rgba(255, 255, 255, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_7f3_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-_r_7f3_ .node.mermaid-decision .label-container{fill:rgb(2, 28, 12);stroke:rgb(26, 75, 45);stroke-dasharray:2,2;}#chatgpt-mermaid-_r_7f3_ .edgePaths .flowchart-link{stroke:rgba(255, 255, 255, 0.498);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-_r_7f3_ .marker{fill:rgba(255, 255, 255, 0.498);stroke:rgba(255, 255, 255, 0.498);}#chatgpt-mermaid-_r_7f3_ :root{--mermaid-font-family:"Yu Gothic UI",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}User browsing in ChromeCredible Extension UISelected Text / Page ContentManifest V3 Service WorkerFastAPI BackendInput Validation andSanitizationDeterministic Risk RulesLLM AnalysisFinding ReconciliationSchema ValidationTrust DNA + Proof ModeNext Best Action





Architecture principles
- The extension is the primary product, not a separate web application.
- The backend is the only component that holds the AI provider's secret key.
- Deterministic checks and AI-generated findings remain distinguishable.
- External verification is a separate capability, not something the LLM may pretend to have performed.
- All report content is validated before rendering.
- The extension does not automatically click links, submit forms, or perform transactions.
9. AI and risk-analysis methodology
Credible should use a hybrid analysis pipeline rather than relying on an LLM alone.
#chatgpt-mermaid-_r_7fc_{font-family:"Yu Gothic UI",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:14px;fill:rgb(255, 255, 255);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-_r_7fc_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_7fc_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_7fc_ .error-icon{fill:rgba(255, 255, 255, 0.03);}#chatgpt-mermaid-_r_7fc_ .error-text{fill:rgb(255, 255, 255);stroke:rgb(255, 255, 255);}#chatgpt-mermaid-_r_7fc_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-_r_7fc_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-_r_7fc_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-_r_7fc_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-_r_7fc_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-_r_7fc_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-_r_7fc_ .marker{fill:rgba(255, 255, 255, 0.498);stroke:rgba(255, 255, 255, 0.498);}#chatgpt-mermaid-_r_7fc_ .marker.cross{stroke:rgba(255, 255, 255, 0.498);}#chatgpt-mermaid-_r_7fc_ svg{font-family:"Yu Gothic UI",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:14px;}#chatgpt-mermaid-_r_7fc_ p{margin:0;}#chatgpt-mermaid-_r_7fc_ .label{font-family:"Yu Gothic UI",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:rgb(255, 255, 255);}#chatgpt-mermaid-_r_7fc_ .cluster-label text{fill:rgb(255, 255, 255);}#chatgpt-mermaid-_r_7fc_ .cluster-label span{color:rgb(255, 255, 255);}#chatgpt-mermaid-_r_7fc_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-_r_7fc_ .label text,#chatgpt-mermaid-_r_7fc_ span{fill:rgb(255, 255, 255);color:rgb(255, 255, 255);}#chatgpt-mermaid-_r_7fc_ .node rect,#chatgpt-mermaid-_r_7fc_ .node circle,#chatgpt-mermaid-_r_7fc_ .node ellipse,#chatgpt-mermaid-_r_7fc_ .node polygon,#chatgpt-mermaid-_r_7fc_ .node path{fill:rgb(17, 40, 19);stroke:rgb(58, 132, 63);stroke-width:1px;}#chatgpt-mermaid-_r_7fc_ .rough-node .label text,#chatgpt-mermaid-_r_7fc_ .node .label text,#chatgpt-mermaid-_r_7fc_ .image-shape .label,#chatgpt-mermaid-_r_7fc_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-_r_7fc_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-_r_7fc_ .rough-node .label,#chatgpt-mermaid-_r_7fc_ .node .label,#chatgpt-mermaid-_r_7fc_ .image-shape .label,#chatgpt-mermaid-_r_7fc_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-_r_7fc_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-_r_7fc_ .root .anchor path{fill:rgba(255, 255, 255, 0.498)!important;stroke-width:0;stroke:rgba(255, 255, 255, 0.498);}#chatgpt-mermaid-_r_7fc_ .arrowheadPath{fill:rgba(255, 255, 255, 0.498);}#chatgpt-mermaid-_r_7fc_ .edgePath .path{stroke:rgba(255, 255, 255, 0.498);stroke-width:1px;}#chatgpt-mermaid-_r_7fc_ .flowchart-link{stroke:rgba(255, 255, 255, 0.498);fill:none;}#chatgpt-mermaid-_r_7fc_ .edgeLabel{background-color:rgb(0, 0, 0);text-align:center;}#chatgpt-mermaid-_r_7fc_ .edgeLabel p{background-color:rgb(0, 0, 0);}#chatgpt-mermaid-_r_7fc_ .edgeLabel rect{opacity:0.5;background-color:rgb(0, 0, 0);fill:rgb(0, 0, 0);}#chatgpt-mermaid-_r_7fc_ .labelBkg{background-color:rgba(0, 0, 0, 0.5);}#chatgpt-mermaid-_r_7fc_ .cluster rect{fill:rgba(255, 255, 255, 0.03);stroke:rgba(255, 255, 255, 0.082);stroke-width:1px;}#chatgpt-mermaid-_r_7fc_ .cluster text{fill:rgb(255, 255, 255);}#chatgpt-mermaid-_r_7fc_ .cluster span{color:rgb(255, 255, 255);}#chatgpt-mermaid-_r_7fc_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"Yu Gothic UI",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:12px;background:rgba(255, 255, 255, 0.03);border:1px solid rgba(255, 255, 255, 0.082);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-_r_7fc_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(255, 255, 255);}#chatgpt-mermaid-_r_7fc_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-_r_7fc_ .icon-shape,#chatgpt-mermaid-_r_7fc_ .image-shape{background-color:rgb(0, 0, 0);text-align:center;}#chatgpt-mermaid-_r_7fc_ .icon-shape p,#chatgpt-mermaid-_r_7fc_ .image-shape p{background-color:rgb(0, 0, 0);padding:2px;}#chatgpt-mermaid-_r_7fc_ .icon-shape .label rect,#chatgpt-mermaid-_r_7fc_ .image-shape .label rect{opacity:0.5;background-color:rgb(0, 0, 0);fill:rgb(0, 0, 0);}#chatgpt-mermaid-_r_7fc_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-_r_7fc_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-_r_7fc_ .node .neo-node{stroke:rgb(58, 132, 63);}#chatgpt-mermaid-_r_7fc_ [data-look="neo"].node rect,#chatgpt-mermaid-_r_7fc_ [data-look="neo"].cluster rect,#chatgpt-mermaid-_r_7fc_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-_r_7fc_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_7fc_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-_r_7fc_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-_r_7fc_-gradient);stroke-width:1px;}#chatgpt-mermaid-_r_7fc_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_7fc_ [data-look="neo"].node .neo-line path{stroke:rgb(58, 132, 63);filter:none;}#chatgpt-mermaid-_r_7fc_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-_r_7fc_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_7fc_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-_r_7fc_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-_r_7fc_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_7fc_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-_r_7fc_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_7fc_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(140, 223, 173);}#chatgpt-mermaid-_r_7fc_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(140, 223, 173);}#chatgpt-mermaid-_r_7fc_ .node tspan[font-weight="normal"],#chatgpt-mermaid-_r_7fc_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-_r_7fc_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(2, 28, 12);stroke:rgb(26, 75, 45);stroke-width:1px;}#chatgpt-mermaid-_r_7fc_ .node rect,#chatgpt-mermaid-_r_7fc_ .node circle,#chatgpt-mermaid-_r_7fc_ .node ellipse,#chatgpt-mermaid-_r_7fc_ .node polygon,#chatgpt-mermaid-_r_7fc_ .node path{fill:rgb(0, 55, 22);stroke:rgba(255, 255, 255, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_7fc_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-_r_7fc_ .node.mermaid-decision .label-container{fill:rgb(2, 28, 12);stroke:rgb(26, 75, 45);stroke-dasharray:2,2;}#chatgpt-mermaid-_r_7fc_ .edgePaths .flowchart-link{stroke:rgba(255, 255, 255, 0.498);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-_r_7fc_ .marker{fill:rgba(255, 255, 255, 0.498);stroke:rgba(255, 255, 255, 0.498);}#chatgpt-mermaid-_r_7fc_ :root{--mermaid-font-family:"Yu Gothic UI",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}User-submitted contentNormalize and limit inputDeterministic indicator checksLLM contextual interpretationMerge and deduplicatefindingsValidate evidence referencesAssign status and uncertaintyGenerate recommendedactionsReturn validated report





Deterministic analysis
Use transparent rules for identifiable patterns, such as:
- Explicit requests for upfront payments.
- Language pressuring users to act immediately.
- Requests for sensitive information.
- Suspicious URL structures or domain inconsistencies.
- Inconsistencies between provided company and role information.
Rules must consider context and avoid treating individual keywords as conclusive proof.
LLM analysis
The LLM is responsible for contextual interpretation, explaining why an observed pattern may matter, identifying missing evidence, and generating actionable guidance.
It must not invent sources, claim to have visited websites it did not access, or present unsupported accusations as facts.
Trust DNA scoring
If you display a numerical risk score, label it as a heuristic risk indicator, not a statistically validated probability that an opportunity is fraudulent.
The report should disclose which indicators contributed to the assessment and whether independent verification was performed.
For the hackathon MVP, categorical statuses and transparent explanations are preferable to false precision.
10. Defensive cybersecurity threat model
This section is particularly important to the project pitch.
Threat	Potential harm	Credible's defensive response
Recruitment phishing	Theft of credentials or personal information	Identify suspicious requests and recommend independent verification
Social engineering	User pressured into unsafe action	Explain urgency, manipulation, or unrealistic claims
Financial scams	Unnecessary or fraudulent payments	Highlight upfront payment requests and advise caution
Brand impersonation	User trusts a fake organization	Flag possible domain and identity inconsistencies
Malicious webpage instructions	AI is manipulated into ignoring its rules	Treat page content as untrusted data; enforce server-side instructions and validation
Malicious links	User visits a dangerous destination	Flag supported URL indicators; do not automatically open links
Sensitive data exposure	User unintentionally submits private content	Minimize collection and transmit only necessary content
False positives	Legitimate opportunities are incorrectly flagged	Explain the evidence, show uncertainty, and avoid categorical accusations
False negatives	Suspicious content is missed	State analysis limitations and recommend independent verification
Threats against Credible itself
Credible must treat both analyzed webpages and LLM output as potentially untrusted.
- Prompt injection: Text such as “ignore all previous instructions” within a webpage is content to analyze, not an instruction to follow.
- Malformed model output: Parse and validate structured output before rendering.
- API abuse: Apply request-size limits, timeouts, rate limits, and appropriate backend access controls.
- Secret exposure: Store API keys in backend environment variables or a suitable secret manager.
- Server-side request forgery (SSRF): If URL fetching is implemented, restrict schemes, block loopback/private/link-local destinations, validate DNS resolution and redirects, and defend against DNS rebinding.
- Unsafe rendering: Render untrusted text as text, not executable HTML; never execute webpage-provided scripts.
- Overbroad permissions: Avoid unrestricted browsing-history access and unnecessary host permissions.
MVP decision: Prefer user-initiated text extraction from the active page over arbitrary backend URL fetching. Add URL fetching only when there is time to implement its security controls properly.
11. API design
Proposed endpoint:
POST /api/v1/analyze
Example request:

{
  "content": "Example internship listing requesting a registration fee.",
  "content_type": "selected_text",
  "page_url": "https://example.org/internship",
  "analysis_options": {
    "risk_dimensions": [
      "payment",
      "identity",
      "social_engineering",
      "data_exposure",
      "link_domain"
    ]
  }
}



Example response:

{
  "assessment_status": "needs_verification",
  "summary": "An upfront fee request requires independent verification.",
  "dimensions": [
    {
      "name": "payment",
      "status": "warning_found",
      "confidence": "high",
      "reason": "The submitted text explicitly requests a fee."
    },
    {
      "name": "identity",
      "status": "unknown",
      "confidence": "low",
      "reason": "No independent identity verification was performed."
    }
  ],
  "findings": [
    {
      "type": "upfront_payment",
      "severity": "high",
      "evidence_quote": "Example internship listing requesting a registration fee.",
      "explanation": "Paying an unverified party creates financial risk.",
      "source_status": "user_submitted_content",
      "recommended_action": "Verify the opportunity through independently sourced official contact details."
    }
  ],
  "limitations": [
    "The employer's identity has not been independently verified.",
    "This assessment does not prove fraud or guarantee safety."
  ],
  "next_actions": [
    "Do not pay until the request has been independently verified.",
    "Check the official employer website."
  ]
}



This is an illustrative contract, not a live API. Backend validation must enforce enumerated values, length limits, evidence references, and required fields.
12. Privacy, permissions, and data handling
The extension should request the minimum permissions needed for the chosen features.
Potential permissions, subject to implementation:
- activeTab for user-initiated access to the active tab.
- scripting if programmatic content extraction is needed.
- storage only if user preferences or saved reports require it.
Do not request broad site access, browsing history, or continuous monitoring by default.
Data-handling rules
1. Analyze only after user interaction.
2. Limit extracted content to the relevant portion of the page.
3. Warn users before transmitting content to a remote AI provider.
4. Do not log full page contents or sensitive text by default.
5. Do not retain submitted content after analysis unless a clearly disclosed feature requires it.
6. Never send credentials, authentication cookies, or browser storage to the analysis service.
7. Document what data reaches the backend and any third-party AI provider.
13. Non-functional requirements
Area	Requirement
Performance	Return results within a reasonable demo-friendly time; measure actual latency
Reliability	Show a clear error if the API or AI provider is unavailable
Security	Validate input, isolate secrets, limit requests, and sanitize rendered output
Usability	A user should be able to start analysis without leaving the current page
Explainability	Findings should reference submitted evidence or a verified source
Privacy	Minimal collection and explicit user initiation
Compatibility	Target supported Chrome versions and test the unpacked extension
Maintainability	Keep extension, backend, and analysis rules in distinct modules
Accessibility	Use readable contrast, clear labels, and keyboard-accessible controls
Avoid promising exact latency, accuracy, or detection rates until they have been measured on a repeatable test set.
14. Evaluation and testing
Judges should see that Credible has been tested as a security tool, not merely connected to an AI API.
Test scenarios
- A legitimate listing with no obvious warning indicators.
- A listing explicitly demanding an upfront fee.
- A message pressuring a user to share personal information immediately.
- A suspicious lookalike domain.
- An ambiguous listing with insufficient evidence.
- A benign webpage containing text that attempts to manipulate the AI.
- Malformed model output and API timeouts.
- Very long or empty user submissions.
- A page containing irrelevant navigation, advertisements, and boilerplate text.
Evaluation metrics
Measure these during development:
- Precision and recall on a manually labeled test set.
- False-positive rate on benign examples.
- Whether quoted evidence actually appears in the submitted content.
- Whether unsupported claims or fabricated sources appear.
- Whether unknown cases are correctly labeled as unverified.
- End-to-end response latency and error rate.
- Whether users understand the report and recommended actions.
Report actual results from your test set. Do not claim a particular accuracy percentage without evidence.
15. Hackathon implementation roadmap
Phase 1

Foundation
Create the Manifest V3 extension, popup UI, content extraction, FastAPI endpoint, and basic API integration.



Phase 2

Core intelligence
Implement deterministic warning rules, structured LLM output, Trust DNA, evidence-based findings, and Next Best Action.



Phase 3

Defensive hardening
Test prompt injection, output validation, API failures, privacy boundaries, and permission behavior.



Phase 4

Demo readiness
Test a benign and suspicious opportunity, refine the report UI, prepare fallback examples, and rehearse the six-slide pitch.



Prioritization
Must-have: Extension popup, selected-text or page analysis, AI + deterministic checks, Trust DNA, Proof Mode, Next Best Action, basic security controls.
Stretch: Independent official-source corroboration, domain similarity analysis, consistency checks, saved reports.
Future: Community warning intelligence, broader integrations, expanded phishing analysis.
16. Definition of done
The MVP is ready to demonstrate when:
- The extension loads in Chrome without errors.
- The user can request an analysis of selected text or supported page content.
- The backend produces a validated, structured response.
- The UI displays risk dimensions, explanations, evidence, uncertainty, and actions.
- At least one benign and one suspicious test case work end to end.
- Prompt-injection and malformed-output tests have been run.
- API keys are not embedded in the extension.
- The extension does not claim independent verification when none was performed.
- The team has a reliable demonstration path and a fallback if the external AI API fails.
17. Risks and mitigations
Risk	Mitigation
AI invents evidence	Require evidence-grounded findings and validate quoted text
Too many false alarms	Use contextual rules, conservative language, and labeled test cases
AI provider fails	Provide graceful error handling and a limited deterministic fallback
Scope grows too large	Finish the core extension before external-source research
Website contains prompt injection	Treat analyzed content as untrusted data and validate output
URL fetching creates a security vulnerability	Defer it unless SSRF protections can be implemented and tested
Judges see it as a generic chatbot	Demonstrate browser integration, deterministic rules, evidence traceability, and defensive testing
18. The judge-facing differentiator
Your strongest technical story is not “we use AI to detect scams.” That alone is too generic.
Credible combines:
- Context-aware analysis: Interprets suspicious claims in their surrounding context.
- Hybrid detection: Combines deterministic security checks with AI-assisted reasoning.
- Evidence traceability: Makes it possible to inspect why a warning was generated.
- Explicit uncertainty: Separates suspicious indicators from corroborated facts and unknowns.
- Actionable defense: Helps users verify claims and reduce exposure before proceeding.
- Privacy by design: Makes analysis user-initiated and limits unnecessary access to browsing data.
Suggested final pitch
“Credible is an AI-powered defensive cybersecurity Chrome extension that helps users identify social-engineering risks before they become victims. It combines deterministic security rules with contextual AI analysis, presents evidence-backed warnings with explicit uncertainty, and recommends practical protective actions. Instead of asking users to blindly trust a scam score, Credible helps them understand the threat and make safer decisions.”

Closing line: Credible — Know before you trust.