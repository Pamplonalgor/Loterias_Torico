/**
 * LOTERÍAS TORICO - La Elección del Olentzero
 * Navarra • Sorteo Extraordinario de Navidad
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. DATA & LOCAL STATE
  // ==========================================================================
  const DEFAULT_STOCK = [
    { number: '77724', code: 'TORO-24', serie: '042', fraccion: '07', available: true },
    { number: '14707', code: 'TORO-07', serie: '018', fraccion: '03', available: true },
    { number: '03412', code: 'TORO-12', serie: '085', fraccion: '01', available: true },
    { number: '58291', code: 'TORO-91', serie: '102', fraccion: '09', available: true },
    { number: '89520', code: 'TORO-20', serie: '067', fraccion: '04', available: true },
    { number: '22124', code: 'TORO-22', serie: '031', fraccion: '08', available: true },
    { number: '00714', code: 'TORO-14', serie: '014', fraccion: '02', available: true },
    { number: '31226', code: 'TORO-26', serie: '099', fraccion: '05', available: true },
    { number: '65403', code: 'TORO-03', serie: '054', fraccion: '06', available: true },
    { number: '12240', code: 'TORO-40', serie: '120', fraccion: '10', available: true }
  ];

  const GITHUB_REPO_OWNER = 'Pamplonalgor';
  const GITHUB_REPO_NAME = 'Loterias_Torico';
  const DEFAULT_GITHUB_TOKEN = '';

  const DEFAULT_SETTINGS = {
    adminPin: '1407',
    timeoutSeconds: 25,
    soundEnabled: true,
    githubToken: DEFAULT_GITHUB_TOKEN
  };

  let state = {
    stock: [],
    settings: { ...DEFAULT_SETTINGS },
    olentzeroChoices: { answer: '', log: '', goal: '' },
    recommendedTickets: [],
    adminInputPin: '',
    tripleTapCount: 0,
    tripleTapTimer: null,
    inactivityTimer: null,
    remainingSeconds: 25,
    todayPlays: 24
  };

  function loadState() {
    try {
      const savedStock = localStorage.getItem('torico_lottery_stock');
      state.stock = savedStock ? JSON.parse(savedStock) : [...DEFAULT_STOCK];

      const savedSettings = localStorage.getItem('torico_lottery_settings');
      if (savedSettings) {
        state.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      }

      const savedToken = localStorage.getItem('torico_github_token');
      if (savedToken) state.settings.githubToken = savedToken;

      const savedPlays = localStorage.getItem('torico_today_plays');
      if (savedPlays) state.todayPlays = parseInt(savedPlays, 10);
    } catch (e) {
      state.stock = [...DEFAULT_STOCK];
    }
  }

  function saveStock() {
    try {
      localStorage.setItem('torico_lottery_stock', JSON.stringify(state.stock));
    } catch (e) {}
  }

  function saveSettings() {
    try {
      localStorage.setItem('torico_lottery_settings', JSON.stringify(state.settings));
      if (state.settings.githubToken) {
        localStorage.setItem('torico_github_token', state.settings.githubToken);
      }
    } catch (e) {}
  }

  function incrementPlays() {
    state.todayPlays++;
    try {
      localStorage.setItem('torico_today_plays', state.todayPlays.toString());
    } catch (e) {}
  }

  // ==========================================================================
  // SHARED CLOUD STOCK SYNC (Para que a todo el mundo le salgan los mismos números)
  // ==========================================================================
  async function loadSharedStock() {
    // 1. URL parameter check (?s=77724,14707 or ?stock=...)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const sParam = urlParams.get('s') || urlParams.get('stock');
      if (sParam) {
        const rawNums = sParam.split(/[,;\s]+/);
        const validNums = rawNums.filter(n => /^\d{5}$/.test(n));
        if (validNums.length > 0) {
          state.stock = validNums.map(n => ({
            number: n,
            code: `TORO-${n.slice(-2)}`,
            serie: String(Math.floor(Math.random() * 150) + 1).padStart(3, '0'),
            fraccion: String(Math.floor(Math.random() * 10) + 1).padStart(2, '0'),
            available: true
          }));
          saveStock();
          console.log('Números cargados desde parámetro URL');
          return;
        }
      }
    } catch (e) {}

    // 2. Fetch stock.json from GitHub
    const timestamp = Date.now();
    const tryUrls = [
      `./stock.json?_t=${timestamp}`,
      `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/main/stock.json?_t=${timestamp}`
    ];

    for (const url of tryUrls) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const remoteStock = await res.json();
          if (Array.isArray(remoteStock) && remoteStock.length > 0) {
            state.stock = remoteStock;
            saveStock();
            console.log('Stock oficial sincronizado desde GitHub:', remoteStock.length, 'números');
            return;
          }
        }
      } catch (e) {
        // Continue to next URL
      }
    }

    // 3. Fallback to localStorage / defaults
    loadState();
  }

  // ==========================================================================
  // 2. AUDIO SYNTHESIZER (Pure Web Audio API)
  // ==========================================================================
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  const Sound = {
    tap: () => {
      if (!state.settings.soundEnabled) return;
      initAudio();
      if (!audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(350, audioCtx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.06);
      } catch (e) {}
    },

    wood: () => {
      if (!state.settings.soundEnabled) return;
      initAudio();
      if (!audioCtx) return;
      try {
        const bufferSize = audioCtx.sampleRate * 0.15;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 900;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start();
      } catch (e) {}
    },

    chimes: () => {
      if (!state.settings.soundEnabled) return;
      initAudio();
      if (!audioCtx) return;
      try {
        const notes = [880, 1174.66, 1318.51];
        notes.forEach((freq, idx) => {
          setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
          }, idx * 80);
        });
      } catch (e) {}
    },

    celebration: () => {
      if (!state.settings.soundEnabled) return;
      initAudio();
      if (!audioCtx) return;
      try {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.4);
          }, idx * 100);
        });
      } catch (e) {}
    }
  };

  // ==========================================================================
  // 3. CANVAS PARTICLES: SUBTLE SNOW & EMBERS
  // ==========================================================================
  const canvas = document.getElementById('fx-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let particles = [];

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function initParticles() {
    particles = [];
    const count = window.innerWidth < 640 ? 30 : 50;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.6,
        speedY: Math.random() * 0.6 + 0.3,
        speedX: Math.random() * 0.4 - 0.2,
        alpha: Math.random() * 0.4 + 0.2,
        isSpark: Math.random() < 0.2
      });
    }
  }

  function renderFX() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2, false);
      if (p.isSpark) {
        ctx.fillStyle = `rgba(217, 119, 6, ${p.alpha * 0.8})`;
        p.y -= p.speedY * 0.6;
        if (p.y < 0) p.y = canvas.height;
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.5})`;
        p.y += p.speedY;
        if (p.y > canvas.height) p.y = 0;
      }
      p.x += p.speedX;
      if (p.x > canvas.width) p.x = 0;
      if (p.x < 0) p.x = canvas.width;
      ctx.fill();
    }

    requestAnimationFrame(renderFX);
  }

  // ==========================================================================
  // 4. SCREEN NAVIGATION
  // ==========================================================================
  const screens = {
    attract: document.getElementById('screen-attract'),
    gameOlentzero: document.getElementById('screen-game-olentzero'),
    revealLoading: document.getElementById('screen-reveal-loading'),
    result: document.getElementById('screen-result')
  };

  function showScreen(name) {
    Object.keys(screens).forEach(key => {
      if (screens[key]) {
        screens[key].classList.add('hidden');
        screens[key].classList.remove('active');
      }
    });

    if (screens[name]) {
      screens[name].classList.remove('hidden');
      screens[name].classList.add('active');
    }

    startInactivityCountdown(name);
  }

  // ==========================================================================
  // 5. INACTIVITY & AUTO-RESET (25s Kiosk Timer)
  // ==========================================================================
  const timerPill = document.getElementById('kiosk-timer-pill');
  const timerSecondsEl = document.getElementById('kiosk-timer-seconds');
  const resultCountdownEl = document.getElementById('result-countdown');

  function clearTimers() {
    if (state.inactivityTimer) {
      clearInterval(state.inactivityTimer);
      state.inactivityTimer = null;
    }
  }

  function startInactivityCountdown(currentScreen) {
    clearTimers();
    const timeout = parseInt(state.settings.timeoutSeconds, 10);

    if (timeout <= 0 || currentScreen === 'attract') {
      if (timerPill) timerPill.classList.add('hidden');
      return;
    }

    state.remainingSeconds = timeout;
    if (timerPill) timerPill.classList.remove('hidden');
    if (timerSecondsEl) timerSecondsEl.textContent = `${state.remainingSeconds}s`;
    if (resultCountdownEl) resultCountdownEl.textContent = `${state.remainingSeconds}s`;

    state.inactivityTimer = setInterval(() => {
      state.remainingSeconds--;
      if (timerSecondsEl) timerSecondsEl.textContent = `${state.remainingSeconds}s`;
      if (resultCountdownEl) resultCountdownEl.textContent = `${state.remainingSeconds}s`;

      if (state.remainingSeconds <= 0) {
        clearTimers();
        resetToAttract();
      }
    }, 1000);
  }

  function resetToAttract() {
    clearTimers();
    state.olentzeroChoices = { answer: '', log: '', goal: '' };
    resetOlentzeroSteps();
    showScreen('attract');
  }

  function onUserActivity() {
    if (state.inactivityTimer) {
      state.remainingSeconds = parseInt(state.settings.timeoutSeconds, 10);
      if (timerSecondsEl) timerSecondsEl.textContent = `${state.remainingSeconds}s`;
      if (resultCountdownEl) resultCountdownEl.textContent = `${state.remainingSeconds}s`;
    }
  }

  // ==========================================================================
  // 6. STOCK & TICKET SELECTION (Un Par de Números)
  // ==========================================================================
  function pickTwoNumbers() {
    const available = state.stock.filter(item => item.available);
    let first, second;

    if (available.length >= 2) {
      const shuffled = [...available].sort(() => 0.5 - Math.random());
      first = shuffled[0];
      second = shuffled[1];
    } else if (available.length === 1) {
      first = available[0];
      const twinNum = String(Math.floor(Math.random() * 90000) + 10000);
      second = {
        number: twinNum,
        code: `TORO-${twinNum.slice(-2)}`,
        serie: '001',
        fraccion: '01',
        available: true
      };
    } else {
      first = { number: '77724', code: 'TORO-24', serie: '042', fraccion: '07' };
      second = { number: '14707', code: 'TORO-07', serie: '018', fraccion: '03' };
    }

    state.recommendedTickets = [first, second];
    incrementPlays();
    return [first, second];
  }

  // ==========================================================================
  // 7. OLENTZERO EXPERIENCE (~20-25 seconds total)
  // ==========================================================================
  function resetOlentzeroSteps() {
    const step1 = document.getElementById('olentzero-step-1');
    const step2 = document.getElementById('olentzero-step-2');
    const step3 = document.getElementById('olentzero-step-3');
    const progress = document.getElementById('olentzero-progress');
    const indicator = document.getElementById('olentzero-step-indicator');

    if (step1) step1.classList.remove('hidden');
    if (step2) step2.classList.add('hidden');
    if (step3) step3.classList.add('hidden');
    if (progress) progress.style.width = '33%';
    if (indicator) indicator.textContent = 'Pregunta 1 de 3';
  }

  function setupOlentzeroMode() {
    resetOlentzeroSteps();
    showScreen('gameOlentzero');

    // Step 1: Conducta
    document.querySelectorAll('.olentzero-opt-btn').forEach(btn => {
      btn.onclick = () => {
        Sound.tap();
        state.olentzeroChoices.answer = btn.getAttribute('data-answer');
        document.getElementById('olentzero-step-1').classList.add('hidden');
        document.getElementById('olentzero-step-2').classList.remove('hidden');
        document.getElementById('olentzero-progress').style.width = '66%';
        document.getElementById('olentzero-step-indicator').textContent = 'Pregunta 2 de 3';
      };
    });

    // Step 2: Ofrenda Chimenea
    document.querySelectorAll('.olentzero-log-btn').forEach(btn => {
      btn.onclick = () => {
        Sound.wood();
        state.olentzeroChoices.log = btn.getAttribute('data-log');
        document.getElementById('olentzero-step-2').classList.add('hidden');
        document.getElementById('olentzero-step-3').classList.remove('hidden');
        document.getElementById('olentzero-progress').style.width = '100%';
        document.getElementById('olentzero-step-indicator').textContent = 'Pregunta 3 de 3';
      };
    });

    // Step 3: Destino Premio
    document.querySelectorAll('.olentzero-goal-btn').forEach(btn => {
      btn.onclick = () => {
        Sound.chimes();
        state.olentzeroChoices.goal = btn.getAttribute('data-goal');
        triggerReveal();
      };
    });
  }

  function getOlentzeroVerdict() {
    const { answer, log, goal } = state.olentzeroChoices;

    if (goal === 'jefe') {
      return `"El Olentzero ha examinado tu caso junto al fuego. Dice que a ese jefe le vas a mandar una postal de despedida con este par de décimos de Loterías Torico. ¡Aupa ahí!"`;
    }
    if (goal === 'cuadrilla') {
      return `"Al Olentzero le gusta la gente que cuida a su cuadrilla. Con buena leña y lealtad, el bombo de San Ildefonso canta mejor: aquí tienes tus dos números de la suerte."`;
    }
    if (log === 'pacharan') {
      return `"Un trago de pacharán alegra cualquier invierno. El Olentzero bendice tu jugada en Loterías Torico con esta pareja de décimos listos en ventanilla."`;
    }
    if (answer === 'trasto') {
      return `"Dice el Olentzero que eres algo trasto, pero como tienes nobleza navarra te perdona el carbón y te confía estos dos números del sorteo."`;
    }
    return `"Dice el Olentzero que tu corazón es noble como el roble de Urbasa. Te deja estos dos números bendecidos para el 22 de diciembre."`;
  }

  function triggerReveal() {
    showScreen('revealLoading');
    const [ticket1, ticket2] = pickTwoNumbers();

    setTimeout(() => {
      displayFinalResults(ticket1, ticket2);
    }, 2000);
  }

  function displayFinalResults(ticket1, ticket2) {
    showScreen('result');
    Sound.celebration();

    // Fill tickets
    document.getElementById('ticket-number-1').textContent = ticket1.number;
    document.getElementById('ticket-code-1').textContent = ticket1.code || 'TORO-01';
    document.getElementById('ticket-serie-1').textContent = ticket1.serie || '042';
    document.getElementById('ticket-frac-1').textContent = ticket1.fraccion || '07';

    document.getElementById('ticket-number-2').textContent = ticket2.number;
    document.getElementById('ticket-code-2').textContent = ticket2.code || 'TORO-02';
    document.getElementById('ticket-serie-2').textContent = ticket2.serie || '018';
    document.getElementById('ticket-frac-2').textContent = ticket2.fraccion || '03';

    // Fill verdict
    document.getElementById('verdict-text').textContent = getOlentzeroVerdict();
  }

  // ==========================================================================
  // 8. ADMIN & BULK NUMBER LOADING SYSTEM (Con Código PIN)
  // ==========================================================================
  const modalAdmin = document.getElementById('modal-admin');
  const adminPinView = document.getElementById('admin-pin-view');
  const adminDashboardView = document.getElementById('admin-dashboard-view');
  const adminTrigger = document.getElementById('admin-trigger');
  const btnOpenAdmin = document.getElementById('btn-open-admin');

  function openAdminPinPad() {
    Sound.tap();
    state.adminInputPin = '';
    updatePinDots();
    document.getElementById('pin-error').textContent = '';
    adminPinView.classList.remove('hidden');
    adminDashboardView.classList.add('hidden');
    modalAdmin.classList.remove('hidden');
    modalAdmin.classList.add('flex');
  }

  function closeAdminModal() {
    Sound.tap();
    modalAdmin.classList.add('hidden');
    modalAdmin.classList.remove('flex');
  }

  function handlePinDigit(digit) {
    if (state.adminInputPin.length < 4) {
      Sound.tap();
      state.adminInputPin += digit;
      updatePinDots();

      if (state.adminInputPin.length === 4) {
        setTimeout(verifyAdminPin, 150);
      }
    }
  }

  function updatePinDots() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, index) => {
      if (index < state.adminInputPin.length) {
        dot.classList.add('bg-amber-400', 'border-amber-400');
        dot.classList.remove('bg-stone-950', 'border-stone-600');
      } else {
        dot.classList.remove('bg-amber-400', 'border-amber-400');
        dot.classList.add('bg-stone-950', 'border-stone-600');
      }
    });
  }

  function verifyAdminPin() {
    if (state.adminInputPin === state.settings.adminPin) {
      Sound.chimes();
      adminPinView.classList.add('hidden');
      adminDashboardView.classList.remove('hidden');
      adminDashboardView.classList.add('flex');
      renderAdminDashboard();
    } else {
      const errEl = document.getElementById('pin-error');
      if (errEl) errEl.textContent = 'Código Incorrecto';
      adminPinView.classList.add('shake');
      setTimeout(() => {
        adminPinView.classList.remove('shake');
        state.adminInputPin = '';
        updatePinDots();
      }, 400);
    }
  }

  function renderAdminDashboard() {
    const activeCount = state.stock.filter(s => s.available).length;
    const soldoutCount = state.stock.length - activeCount;

    document.getElementById('stat-active-count').textContent = activeCount;
    document.getElementById('stat-soldout-count').textContent = soldoutCount;
    document.getElementById('stat-today-plays').textContent = state.todayPlays;
    document.getElementById('stock-total-count').textContent = state.stock.length;
    document.getElementById('setting-timeout').value = state.settings.timeoutSeconds.toString();

    const tokenInput = document.getElementById('setting-github-token');
    if (tokenInput) tokenInput.value = state.settings.githubToken || '';

    const stockContainer = document.getElementById('admin-stock-list');
    stockContainer.innerHTML = '';

    if (state.stock.length === 0) {
      stockContainer.innerHTML = `
        <div class="text-center py-4 text-xs text-stone-500 italic">
          No hay números cargados. Usa la caja de carga masiva arriba para pegar números.
        </div>
      `;
      return;
    }

    state.stock.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between p-2 rounded-xl bg-stone-950 border border-stone-800 text-xs';
      row.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="font-serif font-bold text-amber-200 text-sm tracking-wider">${item.number}</span>
          <span class="font-mono text-[10px] text-stone-400">${item.code || 'TORO'}</span>
        </div>
        <div class="flex items-center gap-2">
          <button data-idx="${index}" class="btn-toggle-stock px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase ${
            item.available ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/50' : 'bg-stone-900 text-stone-500 border border-stone-800'
          }">
            ${item.available ? 'Disponible' : 'Agotado'}
          </button>
          <button data-idx="${index}" class="btn-delete-stock text-stone-500 hover:text-red-400 p-1" title="Eliminar">
            ✕
          </button>
        </div>
      `;
      stockContainer.appendChild(row);
    });

    stockContainer.querySelectorAll('.btn-toggle-stock').forEach(btn => {
      btn.onclick = () => {
        Sound.tap();
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        state.stock[idx].available = !state.stock[idx].available;
        saveStock();
        renderAdminDashboard();
      };
    });

    stockContainer.querySelectorAll('.btn-delete-stock').forEach(btn => {
      btn.onclick = () => {
        Sound.tap();
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        state.stock.splice(idx, 1);
        saveStock();
        renderAdminDashboard();
      };
    });
  }

  // ==========================================================================
  // PUBLICAR STOCK EN GITHUB (Para que a todo el mundo le salgan los mismos)
  // ==========================================================================
  async function publishStockToGitHub() {
    const statusEl = document.getElementById('sync-status');
    const labelEl = document.getElementById('sync-label');
    const iconEl = document.getElementById('sync-icon');

    const tokenInput = document.getElementById('setting-github-token');
    let token = (tokenInput && tokenInput.value.trim()) || state.settings.githubToken || localStorage.getItem('torico_github_token');

    if (!token) {
      token = prompt('Introduce tu token de GitHub (ghp_...) para sincronizar la web:');
      if (!token) return;
      token = token.trim();
    }

    state.settings.githubToken = token;
    saveSettings();

    if (labelEl) labelEl.textContent = 'Publicando...';
    if (iconEl) iconEl.textContent = '⏳';
    if (statusEl) {
      statusEl.className = 'text-[11px] text-amber-300 font-medium mt-1';
      statusEl.textContent = 'Subiendo números a GitHub para todos los dispositivos...';
      statusEl.classList.remove('hidden');
    }

    try {
      const path = 'stock.json';
      const headers = {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      };

      // Get current file sha if exists
      let sha = null;
      try {
        const fileRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${path}`, { headers });
        if (fileRes.ok) {
          const fileData = await fileRes.json();
          sha = fileData.sha;
        }
      } catch (e) {}

      // Convert JSON to Base64 (supporting UTF-8 characters)
      const jsonString = JSON.stringify(state.stock, null, 2);
      const utf8Bytes = new TextEncoder().encode(jsonString);
      let binary = '';
      utf8Bytes.forEach(b => binary += String.fromCharCode(b));
      const base64Content = btoa(binary);

      const bodyObj = {
        message: 'feat: Actualizar stock.json oficial para todos los clientes',
        content: base64Content
      };
      if (sha) bodyObj.sha = sha;

      const putRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${path}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(bodyObj)
      });

      if (putRes.ok) {
        Sound.celebration();
        saveStock();
        if (statusEl) {
          statusEl.className = 'text-[11px] text-emerald-400 font-medium mt-1';
          statusEl.textContent = '✅ ¡Publicado con éxito! Ahora cualquier persona que abra el enlace verá tus números.';
        }
        alert('¡Éxito total! Tus números se han publicado en GitHub. A partir de ahora, todo el mundo que abra el enlace verá tus números.');
      } else {
        const errJson = await putRes.json();
        throw new Error(errJson.message || 'Error en la petición a GitHub');
      }
    } catch (err) {
      console.error(err);
      if (statusEl) {
        statusEl.className = 'text-[11px] text-red-400 font-medium mt-1';
        statusEl.textContent = '❌ Error al sincronizar: ' + err.message;
      }
      alert('Hubo un problema al subir a GitHub: ' + err.message + '\nVerifica que el token de GitHub es correcto en los ajustes.');
    } finally {
      if (labelEl) labelEl.textContent = 'Publicar para Todos';
      if (iconEl) iconEl.textContent = '☁️';
    }
  }

  // ==========================================================================
  // 9. INITIALIZATION & EVENTS WIRING
  // ==========================================================================
  async function initApp() {
    loadState();
    await loadSharedStock();

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    initParticles();
    renderFX();

    // Sound Toggle
    const soundBtn = document.getElementById('sound-btn');
    const soundIcon = document.getElementById('sound-icon');
    const updateSoundUI = () => {
      if (soundIcon) soundIcon.textContent = state.settings.soundEnabled ? '🔊' : '🔇';
    };
    updateSoundUI();

    if (soundBtn) {
      soundBtn.onclick = () => {
        state.settings.soundEnabled = !state.settings.soundEnabled;
        if (state.settings.soundEnabled) Sound.chimes();
        saveSettings();
        updateSoundUI();
      };
    }

    // User activity resets timer
    window.addEventListener('pointerdown', onUserActivity);

    // Start Button -> Olentzero Questions
    const btnStart = document.getElementById('btn-start');
    if (btnStart) {
      btnStart.onclick = () => {
        Sound.chimes();
        setupOlentzeroMode();
      };
    }

    // Play Again Button
    const btnPlayAgain = document.getElementById('btn-play-again');
    if (btnPlayAgain) {
      btnPlayAgain.onclick = () => {
        Sound.tap();
        resetToAttract();
      };
    }

    // Direct Header Button: "El Torico Admin"
    if (btnOpenAdmin) {
      btnOpenAdmin.onclick = openAdminPinPad;
    }

    // Secret 3 Taps on Logo in Header
    if (adminTrigger) {
      adminTrigger.onclick = () => {
        state.tripleTapCount++;
        clearTimeout(state.tripleTapTimer);
        state.tripleTapTimer = setTimeout(() => {
          state.tripleTapCount = 0;
        }, 1200);

        if (state.tripleTapCount >= 3) {
          state.tripleTapCount = 0;
          openAdminPinPad();
        }
      };
    }

    // Keyboard Shortcut (Ctrl + Shift + A)
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        openAdminPinPad();
      }
    });

    // Keypad Digits
    document.querySelectorAll('.keypad-btn').forEach(btn => {
      btn.onclick = () => handlePinDigit(btn.textContent.trim());
    });

    const btnPinClear = document.getElementById('btn-pin-clear');
    if (btnPinClear) {
      btnPinClear.onclick = () => {
        Sound.tap();
        state.adminInputPin = '';
        updatePinDots();
      };
    }

    const btnPinCancel = document.getElementById('btn-pin-cancel');
    if (btnPinCancel) btnPinCancel.onclick = closeAdminModal;

    const btnAdminClose = document.getElementById('btn-admin-close');
    if (btnAdminClose) btnAdminClose.onclick = closeAdminModal;

    // --- CARGA MASIVA DE NÚMEROS (PEGAR LISTA) ---
    const btnBulkAdd = document.getElementById('btn-bulk-add');
    if (btnBulkAdd) {
      btnBulkAdd.onclick = () => {
        const textarea = document.getElementById('bulk-numbers-input');
        const text = textarea.value.trim();
        if (!text) {
          alert('Pega o escribe los números antes de pulsar Cargar.');
          return;
        }

        const matches = text.match(/\b\d{5}\b/g);
        if (!matches || matches.length === 0) {
          alert('No se encontraron números válidos de 5 cifras. Recuerda que deben tener exactamente 5 dígitos (ej. 77724, 14707).');
          return;
        }

        let addedCount = 0;
        const existingSet = new Set(state.stock.map(s => s.number));

        matches.forEach(num => {
          if (!existingSet.has(num)) {
            existingSet.add(num);
            state.stock.unshift({
              number: num,
              code: `TORO-${num.slice(-2)}`,
              serie: String(Math.floor(Math.random() * 150) + 1).padStart(3, '0'),
              fraccion: String(Math.floor(Math.random() * 10) + 1).padStart(2, '0'),
              available: true
            });
            addedCount++;
          }
        });

        saveStock();
        textarea.value = '';
        Sound.chimes();
        renderAdminDashboard();
        alert(`¡Cargados ${addedCount} números! Ahora puedes pulsar "Publicar para Todos" para que se aplique en la web.`);
      };
    }

    // --- BOTÓN SINCRONIZAR CON TODOS (PUBLICAR EN GITHUB) ---
    const btnSyncCloud = document.getElementById('btn-sync-cloud');
    if (btnSyncCloud) {
      btnSyncCloud.onclick = publishStockToGitHub;
    }

    // --- BOTÓN COMPARTIR ENLACE DIRECTO ---
    const btnShareLink = document.getElementById('btn-share-link');
    if (btnShareLink) {
      btnShareLink.onclick = () => {
        Sound.tap();
        const nums = state.stock.filter(s => s.available).map(s => s.number).join(',');
        const baseUrl = window.location.origin + window.location.pathname;
        const shareUrl = `${baseUrl}?s=${nums}`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(shareUrl).then(() => {
            alert('¡Enlace directo copiado al portapapeles!\nCualquier persona que abra este enlace cargará automáticamente estos números:\n\n' + shareUrl);
          }).catch(() => prompt('Copia este enlace directo:', shareUrl));
        } else {
          prompt('Copia este enlace directo:', shareUrl);
        }
      };
    }

    // --- CARGA INDIVIDUAL DE NÚMERO ---
    const btnAddNumber = document.getElementById('btn-add-number');
    if (btnAddNumber) {
      btnAddNumber.onclick = () => {
        const inputNum = document.getElementById('new-number-input');
        const inputCode = document.getElementById('new-code-input');
        const val = inputNum.value.trim();
        const codeVal = inputCode.value.trim() || `TORO-${val.slice(-2)}`;

        if (val.length === 5 && !isNaN(val)) {
          if (state.stock.some(s => s.number === val)) {
            alert('Este número ya está en la lista.');
            return;
          }
          Sound.chimes();
          state.stock.unshift({
            number: val,
            code: codeVal,
            serie: String(Math.floor(Math.random() * 150) + 1).padStart(3, '0'),
            fraccion: String(Math.floor(Math.random() * 10) + 1).padStart(2, '0'),
            available: true
          });
          saveStock();
          inputNum.value = '';
          inputCode.value = '';
          renderAdminDashboard();
        } else {
          alert('Introduce un número de 5 cifras válido (ej. 89520).');
        }
      };
    }

    // --- VACIAR TODOS LOS NÚMEROS ---
    const btnClearAll = document.getElementById('btn-clear-all-stock');
    if (btnClearAll) {
      btnClearAll.onclick = () => {
        if (confirm('¿Seguro que deseas eliminar todos los números cargados?')) {
          Sound.tap();
          state.stock = [];
          saveStock();
          renderAdminDashboard();
        }
      };
    }

    // --- GUARDAR AJUSTES LOCALES & NUEVO PIN ---
    const btnAdminSave = document.getElementById('btn-admin-save');
    if (btnAdminSave) {
      btnAdminSave.onclick = () => {
        Sound.chimes();
        state.settings.timeoutSeconds = parseInt(document.getElementById('setting-timeout').value, 10);
        
        const newPinInput = document.getElementById('setting-new-pin');
        if (newPinInput && newPinInput.value.trim().length === 4) {
          state.settings.adminPin = newPinInput.value.trim();
          newPinInput.value = '';
        }

        const tokenInput = document.getElementById('setting-github-token');
        if (tokenInput && tokenInput.value.trim()) {
          state.settings.githubToken = tokenInput.value.trim();
        }

        saveSettings();
        saveStock();
        alert('Ajustes guardados localmente. Recuerda pulsar "Publicar para Todos" si quieres que estos números se suban a la web para todo el mundo.');
        closeAdminModal();
      };
    }

    // --- RESTABLECER NÚMEROS POR DEFECTO ---
    const btnResetDefaults = document.getElementById('btn-reset-stock-defaults');
    if (btnResetDefaults) {
      btnResetDefaults.onclick = () => {
        if (confirm('¿Restablecer el inventario a la lista inicial de números de ejemplo?')) {
          state.stock = [...DEFAULT_STOCK];
          saveStock();
          renderAdminDashboard();
        }
      };
    }

    showScreen('attract');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
