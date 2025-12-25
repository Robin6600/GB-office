// --- Global State ---
let selectedDate = new Date().toISOString().split('T')[0];
let currentReportId = null;
let timerInterval = null;
let startTime = null;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setInterval(updateClock, 1000);
    renderCalendar();
    loadData(selectedDate);
    fetchIssues();
    fetchResources();
    
    // Set 'Today' as default selected text
    document.getElementById('selected-date-display').innerText = formatDateReadable(selectedDate);
});

// --- Clock ---
function updateClock() {
    const now = new Date();
    document.getElementById('clock-time').innerText = now.toLocaleTimeString('en-US', { hour12: true });
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('clock-date').innerText = now.toLocaleDateString('en-US', options);
}

function formatDateReadable(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

// --- Status ---
function setStatus(status, save = true) {
    const activeBtn = document.getElementById('status-btn-active');
    const inactiveBtn = document.getElementById('status-btn-inactive');

    // Reset both to neutral
    activeBtn.classList.remove('status-active-on');
    inactiveBtn.classList.remove('status-inactive-on');
    
    // Apply specific color based on status
    if (status === 'Active') {
        activeBtn.classList.add('status-active-on');
    } else if (status === 'Inactive') {
        inactiveBtn.classList.add('status-inactive-on');
    }
    
    // Save only if requested (avoid loops if called from save)
    if (save) {
        saveDailyLog(status); 
    }
}

// --- Attendance System ---
function punchIn() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    
    // Update UI
    document.getElementById('btn-in').disabled = true;
    document.getElementById('btn-in').innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> Office In <br><small style="font-size: 0.7em;">${timeStr}</small>`;
    document.getElementById('btn-out').disabled = false;
    
    // Turn Green Light On
    setStatus('Active', false); // Don't save yet, we save below with time
    
    saveDailyLog('Active', timeStr, null); // passing in_time
}

function punchOut() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    
    document.getElementById('btn-in').disabled = false;
    document.getElementById('btn-out').disabled = true;
    document.getElementById('btn-out').innerHTML = `<i class="fa-solid fa-right-from-bracket"></i> Office Out <br><small style="font-size: 0.7em;">${timeStr}</small>`;
    
    // Turn Red Light On
    setStatus('Inactive', false);
    
    saveDailyLog('Inactive', null, timeStr); // passing out_time
}

// --- Data Management ---
async function loadData(date) {
    selectedDate = date;
    document.getElementById('selected-date-display').innerText = formatDateReadable(date);
    
    // Visual update of calendar
    renderCalendar();

    // Check if date is today for Edit Restrictions
    const today = new Date().toISOString().split('T')[0];
    const isToday = (date === today);

    // Disable/Enable Editing based on date
    const inputs = document.querySelectorAll('.input-field, .btn-gold, .btn-outline, .status-badge');
    if (!isToday) {
        inputs.forEach(el => el.disabled = true);
        document.querySelectorAll('.status-badge').forEach(el => el.style.pointerEvents = 'none');
        const saveBtn = document.querySelector('button[onclick="saveDailyLog()"]');
        if(saveBtn) saveBtn.style.display = 'none';
    } else {
        inputs.forEach(el => el.disabled = false);
        document.querySelectorAll('.status-badge').forEach(el => el.style.pointerEvents = 'auto');
         const saveBtn = document.querySelector('button[onclick="saveDailyLog()"]');
        if(saveBtn) saveBtn.style.display = 'inline-block';
    }

    try {
        const response = await fetch(`/api/reports?date=${date}`);
        const data = await response.json();
        
        // Reset fields first
        resetForm();

        if (data && data.id) {
            currentReportId = data.id;
            
            // Attendance
            if (data.in_time) {
                document.getElementById('btn-in').disabled = true; // Always disabled if set
                document.getElementById('btn-in').innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> Office In <br><small style="font-size: 0.7em;">${data.in_time}</small>`;
                document.getElementById('btn-out').disabled = false;
            }
            if (data.out_time) {
                document.getElementById('btn-out').disabled = true; // Always disabled if set
                document.getElementById('btn-out').innerHTML = `<i class="fa-solid fa-right-from-bracket"></i> Office Out <br><small style="font-size: 0.7em;">${data.out_time}</small>`;
            }

            // Task Logs (Mapped to new fields)
            // Stored in DB as: cinematography_log, video_editing_log, live_operating_log, script_log
            // We map them to: Completed, WIP, Plan, Issues
            
            // Helper to handle legacy JSON vs new Text
            const parseOrStr = (str) => {
                if(!str) return '';
                try {
                    const j = JSON.parse(str);
                    // If it's the old object structure, summarize it roughly
                    if(j.clips || j.project || j.duration) {
                        return JSON.stringify(j); // Just show raw legacy data
                    }
                    return str; // It was a simple string (or JSON we don't recognize)
                } catch (e) {
                    return str; // It's just a string
                }
            };

            document.getElementById('task-completed').value = parseOrStr(data.cinematography_log);
            document.getElementById('task-wip').value = parseOrStr(data.video_editing_log);
            document.getElementById('task-tomorrow').value = parseOrStr(data.live_operating_log);
            document.getElementById('task-issues').value = data.script_log || '';

            // Status
            if (data.active_status) {
                 setStatus(data.active_status, false);
            }

        } else {
            currentReportId = null;
        }
        
        // Re-enforce disabled state for buttons if not today (resetForm might have cleared it)
        if (!isToday) {
             document.getElementById('btn-in').disabled = true;
             document.getElementById('btn-out').disabled = true;
             // Ensure texts are still there if we loaded data
        }
        
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

function resetForm() {
    document.getElementById('btn-in').disabled = false;
    document.getElementById('btn-in').innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Office In';
    document.getElementById('btn-out').disabled = true;
    document.getElementById('btn-out').innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Office Out';
    
    // Reset Status to Neutral
    document.getElementById('status-btn-active').classList.remove('status-active-on');
    document.getElementById('status-btn-inactive').classList.remove('status-inactive-on');
    
    document.getElementById('task-completed').value = '';
    document.getElementById('task-wip').value = '';
    document.getElementById('task-tomorrow').value = '';
    document.getElementById('task-issues').value = '';
}

async function saveDailyLog(statusOverride = null, inTimeOverride = null, outTimeOverride = null) {
    // Gather all data
    let activeStatus = statusOverride;
    if (!activeStatus) {
        if (document.getElementById('status-btn-active').classList.contains('status-active-on')) {
            activeStatus = 'Active';
        } else if (document.getElementById('status-btn-inactive').classList.contains('status-inactive-on')) {
            activeStatus = 'Inactive';
        } else {
            activeStatus = 'Active'; // default
        }
    }
    
    let inTime = inTimeOverride;
    if (!inTime) {
        const btnHTML = document.getElementById('btn-in').innerHTML;
        // Parsing <i ...></i> Office In <br><small>TIME</small>
        // Or simple text "Office In"
        if (btnHTML.includes('<small')) {
            // Extract time from small tag
            const match = btnHTML.match(/<small.*?>(.*?)<\/small>/);
            if(match) inTime = match[1];
        } else if (document.getElementById('btn-in').innerText.includes(': ')) {
             // Fallback if we used "Office In: TIME"
             inTime = document.getElementById('btn-in').innerText.split(': ')[1];
        }
    }
    
    let outTime = outTimeOverride;
    if (!outTime) {
        const btnHTML = document.getElementById('btn-out').innerHTML;
        if (btnHTML.includes('<small')) {
            const match = btnHTML.match(/<small.*?>(.*?)<\/small>/);
            if(match) outTime = match[1];
        } else if (document.getElementById('btn-out').innerText.includes(': ')) {
             outTime = document.getElementById('btn-out').innerText.split(': ')[1];
        }
    }

    const payload = {
        date: selectedDate,
        in_time: inTime,
        out_time: outTime,
        active_status: activeStatus,
        status: statusOverride || 'Present', // Legacy field
        // Mapping new fields to old DB Columns
        cinematography_log: document.getElementById('task-completed').value, // Completed
        video_editing_log: document.getElementById('task-wip').value,       // WIP
        live_operating_log: document.getElementById('task-tomorrow').value, // Plan
        script_log: document.getElementById('task-issues').value,           // Issues
        tasks: "Daily Tasks" // Legacy
    };

    try {
        const res = await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        
        // UI Feedback
        const msg = document.getElementById('save-msg');
        msg.style.opacity = 1;
        setTimeout(() => msg.style.opacity = 0, 2000);
        
        // Refresh to ensure IDs and states are synced
        loadData(selectedDate);
        
    } catch (err) {
        console.error(err);
        alert("Failed to save data");
    }
}

// --- Calendar Logic ---
let currentCalDate = new Date();

function renderCalendar() {
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    
    document.getElementById('calendar-month-year').innerText = currentCalDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const daysContainer = document.getElementById('calendar-days');
    daysContainer.innerHTML = '';
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayEl = document.createElement('div');
        dayEl.innerText = i;
        dayEl.className = 'cal-day';
        
        if (dateStr === selectedDate) {
            dayEl.classList.add('selected');
        }
        
        // To highlight days with data, we could fetch month summary.
        // For now, simplify.
        
        dayEl.onclick = () => loadData(dateStr);
        daysContainer.appendChild(dayEl);
    }
}

function changeMonth(delta) {
    currentCalDate.setMonth(currentCalDate.getMonth() + delta);
    renderCalendar();
}

// --- Issues Logic ---
async function fetchIssues() {
    const res = await fetch('/api/issues');
    const issues = await res.json();
    const container = document.getElementById('issues-list');
    container.innerHTML = '';
    
    issues.forEach(issue => {
        const el = document.createElement('div');
        el.className = 'glass-panel';
        el.style.background = 'rgba(255,255,255,0.05)';
        el.style.padding = '10px';
        el.innerHTML = `
            <div class="flex-between">
                <strong>${issue.title}</strong>
                <i class="fa-solid fa-check-circle" style="color: ${issue.is_solved ? 'var(--success-green)' : 'var(--text-gray)'}; cursor: pointer;" onclick="toggleIssue(${issue.id}, ${!issue.is_solved})"></i>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-gray); margin-top: 5px;">${issue.solution || 'No solution yet'}</p>
        `;
        container.appendChild(el);
    });
}

function toggleIssueForm() {
    const form = document.getElementById('issue-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function addIssue() {
    const title = document.getElementById('issue-title').value;
    const solution = document.getElementById('issue-solution').value;
    
    if(!title) return;
    
    await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            date: selectedDate,
            title,
            is_solved: solution ? 1 : 0,
            solution
        })
    });
    
    document.getElementById('issue-title').value = '';
    document.getElementById('issue-solution').value = '';
    toggleIssueForm();
    fetchIssues();
}

async function toggleIssue(id, newState) {
    await fetch(`/api/issues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_solved: newState ? 1 : 0, solution: 'Marked as solved' }) // Simplified
    });
    fetchIssues();
}

// --- Resources Logic ---
async function fetchResources() {
    const res = await fetch('/api/resources');
    const resources = await res.json();
    const list = document.getElementById('resource-list');
    list.innerHTML = '';
    
    resources.forEach(r => {
        const li = document.createElement('li');
        li.style.marginTop = '10px';
        li.innerHTML = `<a href="${r.url}" target="_blank" style="color: var(--text-white); text-decoration: none; display: flex; align-items: center; gap: 10px;">
            <i class="fa-solid ${r.type === 'drive' ? 'fa-google-drive' : 'fa-link'}"></i> ${r.title}
        </a>`;
        list.appendChild(li);
    });
}

function addResourceModal() {
    const url = prompt("Enter URL:");
    const title = prompt("Enter Title:");
    if(url && title) {
        fetch('/api/resources', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ type: 'link', title, url })
        }).then(() => fetchResources());
    }
}

// --- Report Generation ---
function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(212, 175, 55); // Gold
    doc.text("Golden Basket | SRR Creative Hub", 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0,0,0);
    doc.text("Monthly Report: " + document.getElementById('calendar-month-year').innerText, 20, 30);
    
    doc.text("Generated on: " + new Date().toLocaleDateString(), 20, 40);
    
    // Simple summary
    doc.text("Feature under construction: Detailed report table will appear here.", 20, 60);
    
    doc.save("SRR_Hub_Report.pdf");
}
