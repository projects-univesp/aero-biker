document.addEventListener("DOMContentLoaded", () => {

  const scheduleConfig = window.APP_CONFIG.SCHEDULES;

  const searchInput = document.getElementById("search-input");

  const filterBtns = document.querySelectorAll(".filter-btn");

  const rows = document.querySelectorAll(".schedule-row");

  const countersDisplay = document.getElementById("schedule-counters");

  const prevMonthBtn = document.getElementById(
    scheduleConfig.monthControls.prevBtn
  );

  const nextMonthBtn = document.getElementById(
    scheduleConfig.monthControls.nextBtn
  );

  const currentMonthLabel = document.getElementById(
    scheduleConfig.monthControls.currentMonthLabel
  );

  const currentYearLabel = document.getElementById(
    scheduleConfig.monthControls.currentYearLabel
  );

  let currentFilter = "all";

  let currentDate = new Date();

  const totalCount = rows.length;

  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"
  ];

  function updateMonthCard() {

    currentMonthLabel.textContent =
      months[currentDate.getMonth()];

    currentYearLabel.textContent =
      currentDate.getFullYear();
  }

  const activeCount = Array.from(rows).filter(
    (row) => row.getAttribute("data-status") === "active"
  ).length;

  if (countersDisplay) {
    countersDisplay.textContent =
      `${activeCount} ativos • ${totalCount} total`;
  }

  function filterTable() {

    const searchTerm =
      searchInput?.value.toLowerCase() || "";

    const currentMonth = currentDate.getMonth();

    const currentYear = currentDate.getFullYear();

    rows.forEach((row) => {

      const name =
        (row.getAttribute("data-name") || "")
          .toLowerCase();

      const status =
        row.getAttribute("data-status");

      // IMPORTANTE:
      // cada row precisa possuir:
      // data-date="2025-02-15"

      const rowDate =
        row.getAttribute("data-date");

      let matchesMonth = true;

      if (rowDate) {

        const scheduleDate = new Date(rowDate);

        matchesMonth =
          scheduleDate.getMonth() === currentMonth &&
          scheduleDate.getFullYear() === currentYear;
      }

      const matchesSearch =
        name.includes(searchTerm);

      const matchesFilter =
        currentFilter === "all" ||
        status === currentFilter;

      const shouldShow =
        matchesSearch &&
        matchesFilter &&
        matchesMonth;

      row.style.display =
        shouldShow ? "" : "none";
    });
  }

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      filterTable
    );
  }

  filterBtns.forEach((btn) => {

    btn.addEventListener("click", (e) => {

      currentFilter =
        e.target.getAttribute("data-filter");

      filterBtns.forEach((b) => {

        b.classList.remove(
          "bg-green-500",
          "text-white"
        );

        b.classList.add(
          "bg-white",
          "text-gray-600"
        );
      });

      e.target.classList.remove(
        "bg-white",
        "text-gray-600"
      );

      e.target.classList.add(
        "bg-green-500",
        "text-white"
      );

      filterTable();
    });
  });

  prevMonthBtn?.addEventListener("click", () => {

    currentDate.setMonth(
      currentDate.getMonth() - 1
    );

    updateMonthCard();

    filterTable();
  });

  nextMonthBtn?.addEventListener("click", () => {

    currentDate.setMonth(
      currentDate.getMonth() + 1
    );

    updateMonthCard();

    filterTable();
  });

  updateMonthCard();

  filterTable();
});