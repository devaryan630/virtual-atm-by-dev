// 1. Setup Theme & Data
if (!localStorage.getItem('atm_balance')) localStorage.setItem('atm_balance', '25000');
// Force the transaction history to start empty every time the page loads
localStorage.setItem('atm_txs', JSON.stringify([]));
let sessionUserName = "Guest";
let sessionPin = null; 

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

// 3. Insert Card Logic (Updated to route to Name Screen)
document.getElementById('btn-insert-card').addEventListener('click', () => {
    document.getElementById('atm-card').classList.add('inserted');
    setTimeout(() => { 
        nav('name-screen'); 
        document.getElementById('user-name-input').value = ''; 
    }, 1300);
});


// Physically prevent typing more than 30 characters in the box
document.getElementById('user-name-input').maxLength = 30;

// Handles the Name Screen before the PIN with strict validation & length limits
function submitName() {
    const nameInput = document.getElementById('user-name-input').value.trim();
    
    // 1. Check if the input is completely empty
    if (nameInput === "") {
        return alert("Please enter a name to proceed.");
    }

    // 2. NEW: Safety check for length (just in case they paste a long name)
    if (nameInput.length > 30) {
        return alert("❌ Name is too long. Please keep it under 30 characters.");
    }

    // 3. STRICT REGEX CHECK: Only allows uppercase letters, lowercase letters, and spaces
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(nameInput)) {
        document.getElementById('user-name-input').value = ''; 
        return alert("❌ Invalid Name. Please use letters only (no numbers or special characters).");
    }

    // 4. If it passes all checks, save it and move to the PIN screen
    sessionUserName = nameInput;
    document.getElementById('display-user-name').innerText = sessionUserName;
    nav('pin-screen');
    document.getElementById('pin-input').value = '';
}


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
    
    // If no PIN has been set during this page visit, set it now!
    if (sessionPin === null) {
        sessionPin = entered;
        alert('✅ New PIN set for this session! Proceeding to Dashboard.');
        nav('dashboard-screen');
    } else {
        // If a PIN is already set, verify the entered PIN matches
        if (entered === sessionPin) {
            nav('dashboard-screen');
        } else { 
            alert('❌ Incorrect PIN.'); 
            pinInput.value = ''; 
        }
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
    document.getElementById('receipt-text').innerHTML = `Action: ${type}<br>Amount: ₹${amount.toLocaleString('en-IN')}<br>Date: ${new Date().toLocaleDateString()}`;
    document.getElementById('receipt-modal').classList.add('active');
}

function closeModal() { 
    document.getElementById('receipt-modal').classList.remove('active'); 
    nav('dashboard-screen'); 
}

function processWithdraw() {
    const amt = parseInt(document.getElementById('withdraw-input').value);
    let bal = parseInt(localStorage.getItem('atm_balance'));
    if (!amt || amt <= 0 || amt % 500 !== 0) return alert('Enter a valid multiple of ₹500.');
    if (amt > bal) return alert('Insufficient Funds.');
    
    bal -= amt; 
    localStorage.setItem('atm_balance', bal); 
    logTx('Withdrawal', amt);
    document.getElementById('withdraw-input').value = ''; 
    showModal('Withdrawal', amt);
}

function processDeposit() {
    const amt = parseInt(document.getElementById('deposit-input').value);
    let bal = parseInt(localStorage.getItem('atm_balance'));
    
    // 1. Basic validation: Is it a real number greater than 0?
    if (!amt || amt <= 0) return alert('❌ Enter a valid amount.');
    
    // 2. NEW STRICT RULE: Must be a multiple of ₹500
    if (amt % 500 !== 0) return alert('❌ Deposit amount must be in multiples of ₹500 (e.g., 500, 1000, 1500).');

    // 3. Process the transaction
    bal += amt; 
    localStorage.setItem('atm_balance', bal); 
    logTx('Deposit', amt);
    
    // 4. Reset input and show the shiny new PNG receipt
    document.getElementById('deposit-input').value = ''; 
    showModal('Deposit', amt);
}

function processTransfer() {
    const acc = document.getElementById('transfer-acc').value;
    const amt = parseInt(document.getElementById('transfer-amt').value);
    let bal = parseInt(localStorage.getItem('atm_balance'));
    
    if (acc.length !== 10) return alert('Enter exactly 10 digits for Account No.');
    if (!amt || amt <= 0 || amt > bal) return alert('Invalid amount or insufficient funds.');
    
    bal -= amt; 
    localStorage.setItem('atm_balance', bal); 
    logTx(`Transfer`, amt);
    document.getElementById('transfer-acc').value = ''; 
    document.getElementById('transfer-amt').value = ''; 
    showModal('Transfer', amt);
}

function showBalance() {
    document.getElementById('balance-display').innerText = '₹**,***';
    nav('balance-screen');
}

function toggleBalanceVisibility() {
    const el = document.getElementById('balance-display');
    if (el.innerText === '₹**,***') {
        el.innerText = `₹${parseFloat(localStorage.getItem('atm_balance')).toLocaleString('en-IN')}`;
    } else {
        el.innerText = '₹**,***';
    }
}

function showStatement() {
    const tbody = document.getElementById('statement-body');
    const txs = JSON.parse(localStorage.getItem('atm_txs'));
    tbody.innerHTML = '';
    
    if (txs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No recent transactions</td></tr>';
    } else {
        txs.forEach(t => tbody.innerHTML += `<tr><td>${t.date.split(',')[0]}</td><td>${t.type}</td><td>₹${t.amount.toLocaleString('en-IN')}</td></tr>`);
    }
    nav('statement-screen');
}
// Strict Number Filter for Change PIN Inputs
document.querySelectorAll('#pin-old, #pin-new, #pin-conf').forEach(input => {
    input.addEventListener('input', function() {
        // The /\D/g regex targets anything that is NOT a digit (0-9)
        // and instantly replaces it with nothing, effectively blocking it.
        this.value = this.value.replace(/\D/g, ''); 
    });
});

function processPinChange() {
    // .trim() removes any accidental invisible spaces
    const oldP = document.getElementById('pin-old').value.trim();
    const newP = document.getElementById('pin-new').value.trim();
    const confP = document.getElementById('pin-conf').value.trim();

    // 1. Compare against our temporary session variable
    if (oldP !== sessionPin) {
        document.getElementById('pin-old').value = ''; 
        return alert('❌ Current PIN incorrect.');
    }

    // 2. Double-check it is exactly 4 numbers
    if (!/^\d{4}$/.test(newP)) return alert("❌ PIN must be exactly 4 numbers (0-9).");
    
    // 3. Ensure new PINs match
    if (newP !== confP) {
        document.getElementById('pin-new').value = ''; 
        document.getElementById('pin-conf').value = ''; 
        return alert('❌ New PINs do not match.');
    }

    // 4. Update the temporary variable
    sessionPin = newP; 
    alert('✅ PIN Updated! Please login again.');
    
    // 5. Clear fields and exit
    document.getElementById('pin-old').value = ''; 
    document.getElementById('pin-new').value = ''; 
    document.getElementById('pin-conf').value = '';
    
    exitATM();
}

function exitATM() {
    document.getElementById('atm-card').classList.remove('inserted');
    nav('welcome-screen');
}

// 6. Download Receipt File Generation (Premium PNG Full Statement)
document.getElementById('btn-dl-receipt').addEventListener('click', () => {
    const txs = JSON.parse(localStorage.getItem('atm_txs'));
    if (txs.length === 0) return alert('No transactions to download.');
    
    // 1. Create a hidden digital canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 2. Dynamic Height: Base height + (number of transactions * 50px per row)
    const baseHeight = 350;
    canvas.width = 450;
    canvas.height = baseHeight + (txs.length * 60);

    // 3. Paint the Background 
    ctx.fillStyle = '#050e1f'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 4. Draw a Premium Gold Border
    ctx.strokeStyle = '#e8b945'; 
    ctx.lineWidth = 4;
    ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);

    // 5. Add Typography & Branding
    ctx.textAlign = 'center';
    
    // Bank Header
    ctx.font = 'bold 26px "Inter", sans-serif';
    ctx.fillStyle = '#e8b945'; 
    ctx.fillText('PREMIUM VIRTUAL ATM', canvas.width / 2, 70);
    
    // Sub-header / Divider
    ctx.font = '14px monospace';
    ctx.fillStyle = '#a1b6d6';
    ctx.fillText('====================================', canvas.width / 2, 100);

    // 6. Print Account Info
    ctx.textAlign = 'left';
    ctx.font = '18px "Inter", sans-serif';
    ctx.fillStyle = '#ffffff'; 
    ctx.fillText(`ACCOUNT:   ${sessionUserName.toUpperCase()}`, 40, 150);
    ctx.fillText(`PRINT DATE: ${new Date().toLocaleDateString('en-IN')}`, 40, 180);

    // Table Header Divider
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a1b6d6';
    ctx.fillText('------------------------------------', canvas.width / 2, 220);

    // 7. Table Column Headers
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px "Inter", sans-serif';
    ctx.fillStyle = '#e8b945';
    ctx.fillText('TRANSACTION & DATE', 40, 250);
    
    ctx.textAlign = 'right';
    ctx.fillText('AMOUNT', canvas.width - 40, 250);

    // 8. LOOP: Print Every Transaction!
    let startY = 290;
    
    txs.forEach(tx => {
        // Action Text
        ctx.textAlign = 'left';
        ctx.font = 'bold 16px "Inter", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(tx.type.toUpperCase(), 40, startY);

        // Date/Time Subtext
        ctx.font = '12px "Inter", sans-serif';
        ctx.fillStyle = '#a1b6d6';
        ctx.fillText(tx.date, 40, startY + 20);

        // Amount (Color-coded)
        ctx.textAlign = 'right';
        ctx.font = 'bold 18px "Inter", sans-serif';
        if (tx.type === 'Withdrawal') {
            ctx.fillStyle = '#ef4444'; // Red
        } else {
            ctx.fillStyle = '#10b981'; // Green
        }
        ctx.fillText(`₹${tx.amount.toLocaleString('en-IN')}`, canvas.width - 40, startY + 5);

        // Move the Y cursor down for the next row
        startY += 60;
    });

    // 9. Footer Info (Placed dynamically at the bottom)
    ctx.textAlign = 'center';
    ctx.font = 'italic 14px "Inter", sans-serif';
    ctx.fillStyle = '#a1b6d6'; 
    ctx.fillText('Thank you for banking with us!', canvas.width / 2, canvas.height - 60);
    ctx.fillText('System Developed by Dev Aryan', canvas.width / 2, canvas.height - 35);

    // 10. Convert Canvas to PNG and Trigger Download
    const imgURL = canvas.toDataURL('image/png'); 
    const link = document.createElement('a');
    link.href = imgURL;
    link.download = `Premium_Statement_${Date.now()}.png`; 
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// 7. Global Button Sound Effect
const clickSound = document.getElementById('atm-sound');
if (clickSound) clickSound.volume = 0.1; 

document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
        if (clickSound) {
            clickSound.currentTime = 0; 
            clickSound.play().catch(error => {
                console.log("Browser blocked the sound:", error);
            });
        }
    });
});

// 8. Modals & Star Rating Logic
document.getElementById('btn-about').addEventListener('click', () => {
    document.getElementById('about-modal').classList.add('active');
});

function closeAboutModal() {
    document.getElementById('about-modal').classList.remove('active');
}

function openFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    const aboutBtn = document.getElementById('btn-about'); 
    if (modal) { modal.classList.add('active'); modal.style.display = 'flex'; }
    if (aboutBtn) aboutBtn.style.display = 'none'; 
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    const aboutBtn = document.getElementById('btn-about'); 
    if (modal) { modal.classList.remove('active'); modal.style.display = 'none'; }
    if (aboutBtn) aboutBtn.style.display = 'flex'; 
}

function setRating(value) {
    const ratingInput = document.getElementById('rating-value');
    if (ratingInput) ratingInput.value = value;
    
    const allStars = document.querySelectorAll('.star');
    allStars.forEach((star, index) => {
        if (index < value) {
            star.classList.add('active'); 
        } else {
            star.classList.remove('active');
        }
    });
}
