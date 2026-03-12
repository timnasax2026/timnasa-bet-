const socket = io();
let currentUser = null;
let currentBalance = 0;
let isPlaying = false;
let currentMultiplier = 1.0;
let gameInterval;

async function authenticate(type) {
    const username = document.getElementById('user-input').value;
    const password = document.getElementById('pass-input').value;
    const res = await fetch('/' + type, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && type === 'login') {
        currentUser = data.username;
        currentBalance = data.balance;
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('game-ui').style.display = 'block';
        document.getElementById('display-name').innerText = currentUser;
        updateUIBalance();
    } else {
        document.getElementById('auth-status').innerText = data.message || data.error;
    }
}

function updateUIBalance() {
    document.getElementById('display-balance').innerText = currentBalance.toFixed(2);
}

function startRound() {
    const bet = parseFloat(document.getElementById('bet-amount').value);
    if (currentBalance < bet) return alert("Salio halitoshi!");
    
    currentBalance -= bet;
    updateUIBalance();
    
    isPlaying = true;
    currentMultiplier = 1.0;
    const crashAt = (Math.random() * 5 + 1.01).toFixed(2);
    
    document.getElementById('bet-btn').disabled = true;
    document.getElementById('cashout-btn').disabled = false;
    document.getElementById('multiplier-text').style.color = "white";

    gameInterval = setInterval(() => {
        currentMultiplier += 0.01;
        document.getElementById('multiplier-text').innerText = currentMultiplier.toFixed(2) + "x";
        
        const autoCash = parseFloat(document.getElementById('auto-cash-input').value);
        if (autoCash && currentMultiplier >= autoCash) triggerCashout();

        if (currentMultiplier >= crashAt) {
            endRound(false);
        }
    }, 100);
}

function triggerCashout() {
    if (!isPlaying) return;
    const bet = parseFloat(document.getElementById('bet-amount').value);
    const win = bet * currentMultiplier;
    currentBalance += win;
    updateUIBalance();
    alert("Umeshinda TZS " + win.toFixed(2));
    endRound(true);
}

function endRound(isWin) {
    clearInterval(gameInterval);
    isPlaying = false;
    document.getElementById('multiplier-text').style.color = "red";
    document.getElementById('bet-btn').disabled = false;
    document.getElementById('cashout-btn').disabled = true;

    const hist = document.getElementById('history-bar');
    const badge = `<span style="background:#444; padding:5px; border-radius:5px; font-size:12px;">${currentMultiplier.toFixed(2)}x</span>`;
    hist.innerHTML = badge + hist.innerHTML;
}

// CHAT
function sendChatMessage() {
    const txt = document.getElementById('msg-input').value;
    if (txt) socket.emit('chat message', { user: currentUser, text: txt });
    document.getElementById('msg-input').value = "";
}
socket.on('chat message', (d) => {
    const box = document.getElementById('chat-msgs');
    box.innerHTML += `<p><b>${d.user}:</b> ${d.text}</p>`;
    box.scrollTop = box.scrollHeight;
});
