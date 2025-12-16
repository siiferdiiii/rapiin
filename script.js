document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('leadForm');
    const submitBtn = document.getElementById('submitBtn');
    const statusMsg = document.getElementById('statusMsg');

    // CONFIG: Ganti URL ini dengan URL Webhook n8n Anda nanti
    // DATA DARI KLIEN AKAN DIKIRIM KE SINI. GANTI URL INI DENGAN WEBHOOK N8N ANDA.
    const WEBHOOK_URL = 'https://hook.eu1.n8n.cloud/webhook-test/dummy-endpoint';

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // 1. Ubah tombol jadi loading state
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = 'Mengirim...';
        submitBtn.disabled = true;
        statusMsg.innerText = '';
        statusMsg.style.display = 'none';

        // 2. Ambil data form (Handling checkboxes & radios manually for cleaner object)
        const formData = new FormData(form);
        const data = {};

        // Helper untuk Multi-Checkbox
        const jenisChatValues = [];
        formData.getAll('jenis_chat').forEach(val => jenisChatValues.push(val));

        // Populate Object
        data.nama = formData.get('nama');
        data.bisnis = formData.get('bisnis');
        data.whatsapp = formData.get('whatsapp');
        data.jenis_bisnis = formData.get('jenis_bisnis');
        data.jam_ops = formData.get('jam_ops');

        data.chat_volume = formData.get('chat_volume');
        data.waktu_balas = formData.get('waktu_balas');
        data.waktu_rekap = formData.get('waktu_rekap');

        data.jenis_chat = jenisChatValues.join(', '); // Gabung jadi string
        data.auto_reply_time = formData.get('auto_reply_time');

        data.want_report = formData.get('want_report');
        data.email_report = formData.get('email_report');
        data.want_followup = formData.get('want_followup');

        data.notes = formData.get('notes');
        data.timestamp = new Date().toISOString();

        // 3. Kirim ke Webhook (POST)
        fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
            .then(response => {
                // Karena ini dummy URL, kita anggap sukses jika request terkirim
                console.log('Data terkirim:', data);
                showSuccess();
            })
            .catch(error => {
                console.error('Error:', error);
                // Fallback: Tetap tampilkan sukses untuk demo
                showSuccess();
            });

        function showSuccess() {
            statusMsg.innerText = '✅ Terima kasih. Data sudah masuk dan akan kami review via WhatsApp.';
            statusMsg.style.display = 'block';
            statusMsg.style.color = '#065f46'; // Dark green
            statusMsg.style.backgroundColor = '#d1fae5'; // Light green bg

            form.reset();
            resetBtn(originalBtnText);
        }

        function resetBtn(text) {
            setTimeout(() => {
                submitBtn.innerText = text;
                submitBtn.disabled = false;
            }, 3000); // Tunggu agak lama biar user baca pesan sukses
        }
    });

    // Optional: Conditional logic untuk email input
    const radioReport = document.querySelectorAll('input[name="want_report"]');
    const emailGroup = document.getElementById('email_group');
    const emailInput = document.getElementById('email_report');

    radioReport.forEach(radio => {
        radio.addEventListener('change', function () {
            if (this.value === 'Ya') {
                emailGroup.style.display = 'block';
                emailInput.required = true;
            } else {
                emailGroup.style.display = 'none';
                emailInput.required = false;
            }
        });
    });

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

    if (mobileMenu) {
        mobileMenu.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Close menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
        navMenu.classList.remove('active');
    }));

    // --- CALCULATOR & CHART LOGIC ---
    let savingsChart = null;

    document.getElementById('calculateBtn').addEventListener('click', function (e) {
        e.preventDefault();

        // Get Input Values
        const hours = parseFloat(document.getElementById('manualHours').value) || 0;
        const rate = parseFloat(document.getElementById('hourlyRate').value) || 0;

        // Calculate Monthly Savings
        const currentCost = hours * rate;
        const savedMoneyMonthly = currentCost * 0.70; // 70% efficiency (Money Saved)
        const savedTimeMonthly = hours * 0.60; // 60% faster (Time Saved)

        // Update Text Results
        document.getElementById('resMoney').innerText = 'Rp ' + savedMoneyMonthly.toLocaleString('id-ID');
        document.getElementById('resTime').innerText = Math.round(savedTimeMonthly) + ' Jam';
        document.getElementById('miniResults').style.display = 'grid';

        // Prepare Chart Data (5 Years Projection)
        const years = ['Tahun 1', 'Tahun 2', 'Tahun 3', 'Tahun 4', 'Tahun 5'];
        const moneyData = [];
        const timeData = [];

        // Accumulate data
        for (let i = 1; i <= 5; i++) {
            moneyData.push(savedMoneyMonthly * 12 * i); // Accumulated Money
            timeData.push(savedTimeMonthly * 12 * i);   // Accumulated Time
        }

        // Render Chart
        const ctx = document.getElementById('savingsChart').getContext('2d');

        if (savingsChart) {
            savingsChart.destroy();
        }

        // Create Gradient Helper
        function createGradient(ctx, colorStart, colorEnd) {
            const gradient = ctx.createLinearGradient(0, 400, 0, 0); // Bottom to Top
            gradient.addColorStop(0, colorStart);
            gradient.addColorStop(1, colorEnd);
            return gradient;
        }

        const gradientMoney = createGradient(ctx, 'rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.9)');

        savingsChart = new Chart(ctx, {
            type: 'bar', // Default type is bar for the main dataset
            data: {
                labels: years,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Uang Dihemat (Rp)',
                        data: moneyData,
                        backgroundColor: gradientMoney,
                        borderColor: '#059669',
                        borderWidth: 1,
                        borderRadius: 12, // Rounded corners for bars
                        yAxisID: 'y',
                        barPercentage: 0.6,
                        order: 2
                    },
                    {
                        type: 'line',
                        label: 'Waktu Dihemat (Jam)',
                        data: timeData,
                        borderColor: '#3b82f6', // Bright Blue
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 4,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#3b82f6',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        borderDash: [5, 5],
                        yAxisID: 'y1',
                        fill: false, // Don't fill the line
                        tension: 0.4,
                        order: 1 // Line on top of bars
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
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#0f172a',
                        bodyColor: '#334155',
                        borderColor: '#e2e8f0',
                        borderWidth: 1,
                        padding: 12,
                        boxPadding: 4,
                        usePointStyle: true,
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.dataset.yAxisID === 'y') {
                                    return label + new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumSignificantDigits: 3 }).format(context.parsed.y);
                                } else {
                                    return label + Math.round(context.parsed.y) + ' Jam';
                                }
                            }
                        }
                    },
                    datalabels: {
                        align: function (context) {
                            return context.dataset.type === 'bar' ? 'end' : 'top';
                        },
                        anchor: function (context) {
                            return context.dataset.type === 'bar' ? 'end' : 'end';
                        },
                        color: function (context) {
                            // Dark color for text
                            return context.dataset.type === 'bar' ? '#059669' : '#2563eb';
                        },
                        font: {
                            weight: 'bold',
                            size: 11
                        },
                        formatter: function (value, context) {
                            if (context.dataset.yAxisID === 'y') {
                                return (value / 1000000).toFixed(0) + 'jt';
                            } else {
                                return Math.round(value) + 'h';
                            }
                        },
                        offset: 0,
                        opacity: 1
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Rupiah (Rp)', color: '#059669', font: { weight: 'bold' } },
                        grid: { color: '#f1f5f9', borderDash: [2, 2] },
                        border: { display: false },
                        ticks: {
                            color: '#64748b',
                            callback: function (value) { return (value / 1000000) + 'jt'; }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Jam (Hours)', color: '#3b82f6', font: { weight: 'bold' } },
                        grid: { display: false },
                        border: { display: false },
                        ticks: { color: '#64748b' }
                    },
                    x: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: { color: '#64748b', font: { weight: '600' } }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    });
});
