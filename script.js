
const staticFAQs = [
    {
        question: "How do I reset my password?",
        answer: "To reset your password, go to the login page and click on 'Forgot Password'. Follow the instructions sent to your email."
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, MasterCard, Amex), PayPal, and Apple Pay."
    },
    {
        question: "Can I cancel my subscription?",
        answer: "Yes, you can cancel your subscription at any time from your account settings. Your access will continue until the end of the billing period."
    },
    {
        question: "How do I contact support?",
        answer: "You can reach our support team via email at support@example.com or use the live chat feature on our website."
    },
    {
        question: "Is there a free trial available?",
        answer: "Yes, we offer a 14-day free trial for new users. No credit card is required to sign up."
    }
];



document.addEventListener('DOMContentLoaded', () => {
    const faqList = document.getElementById('faq-list');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const aiContainer = document.getElementById('ai-response-container');
    const aiContent = document.getElementById('ai-content');
    const aiLoading = document.querySelector('.ai-loading');

    // Helper: Slugify function for creating URL-friendly IDs
    function slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')        // Replace spaces with -
            .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
            .replace(/\-\-+/g, '-');     // Replace multiple - with single -
    }

    // Render Static FAQs
    function renderFAQs(faqs) {
        faqList.innerHTML = faqs.map((faq, index) => {
            const slug = slugify(faq.question);
            return `
            <div class="faq-item" id="${slug}">
                <div class="faq-question" onclick="toggleAccordion(this)">
                    ${faq.question}
                    <i class="fa-solid fa-chevron-down"></i>
                </div>
                <div class="faq-answer">
                    <p>${faq.answer}</p>
                </div>
            </div>
        `}).join('');
    }

    renderFAQs(staticFAQs);

    // Toggle Accordion
    window.toggleAccordion = (element) => {
        const item = element.parentElement;
        const isActive = item.classList.contains('active');
        const slug = item.id;

        // Close all other items
        document.querySelectorAll('.faq-item').forEach(i => {
            i.classList.remove('active');
        });

        // Toggle current item
        if (!isActive) {
            item.classList.add('active');
            // Update URL hash without scrolling
            history.replaceState(null, null, `#${slug}`);
        } else {
            // Remove hash if closing
            history.replaceState(null, null, ' ');
        }
    };

    // Search Functionality
    function handleSearch(updateUrl = true) {
        const query = searchInput.value.toLowerCase().trim();

        // Update URL query param
        if (updateUrl) {
            const url = new URL(window.location);
            if (query) {
                url.searchParams.set('q', query);
            } else {
                url.searchParams.delete('q');
            }
            history.pushState({}, '', url);
        }

        if (!query) {
            renderFAQs(staticFAQs);
            aiContainer.classList.add('hidden');
            return;
        }

        // Filter static FAQs
        const filtered = staticFAQs.filter(faq =>
            faq.question.toLowerCase().includes(query) ||
            faq.answer.toLowerCase().includes(query)
        );

        renderFAQs(filtered);

        // Always try AI for any non-empty query
        fetchAIAnswer(query);
    }

    async function fetchAIAnswer(query) {
        aiContainer.classList.remove('hidden');
        aiContent.innerHTML = '';
        aiLoading.classList.remove('hidden');

        try {
            // Call our own backend server
            const response = await fetch('/api/ask-ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query })
            });

            const data = await response.json();
            console.log('Backend Response:', data); // Debug log



            if (!response.ok) {
                throw new Error(data.error?.message || `API Error: ${response.statusText}`);
            }

            if (data.candidates && data.candidates[0].content) {
                const answer = data.candidates[0].content.parts[0].text;
                aiContent.innerHTML = answer;
            } else {
                console.warn('No candidates returned', data);
                let message = "I couldn't find an answer to that question.";
                if (data.promptFeedback) {
                    message += ` (Feedback: ${JSON.stringify(data.promptFeedback)})`;
                }
                aiContent.innerHTML = message;
            }
        } catch (error) {
            console.error('Error fetching AI response:', error);
            aiContent.innerHTML = `<div style="color: #ef4444;">Sorry, something went wrong: ${error.message}</div>`;
        } finally {
            aiLoading.classList.add('hidden');
        }
    }

    // Event Listeners
    searchBtn.addEventListener('click', () => handleSearch(true));
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch(true);
    });

    // Debounce search input for static filtering
    let timeout = null;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            // For live typing, we might NOT want to push state on every keystroke to avoid flooding history
            // But we can replace state or just wait for explicit action. 
            // Let's just update the view for now, and maybe replaceState to keep URL in sync without history flood
            const query = e.target.value.toLowerCase().trim();

            // Update URL silently (replaceState) so we don't break back button behavior with 100 entries
            const url = new URL(window.location);
            if (query) {
                url.searchParams.set('q', query);
            } else {
                url.searchParams.delete('q');
            }
            history.replaceState({}, '', url);

            if (!query) {
                renderFAQs(staticFAQs);
                aiContainer.classList.add('hidden');
            } else {
                const filtered = staticFAQs.filter(faq =>
                    faq.question.toLowerCase().includes(query) ||
                    faq.answer.toLowerCase().includes(query)
                );
                renderFAQs(filtered);
            }
        }, 300);
    });

    // --- Deep Linking Initialization ---

    // 1. Check for Search Query
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q');

    if (initialQuery) {
        searchInput.value = initialQuery;
        handleSearch(false); // Don't push state again, just execute
    }

    // 2. Check for Hash (FAQ Item)
    // We use a small timeout to allow rendering to complete if it wasn't synchronous (though it is here)
    // and to let the browser handle the initial scroll naturally, but we might need to force it if we re-rendered.
    if (window.location.hash) {
        const hash = window.location.hash.substring(1); // remove #
        const targetItem = document.getElementById(hash);
        if (targetItem) {
            targetItem.classList.add('active');
            setTimeout(() => {
                targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }
});
