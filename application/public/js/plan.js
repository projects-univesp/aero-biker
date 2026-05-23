document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const rows = document.querySelectorAll(".plan-row");
  const countersDisplay = document.getElementById("plan-counters");

  let currentFilter = "all";

  const totalCount = rows.length;

  const activeCount = Array.from(rows).filter(
    (row) => row.getAttribute("data-status") === "active",
  ).length;

  if (countersDisplay) {
    countersDisplay.textContent = `${activeCount} ativos • ${totalCount} total`;
  }

  const formatBRL = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  function calculateCardTotals() {
    const summaryCards = document.querySelectorAll(".plan-summary-card");

    const colorMap = {
      Mensal: ["bg-blue-100", "text-blue-700"],
      Trimestral: ["bg-green-100", "text-green-700"],
      Semestral: ["bg-purple-100", "text-purple-700"],
      Anual: ["bg-orange-100", "text-orange-700"],
    };

    summaryCards.forEach((card) => {
      const modality = card.getAttribute("data-modality");

      const badge = card.querySelector(".modality-badge");
      if (badge) {
        if (colorMap[modality]) {
          badge.classList.add(...colorMap[modality]);
        } else {
          badge.classList.add("bg-gray-100", "text-gray-700");
        }
      }

      const modRows = Array.from(rows).filter(
        (row) => row.getAttribute("data-duration") === modality,
      );
      const totalSum = modRows.reduce(
        (sum, row) => sum + parseFloat(row.getAttribute("data-price") || 0),
        0,
      );
      const activeModCount = modRows.filter(
        (row) => row.getAttribute("data-status") === "active",
      ).length;

      const valueEl = document.getElementById(`value-${modality}`);
      const countEl = document.getElementById(`count-${modality}`);

      if (valueEl) valueEl.textContent = formatBRL(totalSum);
      if (countEl)
        countEl.textContent = `${activeModCount} ativos • ${modRows.length} total`;
    });
  }

  function filterTable() {
    const searchTerm = searchInput?.value.toLowerCase() || "";

    rows.forEach((row) => {
      const name = (row.getAttribute("data-name") || "").toLowerCase();
      const status = row.getAttribute("data-status");

      const matchesSearch = name.includes(searchTerm);
      const matchesFilter = currentFilter === "all" || status === currentFilter;

      row.style.display = matchesSearch && matchesFilter ? "" : "none";
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", filterTable);
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      currentFilter = e.target.getAttribute("data-filter");

      filterBtns.forEach((b) => {
        b.classList.remove("bg-green-500", "text-white");
        b.classList.add("bg-white", "text-gray-600");
      });

      e.target.classList.remove("bg-white", "text-gray-600");
      e.target.classList.add("bg-green-500", "text-white");

      filterTable();
    });
  });

  // Toggle plan active/inactive
  window.handleTogglePlan = async (id) => {
    try {
      const res = await fetch(`/api/plans/${id}/toggle`, { method: "PATCH" });
      if (res.ok) {
        window.location.reload();
      } else {
        const body = await res.json().catch(() => ({}));
        alert(body.message || "Não foi possível alterar o status do plano.");
      }
    } catch (e) {
      console.error("[Plan] Erro ao alterar status:", e);
      alert("Erro de conexão. Tente novamente.");
    }
  };

  // Auto-fill price from settings when duration changes
  const durationEl = document.getElementById("plan-duration");
  if (durationEl) {
    durationEl.addEventListener("change", async () => {
      const duration = durationEl.value;
      if (!duration) return;
      try {
        const res = await fetch("/api/settings/plan-prices");
        if (res.ok) {
          const { data } = await res.json();
          const priceEl = document.getElementById("plan-price");
          if (priceEl && data[duration] != null) {
            priceEl.value = Number(data[duration]).toFixed(2);
          }
        }
      } catch (e) {
        console.error("[Plan] Falha ao buscar preço sugerido:", e);
      }
    });
  }

  // ─── handleOpen override ───────────────────────────────────────────────────
  // The plan API returns { name, description, isActive, price, durationMonths }.
  // This override ensures the form is populated correctly for editing.
  const origHandleOpen = window.handleOpen;
  window.handleOpen = (id, config) => {
    if (config !== window.APP_CONFIG?.PLANS) {
      return typeof origHandleOpen === "function"
        ? origHandleOpen(id, config)
        : undefined;
    }

    // Reset all fields
    const idEl = document.getElementById(config.id);
    if (idEl) idEl.value = "";
    Object.values(config.fields).forEach((htmlId) => {
      const el = document.getElementById(htmlId);
      if (el) el.value = "";
    });
    const priceEl = document.getElementById("plan-price");
    if (priceEl) priceEl.value = "";
    const activeEl = document.getElementById("plan-active");
    if (activeEl) activeEl.checked = true;

    if (!id) {
      window.openModal(config.modalId);
      return;
    }

    fetch(`/api/${config.path}/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Falha ao buscar dados do plano.");
        return r.json();
      })
      .then(({ data }) => {
        if (idEl) idEl.value = data.id || "";

        const nameEl = document.getElementById("plan-name");
        if (nameEl) nameEl.value = data.name || "";

        const descEl = document.getElementById("plan-description");
        if (descEl) descEl.value = data.description || "";

        if (activeEl) activeEl.checked = data.isActive !== false;
        if (priceEl) priceEl.value = data.price ?? "";

        const durEl = document.getElementById("plan-duration");
        if (durEl) durEl.value = data.durationMonths || "";

        window.openModal(config.modalId);
      })
      .catch((err) => {
        console.error("[Plan] Erro ao carregar plano:", err);
        alert(`Erro: ${err.message}`);
      });
  };

  // ─── handleSubmit override ─────────────────────────────────────────────────
  const origHandleSubmit = window.handleSubmit;
  window.handleSubmit = (event, config) => {
    if (config !== window.APP_CONFIG?.PLANS) {
      return typeof origHandleSubmit === "function"
        ? origHandleSubmit(event, config)
        : undefined;
    }

    const dur = document.getElementById("plan-duration");
    if (!dur?.value) {
      event.preventDefault();
      alert("Selecione a modalidade do plano.");
      return;
    }

    const price = parseFloat(
      document.getElementById("plan-price")?.value || "",
    );
    if (Number.isNaN(price) || price <= 0) {
      event.preventDefault();
      alert("Informe um preço válido e positivo.");
      return;
    }

    const desc = document.getElementById("plan-description")?.value?.trim();
    if (!desc) {
      event.preventDefault();
      alert("A descrição do plano é obrigatória.");
      return;
    }

    if (typeof origHandleSubmit === "function") origHandleSubmit(event, config);
  };

  calculateCardTotals();
});
