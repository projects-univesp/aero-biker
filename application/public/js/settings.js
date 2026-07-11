// Settings page handler

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.textContent = loading ? 'Aguarde...' : btn.dataset.label;
}

function showMsg(el, msg, type = 'error') {
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

async function apiCall(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro desconhecido');
  return data;
}

// ── Academy form ───────────────────────────────────────────────────────────────

const academyForm = document.getElementById('academy-form');
if (academyForm) {
  const btn = document.getElementById('academy-btn');
  const errorEl = document.getElementById('academy-error');
  const successEl = document.getElementById('academy-success');

  academyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoading(btn, true);
    try {
      await apiCall('PATCH', '/api/config/academy', {
        name: document.getElementById('academy-name').value.trim(),
        cnpj: document.getElementById('academy-cnpj').value.trim() || undefined,
        phone: document.getElementById('academy-phone').value.trim() || undefined,
        address: document.getElementById('academy-address').value.trim() || undefined,
      });
      showMsg(successEl, 'Academia atualizada com sucesso!', 'success');
    } catch (err) {
      showMsg(errorEl, err.message, 'error');
    } finally {
      setLoading(btn, false);
    }
  });
}

// ── Change password form ───────────────────────────────────────────────────────

const passwordForm = document.getElementById('password-form');
if (passwordForm) {
  const btn = document.getElementById('password-btn');
  const errorEl = document.getElementById('password-error');
  const successEl = document.getElementById('password-success');

  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoading(btn, true);
    try {
      await apiCall('POST', '/api/config/change-password', {
        currentPassword: document.getElementById('current-password').value,
        newPassword: document.getElementById('new-password').value,
      });
      showMsg(successEl, 'Senha alterada com sucesso!', 'success');
      passwordForm.reset();
    } catch (err) {
      showMsg(errorEl, err.message, 'error');
    } finally {
      setLoading(btn, false);
    }
  });
}

// ── Create user form ───────────────────────────────────────────────────────────

const createUserForm = document.getElementById('create-user-form');
if (createUserForm) {
  const btn = document.getElementById('create-user-btn');
  const errorEl = document.getElementById('create-error');
  const successEl = document.getElementById('create-success');

  createUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoading(btn, true);
    try {
      await apiCall('POST', '/api/config/users', {
        name: document.getElementById('user-name').value.trim(),
        email: document.getElementById('user-email').value.trim(),
        password: document.getElementById('user-password').value,
        role: document.getElementById('user-role').value,
      });
      showMsg(successEl, 'Usuário criado com sucesso!', 'success');
      createUserForm.reset();
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      showMsg(errorEl, err.message, 'error');
    } finally {
      setLoading(btn, false);
    }
  });
}

// ── User management actions ────────────────────────────────────────────────────

window.handleDeactivate = async (id) => {
  if (!confirm('Desativar este usuário?')) return;
  try {
    await apiCall('PATCH', `/api/config/users/${id}/deactivate`);
    window.location.reload();
  } catch (err) {
    alert(err.message);
  }
};

window.handleReactivate = async (id) => {
  try {
    await apiCall('PATCH', `/api/config/users/${id}/reactivate`);
    window.location.reload();
  } catch (err) {
    alert(err.message);
  }
};

// ── Export Data ───────────────────────────────────────────────────────────────
const exportGeneralBtn = document.getElementById('export-general-btn');
if (exportGeneralBtn) {
  exportGeneralBtn.addEventListener('click', () => {
    window.location.href = '/api/config/export/general';
  });
}
