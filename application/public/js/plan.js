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

  if (searchInput) searchInput.addEventListener("input", filterTable);

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
  // The plan API returns { name, description, isActive, prices: [...] }.
  // HandleData.get() would look for data.price and data.durationMonths (flat)
  // which don't exist at the top level — both would be undefined and the inputs
  // would be left blank. This override fetches the plan itself and extracts
  // price/durationMonths from prices[0].
  const origHandleOpen = window.handleOpen;
  window.handleOpen = (id, config) => {
    if (config !== window.APP_CONFIG?.PLANS) {
      return typeof origHandleOpen === "function"
        ? origHandleOpen(id, config)
        : undefined;
    }

    // Reset all fields
    document.getElementById(config.id).value = "";
    Object.values(config.fields).forEach((htmlId) => {
      const el = document.getElementById(htmlId);
      if (el) el.value = "";
    });
    const priceEl = document.getElementById("plan-price");
    if (priceEl) priceEl.value = "";
    document.getElementById("plan-active").checked = true;

    if (!id) {
      window.openModal(config.modalId);
      return;
    }

    // Edit: fetch → extract prices[0] → populate → open
    fetch(`/api/${config.path}/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Falha ao buscar dados do plano.");
        return r.json();
      })
      .then(({ data }) => {
        document.getElementById(config.id).value = data.id || "";

        document.getElementById("plan-name").value = data.name || "";
        document.getElementById("plan-description").value =
          data.description || "";
        document.getElementById("plan-active").checked =
          data.isActive !== false;

        // price and durationMonths live in prices[] on the API response
        const firstPrice = Array.isArray(data.prices) ? data.prices[0] : null;
        if (firstPrice) {
          document.getElementById("plan-price").value = firstPrice.price ?? "";
          document.getElementById("plan-duration").value =
            firstPrice.durationMonths || "";
        }

        window.openModal(config.modalId);
      })
      .catch((err) => {
        console.error("[Plan] Erro ao carregar plano:", err);
        alert(`Erro: ${err.message}`);
      });
  };

  // ─── handleSubmit override ─────────────────────────────────────────────────
  // Validates required fields before the generic handleData.js submit runs.
  const origHandleSubmit = window.handleSubmit;
  window.handleSubmit = (event, config) => {
    if (config !== window.APP_CONFIG?.PLANS) {
      return typeof origHandleSubmit === "function"
        ? origHandleSubmit(event, config)
        : undefined;
    }

    const durationEl = document.getElementById("plan-duration");
    if (!durationEl?.value) {
      event.preventDefault();
      alert("Selecione a modalidade do plano.");
      return;
    }

    const priceEl = document.getElementById("plan-price");
    const price = parseFloat(priceEl?.value || "");
    if (!priceEl?.value || isNaN(price) || price <= 0) {
      event.preventDefault();
      alert("Informe um preço válido e positivo.");
      return;
    }

    const descEl = document.getElementById("plan-description");
    if (!descEl?.value?.trim()) {
      event.preventDefault();
      alert("A descrição do plano é obrigatória.");
      return;
    }

    if (typeof origHandleSubmit === "function") origHandleSubmit(event, config);
  };
});
