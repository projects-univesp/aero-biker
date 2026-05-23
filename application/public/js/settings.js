document.addEventListener("DOMContentLoaded", async () => {
  const DURATIONS = ["Mensal", "Trimestral", "Semestral", "Anual"];
  const MONTHS = { Trimestral: 3, Semestral: 6, Anual: 12 };

  function fmt(val) {
    return Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  }

  function updatePerMonthLabels(prices) {
    for (const [key, divisor] of Object.entries(MONTHS)) {
      const el = document.getElementById(`settings-ppm-${key}`);
      if (el && prices[key]) {
        el.textContent = `≈ R$ ${fmt(prices[key] / divisor)}/mês`;
      }
    }
  }

  // Load current plan prices from DB
  try {
    const res = await fetch("/api/settings/plan-prices");
    if (res.ok) {
      const { data } = await res.json();
      DURATIONS.forEach((key) => {
        const el = document.getElementById(`settings-price-${key}`);
        if (el && data[key] != null) el.value = Number(data[key]).toFixed(2);
      });
      updatePerMonthLabels(data);
    }
  } catch (e) {
    console.error("[Settings] Falha ao carregar valores dos planos:", e);
  }

  // Update per-month labels as user types
  DURATIONS.forEach((key) => {
    const el = document.getElementById(`settings-price-${key}`);
    if (el) {
      el.addEventListener("input", () => {
        const prices = {};
        DURATIONS.forEach((k) => {
          const inp = document.getElementById(`settings-price-${k}`);
          if (inp) prices[k] = parseFloat(inp.value) || 0;
        });
        updatePerMonthLabels(prices);
      });
    }
  });

  // Save plan prices
  const saveBtn = document.getElementById("btn-save-plan-prices");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const prices = {};
      let valid = true;

      DURATIONS.forEach((key) => {
        const el = document.getElementById(`settings-price-${key}`);
        const val = parseFloat(el?.value || "");
        if (isNaN(val) || val <= 0) {
          valid = false;
        } else {
          prices[key] = val;
        }
      });

      if (!valid) {
        alert("Informe valores positivos para todas as modalidades.");
        return;
      }

      saveBtn.disabled = true;
      const originalHTML = saveBtn.innerHTML;
      saveBtn.innerHTML = `<svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Salvando...`;

      try {
        const res = await fetch("/api/settings/plan-prices", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(prices),
        });

        if (res.ok) {
          saveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg> Salvo!`;
          setTimeout(() => {
            saveBtn.innerHTML = originalHTML;
            saveBtn.disabled = false;
          }, 2000);
        } else {
          throw new Error("Erro ao salvar");
        }
      } catch (e) {
        console.error("[Settings] Falha ao salvar valores:", e);
        alert("Não foi possível salvar os valores. Tente novamente.");
        saveBtn.innerHTML = originalHTML;
        saveBtn.disabled = false;
      }
    });
  }

  // Load admin credentials
  try {
    const res = await fetch("/api/settings/credentials");
    if (res.ok) {
      const { data } = await res.json();
      const nameEl = document.getElementById("settings-username");
      if (nameEl && data.name) nameEl.value = data.name;
    }
  } catch (e) {
    console.error("[Settings] Falha ao carregar credenciais:", e);
  }

  // Save credentials
  const saveCredBtn = document.getElementById("btn-save-credentials");
  if (saveCredBtn) {
    saveCredBtn.addEventListener("click", async () => {
      const name = document.getElementById("settings-username")?.value?.trim();
      const oldPassword = document.getElementById("settings-old-password")?.value;
      const newPassword = document.getElementById("settings-password")?.value;

      if (!name && !newPassword) {
        alert("Informe o nome ou uma nova senha para salvar.");
        return;
      }

      if (newPassword && !oldPassword) {
        alert("Informe a senha atual para poder alterar a senha.");
        return;
      }

      if (newPassword && newPassword.length < 6) {
        alert("A nova senha deve ter no mínimo 6 caracteres.");
        return;
      }

      const body = {};
      if (name) body.name = name;
      if (newPassword) { body.newPassword = newPassword; body.oldPassword = oldPassword; }

      saveCredBtn.disabled = true;
      const originalHTML = saveCredBtn.innerHTML;
      saveCredBtn.innerHTML = `<svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Salvando...`;

      try {
        const res = await fetch("/api/settings/credentials", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          document.getElementById("settings-old-password").value = "";
          document.getElementById("settings-password").value = "";
          saveCredBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg> Salvo!`;
          setTimeout(() => { saveCredBtn.innerHTML = originalHTML; saveCredBtn.disabled = false; }, 2000);
        } else {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Erro ao salvar");
        }
      } catch (e) {
        console.error("[Settings] Falha ao salvar credenciais:", e);
        alert(e.message || "Não foi possível salvar. Tente novamente.");
        saveCredBtn.innerHTML = originalHTML;
        saveCredBtn.disabled = false;
      }
    });
  }

  // Toggle password visibility
  const toggleBtn = document.getElementById("btn-toggle-password");
  const passwordInput = document.getElementById("settings-password");
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener("click", () => {
      passwordInput.type =
        passwordInput.type === "password" ? "text" : "password";
    });
  }
});
