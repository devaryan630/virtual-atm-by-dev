 // 1. Setup Theme & Data
        if (!localStorage.getItem('atm_balance')) localStorage.setItem('atm_balance', '25000');
        if (!localStorage.getItem('atm_txs')) localStorage.setItem('atm_txs', JSON.stringify([]));
        // 👇 due to this it always accept any 4 pin   👇
        localStorage.removeItem('atm_pin');


        const themeBtn = document.getElementById('theme-toggle');
        if (localStorage.getItem('atm_theme') === 'light') {
            document.body.classList.add('light-mode');
            themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i> Dark Mode';
        }
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            if (document.body.classList.contains('light-mode')) {
                localStorage.setItem('atm_theme', 'light');
                themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i> Dark Mode';
            } else {
                localStorage.setItem('atm_theme', 'dark');
                themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i> Light Mode';
            }
        });

        // 2. Navigation Logic
        function nav(screenId) {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById(screenId).classList.add('active');

        }
        

        // 3. Insert Card Logic
        document.getElementById('btn-insert-card').addEventListener('click', () => {
            document.getElementById('atm-card').classList.add('inserted');
            setTimeout(() => { nav('pin-screen'); document.getElementById('pin-input').value = ''; }, 1300);
        });

        // 4. PIN Keypad Logic
        const pinInput = document.getElementById('pin-input');
        document.querySelectorAll('.key').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = e.target.innerText;
                if (val === 'CLR') pinInput.value = '';
                else if (val === 'ENT') validatePin();
                else if (pinInput.value.length < 4) pinInput.value += val;
            });
        });

        function validatePin() {
            const entered = pinInput.value;
            if (entered.length !== 4) return alert('Enter exactly 4 digits.');
            const stored = localStorage.getItem('atm_pin');
            if (!stored) {
                localStorage.setItem('atm_pin', entered);
                alert('New PIN set! Proceeding to Dashboard.');
                nav('dashboard-screen');
            } else {
                if (entered === stored) nav('dashboard-screen');
                else { alert('Incorrect PIN.'); pinInput.value = ''; }
            }
        }

        // 5. Financial Logic
        function logTx(type, amount) {
            let txs = JSON.parse(localStorage.getItem('atm_txs'));
            const date = new Date().toLocaleString('en-IN');
            txs.unshift({ date, type, amount });
            if (txs.length > 6) txs.pop();
            localStorage.setItem('atm_txs', JSON.stringify(txs));
        }

        function showModal(type, amount) {
            document.getElementById('receipt-text').innerHTML = `Action: ${type}<br>Amount: ₹${amount}<br>Date: ${new Date().toLocaleDateString()}`;
            document.getElementById('receipt-modal').classList.add('active');
        }
        function closeModal() { document.getElementById('receipt-modal').classList.remove('active'); nav('dashboard-screen'); }

        function processWithdraw() {
            const amt = parseInt(document.getElementById('withdraw-input').value);
            let bal = parseInt(localStorage.getItem('atm_balance'));
            if (!amt || amt <= 0 || amt % 500 !== 0) return alert('Enter a valid multiple of ₹500.');
            if (amt > bal) return alert('Insufficient Funds.');
            bal -= amt; localStorage.setItem('atm_balance', bal); logTx('Withdrawal', amt);
            document.getElementById('withdraw-input').value = ''; showModal('Withdrawal', amt);
        }

        function processDeposit() {
            const amt = parseInt(document.getElementById('deposit-input').value);
            let bal = parseInt(localStorage.getItem('atm_balance'));
            if (!amt || amt <= 0) return alert('Enter a valid amount.');
            bal += amt; localStorage.setItem('atm_balance', bal); logTx('Deposit', amt);
            document.getElementById('deposit-input').value = ''; showModal('Deposit', amt);
        }

        function processTransfer() {
            const acc = document.getElementById('transfer-acc').value;
            const amt = parseInt(document.getElementById('transfer-amt').value);
            let bal = parseInt(localStorage.getItem('atm_balance'));
            if (acc.length !== 10) return alert('Enter exactly 10 digits for Account No.');
            if (!amt || amt <= 0 || amt > bal) return alert('Invalid amount or insufficient funds.');
            bal -= amt; localStorage.setItem('atm_balance', bal); logTx(`Transfer`, amt);
            document.getElementById('transfer-acc').value = ''; document.getElementById('transfer-amt').value = ''; showModal('Transfer', amt);
        }

        function showBalance() {
            document.getElementById('balance-display').innerText = '₹**,***';
            nav('balance-screen');
        }
        function toggleBalanceVisibility() {
            const el = document.getElementById('balance-display');
            if (el.innerText === '₹**,***') el.innerText = `₹${parseFloat(localStorage.getItem('atm_balance')).toLocaleString('en-IN')}`;
            else el.innerText = '₹**,***';
        }

        function showStatement() {
            const tbody = document.getElementById('statement-body');
            const txs = JSON.parse(localStorage.getItem('atm_txs'));
            tbody.innerHTML = '';
            if (txs.length === 0) tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No recent transactions</td></tr>';
            else txs.forEach(t => tbody.innerHTML += `<tr><td>${t.date.split(',')[0]}</td><td>${t.type}</td><td>₹${t.amount}</td></tr>`);
            nav('statement-screen');
        }

        function processPinChange() {
            const oldP = document.getElementById('pin-old').value, newP = document.getElementById('pin-new').value, confP = document.getElementById('pin-conf').value;
            if (oldP !== localStorage.getItem('atm_pin')) return alert('Current PIN incorrect.');
            if (newP.length !== 4 || confP.length !== 4) return alert('New PIN must be 4 digits.');
            if (newP !== confP) return alert('New PINs do not match.');
            localStorage.setItem('atm_pin', newP); alert('PIN Updated! Please login again.');
            document.getElementById('pin-old').value = ''; document.getElementById('pin-new').value = ''; document.getElementById('pin-conf').value = '';
            exitATM();
        }

        function exitATM() {
            document.getElementById('atm-card').classList.remove('inserted');
            nav('welcome-screen');
        }

        // Download Receipt File Generation
        document.getElementById('btn-dl-receipt').addEventListener('click', () => {
            const txs = JSON.parse(localStorage.getItem('atm_txs'));
            if (txs.length === 0) return alert('No transactions to download.');
            const text = `=== PREMIUM VIRTUAL ATM ===\nDEV ARYAN\n\nDATE: ${txs[0].date}\nACTION: ${txs[0].type}\nAMOUNT: ₹${txs[0].amount}\n===========================`;
            const blob = new Blob([text], { type: 'text/plain' });
            const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `Receipt_${Date.now()}.txt`;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
        });

        document.addEventListener('DOMContentLoaded', () => {
            if (!localStorage.getItem('atm_balance')) localStorage.setItem('atm_balance', '25000');
            if (!localStorage.getItem('atm_transactions')) localStorage.setItem('atm_transactions', JSON.stringify([]));

            const screens = document.querySelectorAll('.screen');
            const modal = document.getElementById('receipt-modal');
            const receiptDetails = document.getElementById('receipt-details');

            // ==========================================
            // THEME TOGGLE LOGIC
            // ==========================================
            const themeBtn = document.getElementById('theme-toggle');
            
            // Check if user previously saved dark mode
            if (localStorage.getItem('atm_theme') === 'dark') {
                document.body.classList.add('dark-mode');
                themeBtn.innerText = '☀️ Light Mode';
            }

            // Click event for the physical button
            themeBtn.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                
                if (document.body.classList.contains('dark-mode')) {
                    localStorage.setItem('atm_theme', 'dark');
                    themeBtn.innerText = '☀️ Light Mode'; // Change text to Light Mode
                } else {
                    localStorage.setItem('atm_theme', 'light');
                    themeBtn.innerText = '🌙 Dark Mode'; // Change text back to Dark Mode
                }
            });
            // ==========================================

            function switchScreen(targetId) {
                screens.forEach(s => { s.classList.remove('active'); s.classList.add('hidden'); });
                const target = document.getElementById(targetId);
                target.classList.remove('hidden'); target.classList.add('active');
            }

            function showReceipt(action, amount) {
                const date = new Date().toLocaleDateString('en-IN');
                const time = new Date().toLocaleTimeString('en-IN');
                receiptDetails.innerHTML = `<strong>ATM ID:</strong> DEV-ATM-001<br><strong>Date:</strong> ${date} ${time}<br><strong>Action:</strong> ${action}<br><strong>Amount:</strong> ₹${amount}`;
                modal.classList.remove('hidden');
            }

            document.getElementById('btn-close-receipt').addEventListener('click', () => { modal.classList.add('hidden'); switchScreen('dashboard-screen'); });
            document.querySelectorAll('.btn-back').forEach(btn => btn.addEventListener('click', () => switchScreen('dashboard-screen')));

            // INSERT CARD
            document.getElementById('btn-insert-card').addEventListener('click', () => {
                document.getElementById('atm-card').classList.add('inserted');
                setTimeout(() => { switchScreen('pin-screen'); document.getElementById('pin-input').value = ''; }, 1500);
            });

            // PIN LOGIC
            const pinInput = document.getElementById('pin-input');
            document.querySelectorAll('.key').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const val = e.target.innerText;
                    if (val === 'CLR') pinInput.value = '';
                    else if (val === 'ENT') processPin();
                    else if (pinInput.value.length < 4) pinInput.value += val;
                });
            });

            document.addEventListener('keydown', (e) => {
                if (!document.getElementById('pin-screen').classList.contains('active')) return;
                if (e.key >= '0' && e.key <= '9' && pinInput.value.length < 4) pinInput.value += e.key;
                else if (e.key === 'Backspace') pinInput.value = pinInput.value.slice(0, -1);
                else if (e.key === 'Enter') processPin();
            });

            function processPin() {
                const entered = pinInput.value;
                if (entered.length !== 4) return alert('Enter exactly 4 digits.');
                const stored = localStorage.getItem('atm_pin');
                if (!stored) {
                    localStorage.setItem('atm_pin', entered);
                    alert('New PIN set! Proceeding to Dashboard.');
                    switchScreen('dashboard-screen');
                } else {
                    if (entered === stored) switchScreen('dashboard-screen');
                    else { alert('Incorrect PIN.'); pinInput.value = ''; }
                }
            }

            // DASHBOARD NAV
            document.getElementById('nav-withdraw').addEventListener('click', () => switchScreen('withdraw-screen'));
            document.getElementById('nav-deposit').addEventListener('click', () => switchScreen('deposit-screen'));
            document.getElementById('nav-transfer').addEventListener('click', () => switchScreen('transfer-screen'));
            document.getElementById('nav-changepin').addEventListener('click', () => switchScreen('changepin-screen'));
            document.getElementById('nav-fastcash').addEventListener('click', () => switchScreen('withdraw-screen'));

            document.getElementById('nav-balance').addEventListener('click', () => {
                const bal = localStorage.getItem('atm_balance');
                document.getElementById('balance-amount').innerText = `₹${parseFloat(bal).toLocaleString('en-IN')}`;
                document.getElementById('balance-amount').classList.remove('masked');
                switchScreen('balance-screen');
            });

            // EXIT
            document.getElementById('nav-exit').addEventListener('click', () => {
                switchScreen('exit-screen');
                document.getElementById('atm-card').classList.remove('inserted');
                setTimeout(() => switchScreen('welcome-screen'), 3000);
            });

            function logTransaction(type, amount) {
                let txs = JSON.parse(localStorage.getItem('atm_transactions'));
                const date = new Date().toLocaleDateString('en-IN');
                txs.unshift({ date, type, amount });
                if (txs.length > 5) txs.pop();
                localStorage.setItem('atm_transactions', JSON.stringify(txs));
            }

            // WITHDRAW
            document.querySelectorAll('.btn-amount').forEach(btn => {
                btn.addEventListener('click', (e) => document.getElementById('withdraw-input').value = parseInt(e.target.innerText.replace('₹', '').replace(',', '')));
            });

            document.getElementById('btn-confirm-withdraw').addEventListener('click', () => {
                const amt = parseInt(document.getElementById('withdraw-input').value);
                let bal = parseInt(localStorage.getItem('atm_balance'));
                if (!amt || amt <= 0) return alert('Valid amount needed.');
                if (amt % 500 !== 0) return alert('Multiples of ₹500 only.');
                if (amt > bal) return alert('Insufficient Funds.');
                bal -= amt; localStorage.setItem('atm_balance', bal); logTransaction('Withdrawal', amt);
                document.getElementById('withdraw-input').value = ''; showReceipt('Withdrawal Successful', amt);
            });

            // DEPOSIT
            document.getElementById('btn-confirm-deposit').addEventListener('click', () => {
                const amt = parseInt(document.getElementById('deposit-input').value);
                let bal = parseInt(localStorage.getItem('atm_balance'));
                if (!amt || amt <= 0) return alert('Valid amount needed.');
                bal += amt; localStorage.setItem('atm_balance', bal); logTransaction('Deposit', amt);
                document.getElementById('deposit-input').value = ''; showReceipt('Deposit Successful', amt);
            });

            // TRANSFER
            document.getElementById('btn-confirm-transfer').addEventListener('click', () => {
                const acc = document.getElementById('transfer-account').value;
                const amt = parseInt(document.getElementById('transfer-amount').value);
                let bal = parseInt(localStorage.getItem('atm_balance'));
                if (acc.length !== 10) return alert('10-digit account needed.');
                if (!amt || amt <= 0 || amt > bal) return alert('Invalid amount/funds.');
                bal -= amt; localStorage.setItem('atm_balance', bal); logTransaction(`Transfer`, amt);
                document.getElementById('transfer-account').value = ''; document.getElementById('transfer-amount').value = '';
                showReceipt('Transfer Successful', amt);
            });

            // STATEMENT
            document.getElementById('nav-statement').addEventListener('click', () => {
                const tbody = document.getElementById('statement-body');
                const txs = JSON.parse(localStorage.getItem('atm_transactions'));
                tbody.innerHTML = '';
                if (txs.length === 0) tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No recent transactions</td></tr>';
                else txs.forEach(t => tbody.innerHTML += `<tr><td>${t.date}</td><td>${t.type}</td><td>₹${t.amount.toLocaleString('en-IN')}</td></tr>`);
                switchScreen('statement-screen');
            });

            document.getElementById('btn-toggle-balance').addEventListener('click', () => {
                const el = document.getElementById('balance-amount');
                if (el.innerText === '₹**,***') el.innerText = `₹${parseFloat(localStorage.getItem('atm_balance')).toLocaleString('en-IN')}`;
                else el.innerText = '₹**,***';
            });

            // RECEIPT DOWNLOAD
            document.getElementById('nav-receipt').addEventListener('click', () => {
                const txs = JSON.parse(localStorage.getItem('atm_transactions'));
                if (txs && txs.length > 0) {
                    document.getElementById('receipt-preview-box').innerHTML = `<strong>ATM ID:</strong> DEV-ATM-001<br><strong>Date:</strong> ${txs[0].date}<br><strong>Action:</strong> ${txs[0].type}<br><strong>Amount:</strong> ₹${txs[0].amount}`;
                    switchScreen('download-receipt-screen');
                } else alert('No recent transactions.');
            });

            document.getElementById('btn-actual-download').addEventListener('click', () => {
                const txs = JSON.parse(localStorage.getItem('atm_transactions'));
                if (txs && txs.length > 0) {
                    const text = `=== PREMIUM ATM ===\nBy Dev Aryan\n\nDATE: ${txs[0].date}\nACTION: ${txs[0].type}\nAMOUNT: ₹${txs[0].amount}\n===================`;
                    const blob = new Blob([text], { type: 'text/plain' });
                    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `Receipt_${Date.now()}.txt`;
                    document.body.appendChild(link); link.click(); document.body.removeChild(link);
                    switchScreen('dashboard-screen');
                }
            });

            // CHANGE PIN
            document.getElementById('btn-confirm-pin-change').addEventListener('click', () => {
                const old = document.getElementById('old-pin').value, newP = document.getElementById('new-pin').value, conf = document.getElementById('confirm-new-pin').value;
                if (old !== localStorage.getItem('atm_pin')) return alert('Current PIN wrong.');
                if (newP.length !== 4 || conf.length !== 4) return alert('Need 4 digits.');
                if (newP !== conf) return alert('PINs mismatch.');
                localStorage.setItem('atm_pin', newP); alert('PIN Changed! Login again.');
                document.getElementById('old-pin').value = ''; document.getElementById('new-pin').value = ''; document.getElementById('confirm-new-pin').value = '';
                document.getElementById('atm-card').classList.remove('inserted'); switchScreen('welcome-screen');
            });
            
        });
        // =========================================================
        // 9. GLOBAL BUTTON SOUND EFFECT (HTML TAG METHOD)
        // =========================================================
        
        const clickSound = document.getElementById('atm-sound');
        clickSound.volume = 0.1; 

        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => {
                clickSound.currentTime = 0; 
                clickSound.play().catch(error => {
                    console.log("Browser blocked the sound:", error);
                });
            });
        });

        // =========================================================
        // ABOUT MODAL LOGIC
        // =========================================================
        document.getElementById('btn-about').addEventListener('click', () => {
            document.getElementById('about-modal').classList.add('active');
        });
        
        function closeAboutModal() {
            document.getElementById('about-modal').classList.remove('active');
        }

       // =========================================================
        // FEEDBACK MODAL (With UI Hiding Feature)
        // =========================================================
        
        function openFeedbackModal() {
            const modal = document.getElementById('feedback-modal');
            const aboutBtn = document.getElementById('btn-about'); // Grab the About button
            
            if (modal) {
                modal.classList.add('active');
                modal.style.display = 'flex'; 
            }
            
            // Hide the About button instantly
            if (aboutBtn) {
                aboutBtn.style.display = 'none'; 
            }
        }

        function closeFeedbackModal() {
            const modal = document.getElementById('feedback-modal');
            const aboutBtn = document.getElementById('btn-about'); // Grab the About button
            
            if (modal) {
                modal.classList.remove('active');
                modal.style.display = 'none'; 
            }
            
            // Bring the About button back (using 'flex' to keep your icon and text aligned)
            if (aboutBtn) {
                aboutBtn.style.display = 'flex'; 
            }
        }

       // =========================================================
        // STAR RATING LOGIC (Bulletproof Version)
        // =========================================================
        
        function setRating(value) {
            // 1. Save the number so Web3Forms can email it to you
            const ratingInput = document.getElementById('rating-value');
            if (ratingInput) ratingInput.value = value;
            
            // 2. Find all the stars on the screen
            const allStars = document.querySelectorAll('.star');
            
            // 3. Loop through them and fill/unfill based on the clicked number
            allStars.forEach((star, index) => {
                if (index < value) {
                    star.classList.add('active'); // Fill with gold
                } else {
                    star.classList.remove('active'); // Turn grey/transparent
                }
            });
        }
        const ratingInput = document.getElementById('rating-value');

        if (stars.length > 0) {
            stars.forEach(star => {
                star.addEventListener('click', (e) => {
                    const value = e.target.getAttribute('data-value');
                    if (ratingInput) ratingInput.value = value; 
                    
                    stars.forEach(s => s.classList.remove('active'));
                    for(let i = 0; i < value; i++) {
                        stars[i].classList.add('active');
                    }
                });
            });
        }
