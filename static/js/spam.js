const BASE_URL = window.location.origin;  // ← FIX: Dynamic URL (http://localhost:5000)
let spamChart = null;
let authenticated = false;  // ← Global state

// Check if already logged in (runs every 2 seconds after login attempt)
function pollAuthStatus() {
    if (!document.getElementById('loginSection')) return;  // Skip if already on dashboard
   
    fetch(`${BASE_URL}/api/check-auth`, {credentials: 'include'})  // ← FIX: Send cookies!
        .then(response => response.json())
        .then(data => {
            if (data.authenticated && !authenticated) {
                authenticated = true;
                console.log('✅ Login detected! Loading dashboard...');
                renderUI(true);  // Force dashboard
            }
        })
        .catch(err => console.log('Auth check:', err));
}

function renderUI(forceAuthenticated = null) {
    const nav = document.getElementById('nav');
    const main = document.getElementById('main');
   
    // Use forced state or global state
    const isAuth = forceAuthenticated !== null ? forceAuthenticated : authenticated;
   
    if (!isAuth) {
        nav.innerHTML = '<button class="btn" onclick="showLogin()">Login/Register</button>';
        main.innerHTML = `
            <div id="loginSection">
                <h2>👋 Welcome to Spam Detector</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <div>
                        <h3>🔑 Login</h3>
                        <form id="loginForm">
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" id="loginEmail" placeholder="test@example.com" required>
                            </div>
                            <div class="form-group">
                                <label>Password</label>
                                <input type="password" id="loginPassword" placeholder="1234" required>
                            </div>
                            <button type="submit" class="btn">Login →</button>
                        </form>
                    </div>
                    <div>
                        <h3>📝 Register</h3>
                        <form id="registerForm">
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" id="regEmail" placeholder="test@example.com" required>
                            </div>
                            <div class="form-group">
                                <label>Password</label>
                                <input type="password" id="regPassword" placeholder="1234" required>
                            </div>
                            <button type="submit" class="btn">Register →</button>
                        </form>
                    </div>
                </div>
                <div id="message" class="alert"></div>
            </div>
        `;
       
        // Add event listeners
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
        document.getElementById('registerForm').addEventListener('submit', handleRegister);
       
        // Start polling for login status
        setInterval(pollAuthStatus, 2000);
       
    } else {
        authenticated = true;
        nav.innerHTML = '<button class="btn" onclick="logout()">🚪 Logout</button>';
        main.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <div id="detectorSection">
                    <h2>🔍 Check Message</h2>
                    <form id="spamForm">
                        <div class="form-group">
                            <label>Enter message to check</label>
                            <textarea id="message" placeholder="Paste SMS/email here..." required></textarea>
                        </div>
                        <button type="submit" class="btn" style="width: 100%;">🚀 Detect Spam</button>
                    </form>
                    <div id="result"></div>
                </div>
                <div>
                    <div id="statsSection">
                        <h2>📊 Your Statistics</h2>
                        <div class="stats-grid" id="stats">Loading...</div>
                        <div id="chart-container">
                            <canvas id="spamChart" width="300" height="300"></canvas>
                        </div>
                    </div>
                    <div id="historySection" style="margin-top: 30px;">
                        <h2>📜 Recent Predictions</h2>
                        <div id="history">Loading...</div>
                    </div>
                </div>
            </div>
        `;
       
        document.getElementById('spamForm').addEventListener('submit', handleSpamDetection);
        loadStats();
        loadHistory();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
   
    try {
        const response = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            credentials: 'include',  // ← CRITICAL: Send session cookies
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password})
        });
       
        const data = await response.json();
       
        if (response.ok) {
            showMessage('✅ Login successful! Loading dashboard...', 'success');
            setTimeout(() => renderUI(true), 1500);  // Force dashboard after 1.5s
        } else {
            showMessage(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showMessage('Network error. Is server running?', 'error');
        console.error('Login error:', error);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
   
    try {
        const response = await fetch(`${BASE_URL}/api/register`, {
            method: 'POST',
            credentials: 'include',  // ← CRITICAL: Send session cookies
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password})
        });
       
        const data = await response.json();
       
        if (response.ok) {
            showMessage('✅ Registered! Please login.', 'success');
            document.getElementById('loginEmail').value = email;
            document.getElementById('loginPassword').value = password;
        } else {
            showMessage(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showMessage('Network error. Is server running?', 'error');
    }
}

async function handleSpamDetection(e) {
    e.preventDefault();
    const message = document.getElementById('message').value;
   
    try {
        const response = await fetch(`${BASE_URL}/api/detect-spam`, {
            method: 'POST',
            credentials: 'include',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({message})
        });
       
        const data = await response.json();
       
        if (response.ok) {
            const resultDiv = document.getElementById('result');
            const spamConf = parseFloat(data.spam_confidence);
            const hamConf = parseFloat(data.ham_confidence);
           
            resultDiv.innerHTML = `
                <div class="prediction-card">
                    <div class="prediction-label">${data.prediction}</div>
                    <div class="confidence">
                        <div class="conf-bar">
                            <label>🔴 SPAM ${spamConf.toFixed(1)}%</label>
                            <div class="bar">
                                <div class="bar-fill" style="width: ${spamConf}%"></div>
                            </div>
                        </div>
                        <div class="conf-bar">
                            <label>🟢 HAM ${hamConf.toFixed(1)}%</label>
                            <div class="bar">
                                <div class="bar-fill" style="width: ${hamConf}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            loadStats();
            loadHistory();
        } else {
            showMessage(data.error || 'Detection failed', 'error');
        }
    } catch (error) {
        showMessage('Detection error', 'error');
    }
}

async function loadStats() {
    try {
        const response = await fetch(`${BASE_URL}/api/stats`, {credentials: 'include'});
        const data = await response.json();
        const statsDiv = document.getElementById('stats');
       
        statsDiv.innerHTML = `
            <div class="stat-card">
                <h3>${data.total_messages || 0}</h3>
                <p>Total Messages</p>
            </div>
            <div class="stat-card">
                <h3>${data.spam_count || 0}</h3>
                <p>Spam (${data.spam_percentage || 0}%)</p>
            </div>
            <div class="stat-card">
                <h3>${data.ham_count || 0}</h3>
                <p>Ham</p>
            </div>
            <div class="stat-card">
                <h3>${data.avg_spam_confidence || '0%'}</h3>
                <p>Avg Confidence</p>
            </div>
        `;
       
        // Chart
        const canvas = document.getElementById('spamChart');
        if (canvas && data.total_messages > 0) {
            const ctx = canvas.getContext('2d');
            if (spamChart) spamChart.destroy();
            spamChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Spam', 'Ham'],
                    datasets: [{
                        data: [data.spam_count, data.ham_count],
                        backgroundColor: ['#ff6b6b', '#4ecdc4']
                    }]
                }
            });
        }
    } catch (error) {
        console.error('Stats error:', error);
    }
}

async function loadHistory() {
    try {
        const response = await fetch(`${BASE_URL}/api/history?limit=5`, {credentials: 'include'});
        const predictions = await response.json();
        const historyDiv = document.getElementById('history');
       
        if (predictions.length === 0) {
            historyDiv.innerHTML = '<p>No predictions yet. Try detecting some spam!</p>';
        } else {
            historyDiv.innerHTML = predictions.map(p => `
                <div class="history-item ${p.prediction.toLowerCase()}">
                    <strong>${p.prediction}</strong> - ${(p.spam_confidence*100).toFixed(0)}% confidence
                    <p class="message">${p.message}</p>
                    <small>${p.timestamp}</small>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('History error:', error);
    }
}

async function logout() {
    try {
        await fetch(`${BASE_URL}/api/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        authenticated = false;
        renderUI(false);
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = text;
        messageDiv.className = `alert alert-${type}`;
        messageDiv.style.display = 'block';
        setTimeout(() => messageDiv.style.display = 'none', 4000);
    }
}

// START APP
renderUI(false);