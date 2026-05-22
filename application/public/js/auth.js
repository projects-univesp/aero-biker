// Auth forms handler

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.textContent = loading ? 'Aguarde...' : btn.dataset.label;
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideMsg(el) {
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

  const toggleBtn = document.getElementById('toggle-password');
  const passInput = document.getElementById('login-password');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      passInput.type = passInput.type === 'password' ? 'text' : 'password';
    });
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMsg(errorEl);
    setLoading(btn, true);
    try {
      await post('/api/auth/login', {
        email: document.getElementById('login-email').value.trim(),
        password: passInput.value,
      });
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

  setupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMsg(errorEl);
    setLoading(btn, true);
    try {
      await post('/api/auth/setup', {
        academyName: document.getElementById('setup-academy').value.trim(),
        name: document.getElementById('setup-name').value.trim(),
        email: document.getElementById('setup-email').value.trim(),
        password: document.getElementById('setup-password').value,
      });
      window.location.href = '/students';
    } catch (err) {
      showError(errorEl, err.message);
    } finally {
      setLoading(btn, false);
    }
  });
}

// ── Forgot Password ────────────────────────────────────────────────────────────

const forgotForm = document.getElementById('forgot-form');
if (forgotForm) {
  const btn = document.getElementById('forgot-btn');
  const errorEl = document.getElementById('forgot-error');
  const successEl = document.getElementById('forgot-success');

  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMsg(errorEl);
    hideMsg(successEl);
    setLoading(btn, true);
    try {
      await post('/api/auth/forgot-password', {
        email: document.getElementById('forgot-email').value.trim(),
      });
      showSuccess(successEl, 'Se o email existir em nosso sistema, você receberá um link de recuperação.');
      forgotForm.reset();
    } catch (err) {
      showError(errorEl, err.message);
    } finally {
      setLoading(btn, false);
    }
  });
}

// ── Reset Password ─────────────────────────────────────────────────────────────

const resetForm = document.getElementById('reset-form');
if (resetForm) {
  const btn = document.getElementById('reset-btn');
  const errorEl = document.getElementById('reset-error');
  const successEl = document.getElementById('reset-success');
  const confirmEl = document.getElementById('reset-confirm');
  const matchEl = document.getElementById('confirm-match');

  confirmEl.addEventListener('input', () => {
    const a = document.getElementById('reset-password').value;
    const b = confirmEl.value;
    if (!b) { matchEl.classList.add('hidden'); return; }
    matchEl.classList.remove('hidden');
    if (a === b) {
      matchEl.textContent = 'Senhas coincidem';
      matchEl.className = 'text-xs mt-1 text-green-500';
    } else {
      matchEl.textContent = 'Senhas não coincidem';
      matchEl.className = 'text-xs mt-1 text-red-500';
    }
  });

  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMsg(errorEl);
    hideMsg(successEl);

    const password = document.getElementById('reset-password').value;
    const confirm = confirmEl.value;
    if (password !== confirm) {
      showError(errorEl, 'As senhas não coincidem');
      return;
    }

    const token = document.getElementById('reset-token').value;
    if (!token) {
      showError(errorEl, 'Link de recuperação inválido. Solicite um novo.');
      return;
    }

    setLoading(btn, true);
    try {
      await post('/api/auth/reset-password', { token, password });
      showSuccess(successEl, 'Senha redefinida com sucesso!');
      setTimeout(() => { window.location.href = '/login'; }, 2000);
    } catch (err) {
      showError(errorEl, err.message);
    } finally {
      setLoading(btn, false);
    }
  });
}
