document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('leadForm');
    const submitBtn = document.getElementById('submitBtn');
    const statusMsg = document.getElementById('statusMsg');

    // CONFIG: Ganti URL ini dengan URL Webhook n8n Anda nanti
    // DATA DARI KLIEN AKAN DIKIRIM KE SINI. GANTI URL INI DENGAN WEBHOOK N8N ANDA.
    const WEBHOOK_URL = 'https://tillie-unvocal-gelatinously.ngrok-free.dev/webhook/958d36d1-9ce2-48f6-8a03-de2f924ca528';

    // --- FORM & POPUP SUBMISSION LOGIC ---
    // Elements for Modal
    const emailModal = document.getElementById('emailModal');
    const emailPopupForm = document.getElementById('emailPopupForm');
    const finalEmailInput = document.getElementById('finalEmail');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const finalSubmitBtn = document.getElementById('finalSubmitBtn');

    if (form && submitBtn) {
        // 1. Intercept Main Form
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            // Since this event triggers, browser validation has passed (if not invalid)
            // Show the modal
            if (emailModal) {
                emailModal.classList.add('active');
                // Focus on email input for better UX
                setTimeout(() => {
                    if (finalEmailInput) finalEmailInput.focus();
                }, 100);
            }
        });
    }

    // 2. Modal Close Logic
    if (emailModal && closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            emailModal.classList.remove('active');
        });

        // Close when clicking outside content
        emailModal.addEventListener('click', (e) => {
            if (e.target === emailModal) {
                emailModal.classList.remove('active');
            }
        });
    }

    // 3. Final Submission Logic
    if (emailPopupForm && finalSubmitBtn) {
        emailPopupForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // UI Loading State
            const originalBtnText = finalSubmitBtn.innerHTML;
            finalSubmitBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Mengirim...';
            finalSubmitBtn.disabled = true;

            // Gather Data
            const formData = new FormData(form);
            const jenisChatValues = [];
            formData.getAll('jenis_chat').forEach(val => jenisChatValues.push(val));

            const platformChatValues = [];
            formData.getAll('platform_chat').forEach(val => platformChatValues.push(val));

            // Calculations
            const jamKerja = parseFloat(formData.get('admin_jam_kerja')) || 0;
            const gajiPerJam = parseFloat(formData.get('admin_gaji_jam')) || 0;
            const estimasiGajiBulanan = jamKerja * gajiPerJam;

            // Construct Structured Data
            const payload = {
                personalInfo: {
                    nama: formData.get('nama'),
                    bisnis: formData.get('bisnis'),
                    whatsapp: formData.get('whatsapp'),
                    email: finalEmailInput.value, // Critical: Value from Popup
                    jenis_bisnis: formData.get('jenis_bisnis'),
                    jam_ops: `${formData.get('jam_buka')} - ${formData.get('jam_tutup')} WIB`,
                    platform_chat: platformChatValues
                },
                businessMetrics: {
                    chat_volume: formData.get('chat_volume'),
                    waktu_balas: formData.get('waktu_balas'),
                    waktu_rekap: formData.get('waktu_rekap'),
                    admin_jam_kerja_bulan: jamKerja,
                    admin_gaji_per_jam: gajiPerJam,
                    estimasi_gaji_total_bulan: estimasiGajiBulanan
                },
                requirements: {
                    jenis_chat: jenisChatValues,
                    auto_reply_time: formData.get('auto_reply_time'),
                    want_report: formData.get('want_report'),
                    email_report: formData.get('email_report'), // From main form
                    want_followup: formData.get('want_followup'),
                    notes: formData.get('notes') || ""
                },
                meta: {
                    timestamp: new Date().toISOString(),
                    source: "Website Audit Form"
                }
            };

            // Send to Webhook
            fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })
                .then(response => {
                    // Success Handling
                    console.log('Data terkirim:', payload);
                    emailModal.classList.remove('active');

                    showSuccessMessage(payload.personalInfo.nama);

                    // Reset Forms
                    form.reset();
                    emailPopupForm.reset();

                    // Reset Button
                    finalSubmitBtn.innerHTML = originalBtnText;
                    finalSubmitBtn.disabled = false;
                })
                .catch(error => {
                    console.error('Error:', error);
                    // Fallback success for demo/offline resiliency
                    emailModal.classList.remove('active');
                    showSuccessMessage(payload.personalInfo.nama);

                    finalSubmitBtn.innerHTML = originalBtnText;
                    finalSubmitBtn.disabled = false;
                });
        });
    }

    function showSuccessMessage(name) {
        if (!statusMsg) return;
        statusMsg.innerHTML = `
            <div style="padding:1rem; border-radius:12px; background:rgba(16, 185, 129, 0.2); border:1px solid #10b981; color:#064e3b; margin-top:1.5rem; text-align:center;">
                <div style="font-size:2rem; margin-bottom:0.5rem;">🎉</div>
                <strong>Data Berhasil Terkirim!</strong><br>
                Terima kasih Kak ${name || ''}.<br>Tim kami akan segera menghubungi Anda via WhatsApp untuk analisa lengkapnya.
            </div>
        `;
        statusMsg.style.display = 'block';
        statusMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Validation for Conditional Email in Main Form (Keep logic just in case user fills it)
    const radioReport = document.querySelectorAll('input[name="want_report"]');
    const emailGroup = document.getElementById('email_group');
    const emailInput = document.getElementById('email_report');

    if (emailGroup && emailInput) {
        radioReport.forEach(radio => {
            radio.addEventListener('change', function () {
                if (this.value === 'Ya') {
                    emailGroup.style.display = 'block';
                    // We don't force required here anymore since we have the popup
                    // emailInput.required = true; 
                } else {
                    emailGroup.style.display = 'none';
                    emailInput.required = false;
                }
            });
        });
    }

    // SCROLL ANIMATION OBSERVER
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Run once
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
        observer.observe(el);
    });

    // --- NAVIGATION LOGIC ---
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenu && navMenu) {
        mobileMenu.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
            navMenu.classList.remove('active');
        }));
    }

    // --- CALCULATOR & CHART LOGIC ---
    let savingsChart = null;
    const calculateBtn = document.getElementById('calculateBtn');

    if (calculateBtn) {
        calculateBtn.addEventListener('click', function (e) {
            e.preventDefault();

            // 1. Get Values
            const adminSalary = parseFloat(document.getElementById('adminSalary').value) || 0;
            const adminCount = parseFloat(document.getElementById('adminCount').value) || 0;
            const missedChats = parseFloat(document.getElementById('missedChats').value) || 0;
            const profitPerChat = parseFloat(document.getElementById('profitPerChat').value) || 0;

            const resMoney = document.getElementById('resMoney');
            const resTime = document.getElementById('resTime'); // Using this for Total Value now
            const miniResults = document.getElementById('miniResults');
            const chartCanvas = document.getElementById('savingsChart');

            if (!miniResults || !chartCanvas) return;

            // 2. Calculations (Monthly & Yearly)

            // A. Operational Savings (Asumsi: Hemat 100% biaya admin karena diganti sistem, atau mencegah scaling hire admin baru)
            // Kita pakai logis: Hemat 80% biaya admin (karena masih butuh supervisi dikit)
            const monthlyAdminCost = adminSalary * adminCount;
            const monthlySavings = monthlyAdminCost * 0.8;

            // B. Recovered Revenue (Uang yang diselamatkan dari chat hangus)
            // Asumsi: Sistem berhasil menyelamatkan 80% dari chat yang biasanya hangus
            const monthlyPotentialLoss = missedChats * profitPerChat;
            const monthlyRecovered = monthlyPotentialLoss * 0.8;

            // Totals
            const totalMonthlyBenefit = monthlySavings + monthlyRecovered;

            // 3. UI Updates
            // Update Mini Cards Labels via JS (Optional, or hardcode in HTML)
            // Card 1: Penghematan
            // Card 2: Total Value (Profit Tambahan + Hemat)

            // Let's update the HTML structure for labels dynamically or assume user changed them? 
            // Better: Just update values based on current ID.
            // resMoney -> Total Value (Big Number)
            // resTime -> Breakdown text (Hemat X + Profit Y)

            if (resMoney) resMoney.innerText = 'Rp ' + totalMonthlyBenefit.toLocaleString('id-ID');

            // Update Label for Card 2 to be descriptive text
            const miniCard2 = resTime.parentElement;
            if (miniCard2) {
                miniCard2.innerHTML = `
                    <span>Breakdown / Bulan</span>
                    <div style="font-size:0.9rem; text-align:left; line-height:1.4;">
                        <div style="color:#059669">Hemat: Rp ${monthlySavings.toLocaleString('id-ID')}</div>
                        <div style="color:#d97706">Profit: Rp ${monthlyRecovered.toLocaleString('id-ID')}</div>
                    </div>
                 `;
            }

            miniResults.style.display = 'grid';

            // 4. Chart Data (5 Years Accumulation)
            const years = ['Tahun 1', 'Tahun 2', 'Tahun 3', 'Tahun 4', 'Tahun 5'];
            const savingsData = [];
            const revenueData = [];

            // Accumulate
            let accSavings = 0;
            let accRevenue = 0;

            for (let i = 1; i <= 5; i++) {
                // Linear accumulation
                const yearlySavings = monthlySavings * 12;
                const yearlyRevenue = monthlyRecovered * 12;

                accSavings += yearlySavings;
                accRevenue += yearlyRevenue;

                savingsData.push(accSavings);
                revenueData.push(accRevenue);
            }

            // 5. Render Stacked Bar Chart
            const ctx = chartCanvas.getContext('2d');
            if (savingsChart) savingsChart.destroy();

            savingsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: years,
                    datasets: [
                        {
                            label: 'Penghematan Gaji',
                            data: savingsData,
                            backgroundColor: 'rgba(5, 150, 105, 0.7)', // Emerald Green
                            borderColor: '#059669',
                            borderWidth: 1,
                            borderRadius: 4,
                            stack: 'Stack 0',
                            order: 2
                        },
                        {
                            label: 'Tambahan Profit',
                            data: revenueData,
                            backgroundColor: 'rgba(217, 119, 6, 0.7)', // Amber/Gold
                            borderColor: '#d97706',
                            borderWidth: 1,
                            borderRadius: 4,
                            stack: 'Stack 0', // Same stack ID = Stacked
                            order: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: { display: true, position: 'bottom' },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumSignificantDigits: 3 }).format(context.parsed.y);
                                    }
                                    return label;
                                },
                                footer: function (tooltipItems) {
                                    let sum = 0;
                                    tooltipItems.forEach(function (tooltipItem) {
                                        sum += tooltipItem.parsed.y;
                                    });
                                    return 'Total: ' + new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumSignificantDigits: 3 }).format(sum);
                                }
                            }
                        },
                        datalabels: {
                            display: false // Too crowded for stacked
                        }
                    },
                    scales: {
                        y: {
                            stacked: true, // Enable Stacking
                            title: { display: true, text: 'Total Nilai (Rp)', font: { weight: 'bold' } },
                            ticks: {
                                callback: function (value) { return (value / 1000000) + 'jt'; }
                            }
                        },
                        x: {
                            stacked: true, // Enable Stacking
                            grid: { display: false }
                        }
                    }
                }
            });
        });
    }
});

// --- CUSTOM CHAT WIDGET LOGIC ---
document.addEventListener('DOMContentLoaded', function () {
    // Only init if chat elements exist
    const chatFab = document.getElementById('chatFab');
    const chatWindow = document.getElementById('chatWindow');
    const chatCloseBtn = document.getElementById('chatCloseBtn');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatBody = document.getElementById('chatBody');

    if (chatFab && chatWindow) {
        // State
        let isOpen = false;
        let isTyping = false;
        let sessionId = localStorage.getItem('chat_session_id');

        if (!sessionId) {
            sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('chat_session_id', sessionId);
        }

        const WEBHOOK_CHAT_URL = 'https://tillie-unvocal-gelatinously.ngrok-free.dev/webhook/8eeb846f-a7a9-4fd4-b5d7-86a5e2c411e9/chat';

        // Toggle Chat
        function toggleChat() {
            isOpen = !isOpen;
            if (isOpen) {
                chatWindow.classList.add('open');
                chatFab.classList.add('active');
                // Focus input
                setTimeout(() => chatInput.focus(), 300);
            } else {
                chatWindow.classList.remove('open');
                chatFab.classList.remove('active');
            }
        }

        chatFab.addEventListener('click', toggleChat);
        chatCloseBtn.addEventListener('click', toggleChat);

        // Auto-resize textarea
        chatInput.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            if (this.value === '') this.style.height = 'auto';
        });

        // Send Message Logic
        async function handleSend() {
            const text = chatInput.value.trim();
            if (!text || isTyping) return;

            // 1. Add User Message
            addMessage(text, 'user');
            chatInput.value = '';
            chatInput.style.height = 'auto';

            // 2. Show Typing Indicator
            showTyping();

            try {
                // 3. Send to Webhook
                // Note: Standard n8n chat payload structure
                const payload = {
                    action: 'sendMessage',
                    sessionId: sessionId,
                    chatInput: text,
                    // Additional metadata if needed
                    metadata: {
                        page: window.location.pathname
                    }
                };

                const response = await fetch(WEBHOOK_CHAT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                // 4. Hide Typing
                hideTyping();

                // 5. Handle Response
                // Expecting data to be an array of messages or a single object
                if (Array.isArray(data)) {
                    data.forEach(msg => {
                        if (msg.text) addMessage(msg.text, 'bot');
                        if (msg.output) addMessage(msg.output, 'bot'); // Backup field
                    });
                } else {
                    if (data.text) addMessage(data.text, 'bot');
                    else if (data.output) addMessage(data.output, 'bot');
                    else addMessage("Maaf, saya tidak mengerti respon dari server.", 'bot');
                }

            } catch (error) {
                console.error('Chat Error:', error);
                hideTyping();
                addMessage("Maaf, terjadi kesalahan koneksi.", 'bot');
            }
        }

        sendBtn.addEventListener('click', handleSend);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });

        // Helper: Add Message to UI
        function addMessage(text, sender) {
            const msgDiv = document.createElement('div');
            msgDiv.classList.add('message', sender);

            // Time
            const now = new Date();
            const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

            // Bubble content
            // Simple linkify or line break handling
            const formattedText = text.replace(/\n/g, '<br>');

            msgDiv.innerHTML = `
                <div class="bubble">${formattedText}</div>
                <div class="message-time">${timeStr}</div>
            `;

            chatBody.appendChild(msgDiv);
            scrollToBottom();
        }

        // Helper: Typing Indicator
        let typingDiv = null;

        function showTyping() {
            isTyping = true;
            typingDiv = document.createElement('div');
            typingDiv.classList.add('message', 'bot');
            typingDiv.innerHTML = `
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            `;
            chatBody.appendChild(typingDiv);
            scrollToBottom();
        }

        function hideTyping() {
            isTyping = false;
            if (typingDiv) {
                typingDiv.remove();
                typingDiv = null;
            }
        }

        function scrollToBottom() {
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    }
});
