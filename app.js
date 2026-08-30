// ==========================================
// GLOBAL VARIABLES & MOCK DATA
// ==========================================
let traceMap = null; // Global map variable
const emailListContainer = document.getElementById('email-list');

// Initial Inbox Data (Simulating what is already in the database)
const inboxData = [
    {
        id: "msg_101",
        sender: "HR Department <hr@company-update.com>",
        subject: "Action Required: Update your payroll info"
    },
    {
        id: "msg_102",
        sender: "IT Support <admin@aicte-org.in>",
        subject: "Security Alert: Verify Your M365 Login"
    }
];


// ==========================================
// 1. INITIALIZE THE INBOX ON PAGE LOAD
// ==========================================
// Loop through initial data and render it
inboxData.forEach(email => {
    addEmailToInboxUI(email, false);
});

// Helper Function: Adds an email item to the left sidebar
function addEmailToInboxUI(email, prepend = false) {
    const emailDiv = document.createElement('div');
    emailDiv.className = 'email-item';
    emailDiv.id = `item-${email.id}`;
    emailDiv.innerHTML = `
        <div class="sender">${email.sender}</div>
        <div class="subject">${email.subject}</div>
    `;

    // When clicked, trigger the threat prediction API
    emailDiv.addEventListener('click', () => {
        // Remove highlight from all, add to clicked
        document.querySelectorAll('.email-item').forEach(el => el.classList.remove('active'));
        emailDiv.classList.add('active');

        predictThreat(email.id);
    });

    if (prepend) {
        emailListContainer.prepend(emailDiv);
        emailDiv.classList.add('active'); // auto-select newly added email
    } else {
        emailListContainer.appendChild(emailDiv);
    }
}


// ==========================================
// 2. TRIGGER BACKEND PREDICTION (THE AI ENGINE)
// ==========================================
async function predictThreat(emailId) {
    // Hide empty state, show loading spinner
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('dashboard-content').classList.add('hidden');
    document.getElementById('loading-state').classList.remove('hidden');

    try {
        /* --- BACKEND CONNECTION HERE --- */
        // const response = await fetch(`http://localhost:5000/api/predict/${emailId}`);
        // const predictionData = await response.json();

        // MOCK API DELAY
        await new Promise(resolve => setTimeout(resolve, 1500));

        // MOCK DATA based on selection
        let predictionData = {
            riskScore: 98,
            status: "Critical Phishing Threat",
            metadata: { sender: "admin@aicte-org.in", subject: "Security Alert: Verify Your M365 Login" },
            nlpFlags: [
                "High Urgency detected: 'Verify Your M365 Login'",
                "Lookalike domain: 'aicte-org.in' spoofing 'aicte.org'"
            ],
            originCoords: [55.7558, 37.6173], // Moscow
            originName: "Moscow, Russia (Suspicious IP: 185.102.34.1)"
        };

        renderDashboard(predictionData);
    } catch (error) {
        console.error("API Error:", error);
        alert("Failed to connect to the backend AI engine.");
    }
}


// ==========================================
// 3. RENDER DASHBOARD RESULTS
// ==========================================
function renderDashboard(data) {
    // Hide Loader, Show Dashboard UI
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('dashboard-content').classList.remove('hidden');

    // Update Text Fields
    document.getElementById('val-sender').innerText = data.metadata.sender;
    document.getElementById('val-subject').innerText = data.metadata.subject;

    const badge = document.getElementById('threat-badge');
    badge.innerText = `${data.status} (${data.riskScore}% Risk)`;
    badge.className = `badge ${data.riskScore > 80 ? 'critical' : 'safe'}`;

    // Update NLP Flags List
    const nlpUl = document.getElementById('nlp-results');
    nlpUl.innerHTML = '';
    data.nlpFlags.forEach(flag => {
        const li = document.createElement('li');
        li.innerText = flag;
        li.style.color = "var(--accent-red)";
        nlpUl.appendChild(li);
    });

    // Update the Map
    if (traceMap !== null) { traceMap.remove(); } // Destroy old map to prevent bugs
    traceMap = L.map('map-container').setView(data.originCoords, 4);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(traceMap);
    const marker = L.circleMarker(data.originCoords, { color: '#ff4c4c', radius: 8 }).addTo(traceMap);
    marker.bindPopup(`<b>Origin Identified:</b><br>${data.originName}`).openPopup();
}


// ==========================================
// 4. MODAL LOGIC (MANUAL INGESTION)
// ==========================================
const modal = document.getElementById('email-modal');
const openModalBtn = document.getElementById('btn-open-modal');
const closeModalBtn = document.getElementById('btn-close-modal');
const cancelModalBtn = document.getElementById('btn-cancel-modal');
const ingestForm = document.getElementById('ingest-form');

// Open / Close actions
openModalBtn.addEventListener('click', () => modal.classList.remove('hidden'));
closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
cancelModalBtn.addEventListener('click', () => modal.classList.add('hidden'));

// Form Submission
ingestForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const senderInput = document.getElementById('input-sender').value;
    const subjectInput = document.getElementById('input-subject').value;

    // Create new mock email object
    const newEmailData = {
        id: "msg_" + Date.now(),
        sender: senderInput || "Unknown Sender",
        subject: subjectInput || "No Subject"
    };

    // Add to UI, close modal, and predict
    addEmailToInboxUI(newEmailData, true);
    ingestForm.reset();
    modal.classList.add('hidden');
    predictThreat(newEmailData.id);
});


// ==========================================
// 5. LIVE MAILBOX SYNC LOGIC
// ==========================================
const btnSyncInbox = document.getElementById('btn-sync-inbox');
const syncIcon = document.getElementById('sync-icon');

if (btnSyncInbox) {
    btnSyncInbox.addEventListener('click', async () => {
        // Start spinning icon
        syncIcon.classList.add('is-syncing');
        btnSyncInbox.disabled = true;

        try {
            /* --- BACKEND CONNECTION HERE --- */
            // const response = await fetch('http://localhost:5000/api/sync-mailbox');

            // Simulating API delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Simulating 1 new email found by the backend
            const fetchedEmail = {
                id: "msg_sync_" + Date.now(),
                sender: "Finance Dept <billing@paypaI-secure.com>",
                subject: "Invoice #9940 Overdue - Immediate Payment Required"
            };

            addEmailToInboxUI(fetchedEmail, true);
            alert("Success: Synced 1 new threat from the live mailbox.");

        } catch (error) {
            console.error("Sync failed:", error);
            alert("Failed to sync mailbox.");
        } finally {
            // Stop spinning icon
            syncIcon.classList.remove('is-syncing');
            btnSyncInbox.disabled = false;
        }
    });
}