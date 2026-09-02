// ==========================================
// 1. GLOBAL STATE & MOCK DATABASE
// ==========================================
let traceMap = null;
const emailListContainer = document.getElementById('email-list');

// Initial Inbox Data mimicking live environment
const inboxData = [
    {
        id: "msg_safe",
        sender: "HR System <updates@company.com>",
        subject: "Q3 Benefits Enrollment Information"
    },
    {
        id: "msg_threat",
        sender: "IT Support <admin@aicte-org.in>", // Notice lookalike domain
        subject: "Security Alert: Verify Your M365 Login"
    }
];

// Initialize UI
inboxData.forEach(email => addEmailToInboxUI(email, false));

function addEmailToInboxUI(email, prepend = false) {
    const emailDiv = document.createElement('div');
    emailDiv.className = 'email-item';
    emailDiv.id = `item-${email.id}`;

    // Sanitize output for HTML
    const safeSender = email.sender.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    emailDiv.innerHTML = `<div class="sender">${safeSender}</div><div class="subject">${email.subject}</div>`;

    emailDiv.addEventListener('click', () => {
        document.querySelectorAll('.email-item').forEach(el => el.classList.remove('active'));
        emailDiv.classList.add('active');
        predictThreat(email.id); // Trigger Pipeline
    });

    if (prepend) {
        emailListContainer.prepend(emailDiv);
        emailDiv.classList.add('active');
    } else {
        emailListContainer.appendChild(emailDiv);
    }
}

// ==========================================
// 2. BACKEND API PIPELINE SIMULATION
// ==========================================
async function predictThreat(emailId) {
    // UI State Management
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('dashboard-content').classList.add('hidden');
    document.getElementById('loading-state').classList.remove('hidden');

    try {
        // [PYTHON API HOOK] -> fetch(`/api/analyze/${emailId}`)
        await new Promise(resolve => setTimeout(resolve, 1800));

        let pipelineData;

        // SAFE BASELINE CASE
        if (emailId === "msg_safe") {
            pipelineData = {
                summary: { id: "d68e-4253-b733", verdict: "LOW_RISK", timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) },
                metadata: { from: "updates@company.com", subject: "Q3 Benefits Enrollment Information", domain: "company.com", auth: "SPF: Pass | DKIM: Pass | DMARC: Pass" },
                geo: { ip: "20.191.9.51", location: "Boydton, United States", isp: "Microsoft Corporation", coords: [36.6676, -78.3875] },
                ai: {
                    pred: "HAM", ham: "99.12%", spam: "0.88%",
                    seScore: "8.44%", finalScore: "4.20%", risk: "LOW",
                    patterns: [{ name: "Informational", val: "88.12%" }]
                },
                hops: [{ hop: 0, ip: "20.191.9.51", host: "mail.company.com", trusted: "Yes" }]
            };
        }
        // HIGH RISK PHISHING CASE (Matches problem statement specs)
        else {
            pipelineData = {
                summary: { id: "f99a-ab12-c444", verdict: "CRITICAL_RISK", timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) },
                metadata: { from: "admin@aicte-org.in", subject: "Security Alert: Verify Your M365 Login", domain: "aicte-org.in", auth: "SPF: Fail | DKIM: Fail | DMARC: Fail" },
                geo: { ip: "185.102.34.1", location: "Moscow, Russia", isp: "SecureLayer Proxy", coords: [55.7558, 37.6173] },
                ai: {
                    pred: "SPAM", ham: "2.18%", spam: "97.82%",
                    seScore: "87.52%", finalScore: "92.67%", risk: "HIGH",
                    patterns: [
                        { name: "Urgency", val: "98.69%" },
                        { name: "Suspicious Action", val: "96.33%" },
                        { name: "Fear Or Threat", val: "95.63%" },
                        { name: "Credential Request", val: "63.29%" }
                    ]
                },
                hops: [
                    { hop: 0, ip: "185.102.34.1", host: "unknown.secure-proxy.ru", trusted: "No" },
                    { hop: 1, ip: "198.51.100.4", host: "relay.frankfurt.de", trusted: "No" }
                ]
            };
        }

        renderDashboard(pipelineData);
    } catch (error) { console.error("Pipeline Error:", error); }
}

// ==========================================
// 3. RENDER INVESTIGATION DASHBOARD
// ==========================================
function renderDashboard(data) {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('dashboard-content').classList.remove('hidden');

    const isCritical = data.summary.verdict.includes('CRITICAL');

    // Headers & Badges
    const badge = document.getElementById('threat-badge');
    badge.innerText = data.summary.verdict;
    badge.className = `badge ${isCritical ? 'critical' : 'low'}`;

    document.getElementById('val-case-id').innerText = data.summary.id;
    document.getElementById('val-verdict').innerText = data.summary.verdict;
    document.getElementById('val-verdict').style.color = isCritical ? "var(--accent-red)" : "#4caf50";
    document.getElementById('val-analyzed-at').innerText = data.summary.timestamp;

    // Metadata
    document.getElementById('val-from').innerText = data.metadata.from;
    document.getElementById('val-subject').innerText = data.metadata.subject;
    document.getElementById('val-domain').innerText = data.metadata.domain;
    document.getElementById('val-auth-status').innerText = data.metadata.auth;

    // Geolocation
    document.getElementById('val-origin-ip').innerText = data.geo.ip;
    document.getElementById('val-location').innerText = data.geo.location;
    document.getElementById('val-isp').innerText = data.geo.isp;

    // AI Engine Metrics
    document.getElementById('val-ai-prediction').innerText = data.ai.pred;
    document.getElementById('val-ai-prediction').style.color = data.ai.pred === "SPAM" ? "var(--accent-red)" : "#4caf50";
    document.getElementById('val-ai-ham').innerText = data.ai.ham;
    document.getElementById('val-ai-spam').innerText = data.ai.spam;
    document.getElementById('val-ai-se-score').innerText = data.ai.seScore;

    const patternList = document.getElementById('ai-patterns-list');
    patternList.innerHTML = '';
    data.ai.patterns.forEach(p => {
        patternList.innerHTML += `<li><span><span class="check">✓</span>${p.name}</span> <span>: ${p.val}</span></li>`;
    });

    document.getElementById('val-final-threat-score').innerText = data.ai.finalScore;
    document.getElementById('val-final-risk-level').innerText = data.ai.risk;
    document.getElementById('val-final-risk-level').style.color = isCritical ? "var(--accent-red)" : "#4caf50";

    // Trace Hops
    const relayBody = document.getElementById('relay-path-body');
    relayBody.innerHTML = '';
    data.hops.forEach(hop => {
        relayBody.innerHTML += `<tr><td>${hop.hop}</td><td>${hop.ip}</td><td>${hop.host}</td><td>${hop.trusted}</td></tr>`;
    });

    // Geo Map Rendering
    if (traceMap !== null) { traceMap.remove(); }
    traceMap = L.map('map-container').setView(data.geo.coords, 4);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(traceMap);
    L.circleMarker(data.geo.coords, { color: isCritical ? '#ff4c4c' : '#4caf50', radius: 8 })
        .addTo(traceMap)
        .bindPopup(`<b>Origin:</b> ${data.geo.location}`).openPopup();
}

// ==========================================
// 4. DOWNLOAD PDF REPORT FEATURE
// ==========================================
document.getElementById('btn-download-report').addEventListener('click', () => {
    const element = document.getElementById('printable-report');

    // Prep DOM for printing (shows headers, footers, hides map bounds)
    document.getElementById('val-report-date').innerText = "Generated: " + new Date().toUTCString();
    document.querySelectorAll('.print-only').forEach(f => f.style.display = 'block');

    const opt = {
        margin: 0.4,
        filename: `Forensic_Trace_${document.getElementById('val-case-id').innerText}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        // Reset DOM post-generation
        document.querySelectorAll('.print-only').forEach(f => f.style.display = 'none');
    });
});

// ==========================================
// 5. TABBED MODAL INGESTION LOGIC
// ==========================================
const modal = document.getElementById('email-modal');
document.getElementById('btn-open-modal').addEventListener('click', () => modal.classList.remove('hidden'));
document.querySelectorAll('#btn-close-modal, #btn-cancel-modal').forEach(btn =>
    btn.addEventListener('click', () => modal.classList.add('hidden'))
);

// Tab Switching
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.add('hidden'));

        // Add active class to target
        btn.classList.add('active');
        document.getElementById(btn.dataset.target).classList.remove('hidden');
    });
});

// Form Submission Routing
document.getElementById('ingest-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const activeTab = document.querySelector('.tab-content:not(.hidden)').id;
    let newEmail = { id: "msg_" + Date.now() };

    if (activeTab === 'tab-file') {
        const file = document.getElementById('input-file').files[0];
        if (!file) return alert("Please select a .eml file");
        newEmail.sender = `File: ${file.name}`;
        newEmail.subject = "Raw .eml Extraction";
        // [PYTHON HOOK] -> Upload 'file' via FormData to backend
    }
    else if (activeTab === 'tab-raw') {
        const text = document.getElementById('input-raw').value;
        if (!text) return alert("Please paste headers");
        newEmail.sender = "Extracted from Raw Text";
        newEmail.subject = "Custom Header Trace";
        // [PYTHON HOOK] -> POST text string to backend
    }
    else if (activeTab === 'tab-manual') {
        newEmail.sender = document.getElementById('input-sender').value || "Unknown Sender";
        newEmail.subject = document.getElementById('input-subject').value || "No Subject";
    }

    addEmailToInboxUI(newEmail, true);
    this.reset();
    modal.classList.add('hidden');
    predictThreat(newEmail.id);
});

// ==========================================
// 6. AUTOMATED IMAP SYNC LOGIC
// ==========================================
const btnSync = document.getElementById('btn-sync-inbox');
btnSync.addEventListener('click', async () => {
    document.getElementById('sync-icon').classList.add('is-syncing');
    btnSync.disabled = true;

    // [PYTHON HOOK] -> fetch('/api/imap-poll')
    await new Promise(resolve => setTimeout(resolve, 2000));

    addEmailToInboxUI({
        id: "msg_sync_" + Date.now(),
        sender: "Billing Dept <invoices@paypaI-secure.com>",
        subject: "URGENT: Invoice #9940 Overdue"
    }, true);

    document.getElementById('sync-icon').classList.remove('is-syncing');
    btnSync.disabled = false;
});