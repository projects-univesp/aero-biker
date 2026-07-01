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

    summaryCards.forEach((card) => {
      const modality = card.getAttribute("data-modality");

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
        b.classList.remove("bg-green-500", "text-white", "border-green-500");
        b.classList.add("bg-zinc-900", "text-zinc-400", "border-zinc-800");
      });

      e.currentTarget.classList.remove(
        "bg-zinc-900",
        "text-zinc-400",
        "border-zinc-800",
      );
      e.currentTarget.classList.add(
        "bg-green-500",
        "text-white",
        "border-green-500",
      );

      filterTable();
    });
  });

  calculateCardTotals();
});
