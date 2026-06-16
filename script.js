import { GoogleGenAI } from '@google/genai';

// Safely ensure DOM is loaded before attachment
document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', runAuditWorkflow);
    }

    // Set up dynamic visibility eye toggling tracking
    setupApiKeyVisibilityToggle();

    // Set up auto-saving as the user types
    setupInputAutoSave();

    // Inject the data clearing option
    injectClearButton();

    // Restore data on page load/refresh
    restoreSessionData();
});

// Keys used for local storage tracking
const STORAGE_KEYS = {
    API_KEY: 'wcag_audit_api_key',
    TARGET_URL: 'wcag_audit_target_url',
    HTML_CONTENT: 'wcag_audit_html_content',
    SAVED_REPORT: 'wcag_audit_saved_report'
};

function setupApiKeyVisibilityToggle() {
    const apiKeyInput = document.getElementById('apiKey');
    const toggleDiv = document.getElementById('toggleVisibility');
    
    if (!apiKeyInput || !toggleDiv) return;

    const eyeOpenSVG = `
        <svg id="eyeIcon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    `;

    const eyeClosedSVG = `
        <svg id="eyeIcon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
    `;

    toggleDiv.addEventListener('click', () => {
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            toggleDiv.innerHTML = eyeClosedSVG;
        } else {
            apiKeyInput.type = 'password';
            toggleDiv.innerHTML = eyeOpenSVG;
        }
    });
}

function setupInputAutoSave() {
    const inputs = ['apiKey', 'url', 'htmlInput'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', (e) => {
                const key = STORAGE_KEYS[id.toUpperCase().replace('INPUT', '_CONTENT').replace('URL', 'TARGET_URL')];
                localStorage.setItem(key, e.target.value.trim());
            });
        }
    });
}

function restoreSessionData() {
    const fields = [
        { id: 'apiKey', key: STORAGE_KEYS.API_KEY },
        { id: 'url', key: STORAGE_KEYS.TARGET_URL },
        { id: 'htmlInput', key: STORAGE_KEYS.HTML_CONTENT }
    ];

    fields.forEach(f => {
        const val = localStorage.getItem(f.key);
        if (val) document.getElementById(f.id).value = val;
    });
    
    const savedReport = localStorage.getItem(STORAGE_KEYS.SAVED_REPORT);
    if (savedReport) {
        try {
            const reportData = JSON.parse(savedReport);
            renderReport(reportData);
        } catch (e) {
            console.error("Failed to parse saved report from localStorage", e);
            localStorage.removeItem(STORAGE_KEYS.SAVED_REPORT);
        }
    }
}

function injectClearButton() {
    const inputPanel = document.querySelector('.input-panel');
    if (!inputPanel) return;

    const clearBtn = document.createElement('button');
    clearBtn.id = 'clearBtn';
    clearBtn.type = 'button';
    clearBtn.textContent = 'Clear Page Data';
    clearBtn.style.marginTop = '1rem';
    clearBtn.style.backgroundColor = '#64748b';
    
    clearBtn.addEventListener('click', handlePageReset);
    inputPanel.appendChild(clearBtn);
}

function handlePageReset() {
    if (!confirm('Are you sure you want to clear the setup fields and audit report? Your API Key will be kept.')) {
        return;
    }

    document.getElementById('url').value = '';
    document.getElementById('htmlInput').value = '';
    const screenshotInput = document.getElementById('screenshotInput');
    if (screenshotInput) screenshotInput.value = '';

    localStorage.removeItem(STORAGE_KEYS.TARGET_URL);
    localStorage.removeItem(STORAGE_KEYS.HTML_CONTENT);
    localStorage.removeItem(STORAGE_KEYS.SAVED_REPORT);

    clearPreviousReport();
}

async function runAuditWorkflow() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const targetUrl = document.getElementById('url').value.trim() || 'Provided Source';
    const htmlContent = document.getElementById('htmlInput').value.trim();
    const screenshotEl = document.getElementById('screenshotInput');
    const fileInput = screenshotEl?.files[0];

    if (!apiKey || !htmlContent) {
        alert('Please provide both your Gemini API Key and the HTML content to analyze.');
        return;
    }

    toggleLoading(true);
    clearPreviousReport();

    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const contents = [];

        const prompt = `
        You are an elite QA Automation Engineer and Web Accessibility Specialist (IAAP certified).
        Analyze the provided HTML source code (and optional screenshot image if provided) of the website target "${targetUrl}" against the WCAG 2.2 Success Criteria (Levels A and AA).
        
        Provide an objective, structured audit detailing a score, a summary, passed checks, and critical failures.
        
        HTML to analyze:
        ${htmlContent}
        `;
        
        contents.push(prompt);

        if (fileInput) {
            const base64Image = await fileToGenerativePart(fileInput);
            contents.push(base64Image);
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        score: { type: "INTEGER" },
                        summary: { type: "STRING" },
                        passed: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    criterion: { type: "STRING" },
                                    description: { type: "STRING" }
                                },
                                required: ["criterion", "description"]
                            }
                        },
                        failed: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    criterion: { type: "STRING" },
                                    element: { type: "STRING" },
                                    fix: { type: "STRING" }
                                },
                                required: ["criterion", "element", "fix"]
                            }
                        }
                    },
                    required: ["score", "summary", "passed", "failed"]
                }
            }
        });

        if (!response || !response.text) {
            throw new Error("Empty response received from Gemini API execution layer.");
        }

        const reportData = JSON.parse(response.text);
        localStorage.setItem(STORAGE_KEYS.SAVED_REPORT, response.text);
        renderReport(reportData);

    } catch (error) {
        console.error("Audit structural execution failed:", error);
        alert(`Error executing audit: ${error.message}\nCheck browser console log for detailed stack trace.`);
    } finally {
        toggleLoading(false);
    }
}

async function fileToGenerativePart(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                },
            });
        };
        reader.onerror = (err) => reject(new Error("Failed to parse image attachment: " + err));
        reader.readAsDataURL(file);
    });
}

function toggleLoading(isLoading) {
    const loadingEl = document.getElementById('loading');
    const btnEl = document.getElementById('analyzeBtn');
    const clearEl = document.getElementById('clearBtn');
    
    if (loadingEl) loadingEl.classList.toggle('hidden', !isLoading);
    if (btnEl) btnEl.disabled = isLoading;
    if (clearEl) clearEl.disabled = isLoading;
}

function clearPreviousReport() {
    const container = document.getElementById('reportContainer');
    if (container) {
        container.innerHTML = '';
        container.classList.add('hidden');
    }
}

function renderReport(data) {
    const container = document.getElementById('reportContainer');
    if (!container) return;
    
    container.classList.remove('hidden');
    
    const failuresHTML = data.failed.length > 0 
        ? data.failed.map(f => `
            <li class="failure-item">
                <strong>${escapeHtml(f.criterion)}</strong><br>
                <span>Element:</span> <code>${escapeHtml(f.element)}</code><br>
                <span>Fix:</span> ${escapeHtml(f.fix)}
            </li>`).join('')
        : '<li>No WCAG compliance failures identified.</li>';

    const passesHTML = data.passed.length > 0
        ? data.passed.map(p => `
            <li class="pass-item">
                <strong>${escapeHtml(p.criterion)}</strong>: ${escapeHtml(p.description)}
            </li>`).join('')
        : '<li>No evaluated metrics logged.</li>';

    container.innerHTML = `
        <h2 style="font-size: 2.5rem; font-weight: 800; color: var(--primary); margin-bottom: 0.5rem;">
            Audit Score: ${data.score}/100
        </h2>
        <p class="subtitle" style="text-align: left; margin-bottom: 1.5rem;">
            <strong>Summary:</strong> ${escapeHtml(data.summary)}
        </p>
        
        <h3>❌ Failures (${data.failed.length})</h3>
        <ul class="audit-list">
            ${failuresHTML}
        </ul>

        <h3 style="margin-top: 2rem;">✅ Passed Checks (${data.passed.length})</h3>
        <ul class="audit-list">
            ${passesHTML}
        </ul>
        <div> More details available in the <a class="footer-link" href="https://www.w3.org/TR/2024/REC-WCAG22-20241212/" target="_blank" rel="noopener"><strong>Web Content Accessibility Guidelines (WCAG) 2.2</strong></a> documentation.</div>
        <button id="printBtn" style="margin-top: 2rem; background-color: #475569;">Export Report (PDF)</button>
    `;

    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
