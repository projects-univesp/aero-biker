document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const rows = document.querySelectorAll(".schedule-row"); 
  const countersDisplay = document.getElementById("schedule-counters"); 
  
  let currentFilter = "all";

  const totalCount = rows.length;
  
  const activeCount = Array.from(rows).filter(
    (row) => row.getAttribute("data-status") === "active",
  ).length;

  if (countersDisplay) {
    countersDisplay.textContent = `${activeCount} ativos • ${totalCount} total`;
  }

  function filterTable() {
    if (!searchInput) return;

    const searchTerm = searchInput.value.toLowerCase();

    rows.forEach((row) => {
     
      const name = (row.getAttribute("data-name") || "").toLowerCase();
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
});