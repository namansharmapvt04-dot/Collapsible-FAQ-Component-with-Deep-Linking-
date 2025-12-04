// --- Configuration ---
// WARNING: Do not share this file publicly with the key inside.
const apiKey = "AIzaSyCoNjld8kFMgGc568ZvuRL3rJrybaHGpgk"; 

// --- Data ---
const FAQ_DATA = [
    {
        category: "General",
        questions: [
            {
                id: 1,
                q: "What is Gemini FAQ Assistant?",
                a: "Gemini FAQ Assistant is a smart knowledge base powered by Google's Gemini AI. It combines curated static answers with the ability to generate dynamic responses for unique user queries."
            },
            {
                id: 2,
                q: "Is this service free to use?",
                a: "Yes! The core FAQ browsing features are completely free. Advanced AI queries may be subject to usage limits depending on your subscription plan."
            }
        ]
    },
    {
        category: "Billing",
        questions: [
            {
                id: 3,
                q: "How do I update my payment method?",
                a: "Go to Settings > Billing > Payment Methods. You can add a new credit card or link a PayPal account there."
            },
            {
                id: 4,
                q: "Where can I find my invoices?",
                a: "Invoices are emailed to you monthly. You can also download them from the 'History' tab in the Billing section."
            }
        ]
    },
    {
        category: "Account & Security",
        questions: [
            {
                id: 5,
                q: "How do I reset my password?",
                a: "Click 'Forgot Password' on the login screen. We will send a secure link to your registered email address to create a new password."
            },
            {
                id: 6,
                q: "Is 2FA supported?",
                a: "Absolutely. We strongly recommend enabling Two-Factor Authentication (2FA) in your Security settings for added protection."
            }
        ]
    }
];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    renderFAQ();
    setupMobileMenu();
    setupAIResponder();
    // This is a global function used in the HTML onclick attribute
    window.toggleAccordion = toggleAccordion; 
    lucide.createIcons();
});

// --- FAQ Logic ---
function renderFAQ() {
    const container = document.getElementById('faq-container');
    const countSpan = document.getElementById('result-count');
    
    // Flatten questions
    const allQuestions = FAQ_DATA.flatMap(cat => cat.questions);
    
    countSpan.textContent = `${allQuestions.length} result${allQuestions.length !== 1 ? 's' : ''}`;

    if (allQuestions.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                <div class="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <i data-lucide="search" class="w-8 h-8 text-slate-400"></i>
                </div>
                <h3 class="text-lg font-medium text-slate-900">No articles found</h3>
            </div>
        `;
        return;
    }

    container.innerHTML = allQuestions.map(item => `
        <div class="border border-slate-200 rounded-xl mb-3 overflow-hidden bg-white hover:border-blue-200 transition-all duration-200 shadow-sm hover:shadow-md">
            <button
                onclick="toggleAccordion(${item.id})"
                class="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
            >
                <span class="font-semibold text-slate-800 pr-4">${item.q}</span>
                <i id="chevron-${item.id}" data-lucide="chevron-down" class="chevron w-5 h-5 text-slate-400 flex-shrink-0"></i>
            </button>
            <div id="content-${item.id}" class="accordion-content px-6">
                <p class="text-slate-600 leading-relaxed">${item.a}</p>
            </div>
        </div>
    `).join('');
}

function toggleAccordion(id) {
    const content = document.getElementById(`content-${id}`);
    const chevron = document.getElementById(`chevron-${id}`);
    const isCurrentlyOpen = content.classList.contains('open');

    // Close all others
    document.querySelectorAll('.accordion-content').forEach(el => {
        el.classList.remove('open');
    });
    document.querySelectorAll('.chevron').forEach(el => {
        el.classList.remove('rotate');
        el.classList.remove('text-blue-500');
        el.classList.add('text-slate-400');
    });

    if (!isCurrentlyOpen) {
        content.classList.add('open');
        chevron.classList.add('rotate');
        chevron.classList.remove('text-slate-400');
        chevron.classList.add('text-blue-500');
    }
}

// --- Mobile Menu Logic ---
function setupMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    // const icon = document.getElementById('menu-icon'); // icon isn't used for icon swap in this version
    let isOpen = false;

    btn.addEventListener('click', () => {
        isOpen = !isOpen;
        if (isOpen) {
            menu.classList.remove('hidden');
        } else {
            menu.classList.add('hidden');
        }
    });
}

// --- AI Responder Logic ---
function setupAIResponder() {
    const form = document.getElementById('ai-form');
    const input = document.getElementById('ai-input');
    const submitBtn = document.getElementById('ai-submit-btn');
    const btnIcon = document.getElementById('ai-btn-icon');
    const spinner = document.getElementById('ai-loading-spinner');
    const responseContainer = document.getElementById('ai-response-container');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = input.value.trim();
        if (!query) return;

        // Set Loading State
        input.disabled = true;
        submitBtn.disabled = true;
        btnIcon.classList.add('hidden');
        spinner.classList.remove('hidden');
        responseContainer.classList.add('hidden');
        responseContainer.innerHTML = '';

        try {
            const aiText = await fetchWithRetry(query);
            
            // Show Success
            responseContainer.innerHTML = `
                <div class="flex items-start gap-4">
                    <div class="bg-white/20 p-2 rounded-lg flex-shrink-0">
                        <i data-lucide="sparkles" class="w-6 h-6 text-yellow-300"></i>
                    </div>
                    <div class="space-y-2">
                        <h4 class="font-semibold text-white text-lg">AI Response</h4>
                        <p class="text-blue-50 leading-relaxed whitespace-pre-wrap">${escapeHtml(aiText)}</p>
                    </div>
                </div>
            `;
        } catch (error) {
            // Show Error
            responseContainer.innerHTML = `
                <div class="flex items-start gap-3 text-red-200">
                     <i data-lucide="help-circle" class="w-6 h-6 flex-shrink-0 mt-0.5"></i>
                     <p>I'm having trouble connecting right now. Please try again later.</p>
                </div>
            `;
            console.error(error);
        } finally {
            // Reset State
            input.disabled = false;
            submitBtn.disabled = false;
            btnIcon.classList.remove('hidden');
            spinner.classList.add('hidden');
            responseContainer.classList.remove('hidden');
            lucide.createIcons(); // Re-render icons in the response area
        }
    });
}

async function fetchWithRetry(query, retries = 3, delay = 1000) {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are a helpful, friendly customer support agent for a service called 'HelpCenter'. 
                            Answer the following user question concisely and professionally. 
                            If the question is about general knowledge, answer it. 
                            If it seems like a technical support issue not covered by general knowledge, suggest contacting human support.
                            
                            User Question: ${query}`
                        }]
                    }]
                })
            }
        );

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("No response generated.");
        return text;

    } catch (err) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(query, retries - 1, delay * 2);
        }
        throw err;
    }
}

// Utility to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}