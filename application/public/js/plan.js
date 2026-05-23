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

  // Função que varre a tabela e calcula os totais dinâmicos
  function calculateCardTotals() {
    const summaryCards = document.querySelectorAll(".plan-summary-card");

    // Nosso dicionário mapeando cada modalidade para as suas classes de cor no Tailwind
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
      const activeCount = modRows.filter(
        (row) => row.getAttribute("data-status") === "active",
      ).length;

      const valueEl = document.getElementById(`value-${modality}`);
      const countEl = document.getElementById(`count-${modality}`);

      if (valueEl) valueEl.textContent = formatBRL(totalSum);
      if (countEl)
        countEl.textContent = `${activeCount} ativos • ${modRows.length} total`;
    });
  }

  function filterTable() {
    const searchTerm = searchInput.value.toLowerCase();

    rows.forEach((row) => {
      const name = row.getAttribute("data-name").toLowerCase();
      const status = row.getAttribute("data-status");

      const matchesSearch = name.includes(searchTerm);
      const matchesFilter = currentFilter === "all" || status === currentFilter;

      if (matchesSearch && matchesFilter) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
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

  calculateCardTotals();
});
