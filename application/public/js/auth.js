// Auth forms handler

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.textContent = loading ? 'Aguarde...' : btn.dataset.label;
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError(el) {
  el.classList.add('hidden');
  el.textContent = '';
}

function showSuccess(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

async function post(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro desconhecido');
  return data;
}

// ── Login ──────────────────────────────────────────────────────────────────────

const loginForm = document.getElementById('login-form');
if (loginForm) {
  const btn = document.getElementById('login-btn');
  const errorEl = document.getElementById('login-error');
  btn.dataset.label = btn.textContent;

  const toggleBtn = document.getElementById('toggle-password');
  const passInput = document.getElementById('login-password');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isPassword = passInput.type === 'password';
      passInput.type = isPassword ? 'text' : 'password';
    });
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError(errorEl);
    setLoading(btn, true);

    const email = document.getElementById('login-email').value.trim();
    const password = passInput.value;

    try {
      await post('/api/auth/login', { email, password });
      window.location.href = '/students';
    } catch (err) {
      showError(errorEl, err.message);
    } finally {
      setLoading(btn, false);
    }
  });
}

// ── Setup ──────────────────────────────────────────────────────────────────────

const setupForm = document.getElementById('setup-form');
if (setupForm) {
  const btn = document.getElementById('setup-btn');
  const errorEl = document.getElementById('setup-error');
  const masterInput = document.getElementById('setup-master');
  const confirmInput = document.getElementById('setup-master-confirm');
  const matchEl = document.getElementById('master-match');
  const strengthEl = document.getElementById('master-strength');
  const strengthLabel = document.getElementById('strength-label');
  const strengthBars = document.querySelectorAll('.strength-bar');
  btn.dataset.label = btn.textContent;

  function checkStrength(val) {
    let score = 0;
    if (val.length >= 12) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    return score;
  }

  masterInput.addEventListener('input', () => {
    const val = masterInput.value;
    if (!val) { strengthEl.classList.add('hidden'); return; }
    strengthEl.classList.remove('hidden');

    const score = checkStrength(val);
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
    const labels = ['Fraca', 'Razoável', 'Boa', 'Forte'];

    strengthBars.forEach((bar, i) => {
      bar.className = 'strength-bar h-1 flex-1 rounded-full ' +
        (i < score ? colors[score - 1] : 'bg-gray-700');
    });
    strengthLabel.textContent = labels[score - 1] || '';
    strengthLabel.className = 'text-xs ' + (score >= 4 ? 'text-green-400' : 'text-gray-500');
  });

  function checkMatch() {
    const a = masterInput.value;
    const b = confirmInput.value;
    if (!b) { matchEl.classList.add('hidden'); return; }
    matchEl.classList.remove('hidden');
    if (a === b) {
      matchEl.textContent = 'Senhas coincidem';
      matchEl.className = 'text-xs mt-1 text-green-400';
    } else {
      matchEl.textContent = 'Senhas não coincidem';
      matchEl.className = 'text-xs mt-1 text-red-400';
    }
  }

  masterInput.addEventListener('input', checkMatch);
  confirmInput.addEventListener('input', checkMatch);

  setupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError(errorEl);

    const master = masterInput.value;
    const confirm = confirmInput.value;
    if (master !== confirm) {
      showError(errorEl, 'As senhas mestres não coincidem');
      return;
    }

    setLoading(btn, true);

    const payload = {
      name: document.getElementById('setup-name').value.trim(),
      email: document.getElementById('setup-email').value.trim(),
      password: document.getElementById('setup-password').value,
      masterPassword: master,
      confirmMasterPassword: confirm,
    };

    try {
      await post('/api/auth/setup', payload);
      window.location.href = '/students';
    } catch (err) {
      showError(errorEl, err.message);
    } finally {
      setLoading(btn, false);
    }
  });
}

// ── Register ───────────────────────────────────────────────────────────────────

const registerForm = document.getElementById('register-form');
if (registerForm) {
  const btn = document.getElementById('register-btn');
  const errorEl = document.getElementById('register-error');
  const successEl = document.getElementById('register-success');
  btn.dataset.label = btn.textContent;

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError(errorEl);
    hideError(successEl);
    setLoading(btn, true);

    const payload = {
      name: document.getElementById('register-name').value.trim(),
      email: document.getElementById('register-email').value.trim(),
      password: document.getElementById('register-password').value,
      masterPassword: document.getElementById('register-master').value,
    };

    try {
      await post('/api/auth/register', payload);
      showSuccess(successEl, 'Acesso criado com sucesso! Agora você pode fazer login.');
      registerForm.reset();
    } catch (err) {
      showError(errorEl, err.message);
    } finally {
      setLoading(btn, false);
    }
  });
}

// ── Forgot Password ────────────────────────────────────────────────────────────

const resetForm = document.getElementById('reset-form');
if (resetForm) {
  const btn = document.getElementById('reset-btn');
  const errorEl = document.getElementById('reset-error');
  const successEl = document.getElementById('reset-success');
  const confirmEl = document.getElementById('reset-confirm');
  const matchEl = document.getElementById('confirm-match');
  btn.dataset.label = btn.textContent;

  confirmEl.addEventListener('input', () => {
    const a = document.getElementById('reset-password').value;
    const b = confirmEl.value;
    if (!b) { matchEl.classList.add('hidden'); return; }
    matchEl.classList.remove('hidden');
    if (a === b) {
      matchEl.textContent = 'Senhas coincidem';
      matchEl.className = 'text-xs mt-1 text-green-400';
    } else {
      matchEl.textContent = 'Senhas não coincidem';
      matchEl.className = 'text-xs mt-1 text-red-400';
    }
  });

  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError(errorEl);
    hideError(successEl);

    const newPassword = document.getElementById('reset-password').value;
    const confirm = confirmEl.value;
    if (newPassword !== confirm) {
      showError(errorEl, 'As senhas não coincidem');
      return;
    }

    setLoading(btn, true);

    const payload = {
      email: document.getElementById('reset-email').value.trim(),
      masterPassword: document.getElementById('reset-master').value,
      newPassword,
      confirmNewPassword: confirm,
    };

    try {
      await post('/api/auth/reset-password', payload);
      showSuccess(successEl, 'Senha redefinida com sucesso! Você já pode fazer login.');
      resetForm.reset();
    } catch (err) {
      showError(errorEl, err.message);
    } finally {
      setLoading(btn, false);
    }
  });
}
