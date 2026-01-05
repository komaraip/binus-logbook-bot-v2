// API endpoint - Use relative URL to work on any domain
const API_URL = `${window.location.origin}${window.location.pathname.replace(/\/$/, '')}/api`;

// DOM elements
const botForm = document.getElementById('botForm');
const uploadBtn = document.getElementById('uploadBtn');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearSessionBtn = document.getElementById('clearSessionBtn');
const uploadStatus = document.getElementById('uploadStatus');
const botStatus = document.getElementById('botStatus');
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');
const logContainer = document.getElementById('logContainer');
const resultsSection = document.getElementById('resultsSection');
const processedCount = document.getElementById('processedCount');
const errorCount = document.getElementById('errorCount');
const errorList = document.getElementById('errorList');
const excelFileInput = document.getElementById('excelFile');
const fileUploadText = document.querySelector('.file-upload-text');

// EventSource for real-time updates
let eventSource = null;

// Update file upload text
excelFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        fileUploadText.textContent = e.target.files[0].name;
    } else {
        fileUploadText.textContent = 'Choose file...';
    }
});

// Upload Excel file
uploadBtn.addEventListener('click', async () => {
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];

    if (!file) {
        showUploadStatus('Please select a file first', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('excelFile', file);

    try {
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading...';
        
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showUploadStatus('✅ File uploaded successfully!', 'success');
            addLog('File uploaded successfully', 'success');
        } else {
            showUploadStatus('❌ Upload failed: ' + data.message, 'error');
            addLog('Upload failed: ' + data.message, 'error');
        }
    } catch (error) {
        showUploadStatus('❌ Upload failed: ' + error.message, 'error');
        addLog('Upload failed: ' + error.message, 'error');
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload File';
    }
});

// Start bot
botForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        clockInTime: document.getElementById('clockInTime').value,
        clockOutTime: document.getElementById('clockOutTime').value,
        logbookMonth: document.getElementById('logbookMonth').value,
        internshipSemester: document.getElementById('internshipSemester').value
    };

    try {
        startBtn.disabled = true;
        stopBtn.disabled = false;

        const response = await fetch(`${API_URL}/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            updateBotStatus('running');
            addLog('Bot started successfully', 'success');
            connectSSE();
        } else {
            updateBotStatus('error');
            addLog('Failed to start bot: ' + data.message, 'error');
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
    } catch (error) {
        updateBotStatus('error');
        addLog('Failed to start bot: ' + error.message, 'error');
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
});

// Stop bot
stopBtn.addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_URL}/stop`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
            updateBotStatus('stopped');
            addLog('Bot stopped by user', 'warning');
            startBtn.disabled = false;
            stopBtn.disabled = true;
            disconnectSSE();
        } else {
            addLog('Failed to stop bot: ' + data.message, 'error');
        }
    } catch (error) {
        addLog('Failed to stop bot: ' + error.message, 'error');
    }
});

// Clear session
clearSessionBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to clear the saved session?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/clear-session`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
            addLog('Session cleared successfully', 'success');
            alert('Session cleared! You will need to login again on next run.');
        } else {
            addLog('Failed to clear session: ' + data.message, 'error');
        }
    } catch (error) {
        addLog('Failed to clear session: ' + error.message, 'error');
    }
});

// Connect to SSE for real-time updates
function connectSSE() {
    eventSource = new EventSource(`${API_URL}/events`);

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
            case 'status':
                addLog(data.message, 'info');
                break;
            case 'progress':
                updateProgress(data.processed, data.total);
                addLog(data.message, 'info');
                if (data.errors > 0) {
                    addLog(`⚠️ ${data.errors} errors encountered`, 'warning');
                }
                break;
            case 'complete':
                updateBotStatus('completed');
                addLog(data.message, 'success');
                showResults();
                startBtn.disabled = false;
                stopBtn.disabled = true;
                disconnectSSE();
                break;
            case 'error':
                updateBotStatus('error');
                addLog(data.message, 'error');
                startBtn.disabled = false;
                stopBtn.disabled = true;
                disconnectSSE();
                break;
            case 'stopped':
                updateBotStatus('stopped');
                addLog(data.message, 'warning');
                startBtn.disabled = false;
                stopBtn.disabled = true;
                disconnectSSE();
                break;
        }
    };

    eventSource.onerror = (error) => {
        console.error('SSE error:', error);
    };
}

// Disconnect SSE
function disconnectSSE() {
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
}

// Update bot status
function updateBotStatus(status) {
    botStatus.className = 'status-badge status-' + status;
    botStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
}

// Update progress
function updateProgress(processed, total) {
    const percentage = total > 0 ? (processed / total) * 100 : 0;
    progressText.textContent = `${processed} / ${total}`;
    progressFill.style.width = percentage + '%';
    progressFill.textContent = Math.round(percentage) + '%';
}

// Add log entry
function addLog(message, type = 'info') {
    const logEntry = document.createElement('p');
    logEntry.className = `log-entry log-${type}`;
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// Show upload status
function showUploadStatus(message, type) {
    uploadStatus.textContent = message;
    uploadStatus.className = `status-text ${type}`;
    
    setTimeout(() => {
        uploadStatus.textContent = '';
        uploadStatus.className = 'status-text';
    }, 5000);
}

// Show results
async function showResults() {
    try {
        const response = await fetch(`${API_URL}/status`);
        const data = await response.json();

        if (data.success) {
            const { state } = data;
            processedCount.textContent = state.processedDates.length;
            errorCount.textContent = state.errors.length;

            if (state.errors.length > 0) {
                errorList.innerHTML = '<h4>Errors:</h4>';
                state.errors.forEach(error => {
                    const errorItem = document.createElement('p');
                    errorItem.textContent = error;
                    errorList.appendChild(errorItem);
                });
            } else {
                errorList.innerHTML = '<p style="color: var(--success-color);">No errors! 🎉</p>';
            }

            resultsSection.style.display = 'block';
        }
    } catch (error) {
        console.error('Failed to fetch results:', error);
    }
}

// Initial status check
async function checkInitialStatus() {
    try {
        const response = await fetch(`${API_URL}/status`);
        const data = await response.json();

        if (data.success && data.isRunning) {
            updateBotStatus('running');
            startBtn.disabled = true;
            stopBtn.disabled = false;
            connectSSE();
        }
    } catch (error) {
        console.error('Failed to check initial status:', error);
    }
}

// Check status on load
checkInitialStatus();
