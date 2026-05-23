document.addEventListener("DOMContentLoaded", async () => {
  const scheduleConfig = window.APP_CONFIG.SCHEDULES;

  const searchInput = document.getElementById("search-input");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const rows = document.querySelectorAll(".schedule-row");
  const countersDisplay = document.getElementById("schedule-counters");

  const prevMonthBtn = document.getElementById(
    scheduleConfig.monthControls.prevBtn,
  );
  const nextMonthBtn = document.getElementById(
    scheduleConfig.monthControls.nextBtn,
  );
  const currentMonthLabel = document.getElementById(
    scheduleConfig.monthControls.currentMonthLabel,
  );
  const currentYearLabel = document.getElementById(
    scheduleConfig.monthControls.currentYearLabel,
  );

  let currentFilter = "all";
  let currentDate;

  const firstRow = document.querySelector(".schedule-row");
  if (firstRow) {
    const firstDate = firstRow.getAttribute("data-date");
    if (firstDate) {
      const dateOnly = firstDate.split("T")[0];
      currentDate = new Date(`${dateOnly}T00:00:00`);
    } else {
      currentDate = new Date();
    }
  } else {
    currentDate = new Date();
  }

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
    "Dezembro",
  ];

  function updateMonthCard() {
    currentMonthLabel.textContent = months[currentDate.getMonth()];
    currentYearLabel.textContent = currentDate.getFullYear();
  }

  const activeCount = Array.from(rows).filter(
    (row) => row.getAttribute("data-status") === "active",
  ).length;

  if (countersDisplay) {
    countersDisplay.textContent = `${activeCount} ativas • ${totalCount} total`;
  }

  function filterTable() {
    const allRows = document.querySelectorAll(".schedule-row");
    const searchTerm = searchInput?.value.toLowerCase() || "";
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    allRows.forEach((row) => {
      const name = (row.getAttribute("data-name") || "").toLowerCase();
      const status = row.getAttribute("data-status");
      const rawDate = row.getAttribute("data-date");
      const rowDate = rawDate ? rawDate.split("T")[0] : null;

      if (!rowDate) {
        row.style.display = "none";
        return;
      }

      const [year, month] = rowDate.split("-").map(Number);
      const matchesMonth = month - 1 === currentMonth && year === currentYear;
      const matchesSearch = name.includes(searchTerm);
      const matchesFilter = currentFilter === "all" || status === currentFilter;

      row.style.display =
        matchesSearch && matchesFilter && matchesMonth ? "" : "none";
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

  prevMonthBtn?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateMonthCard();
    filterTable();
  });

  nextMonthBtn?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateMonthCard();
    filterTable();
  });

  updateMonthCard();
  filterTable();

  // Populate groups select
  try {
    const res = await fetch("/api/groups");
    if (res.ok) {
      const { data: groups } = await res.json();
      const groupSelect = document.getElementById("schedule-group");
      if (groupSelect && groups?.length) {
        groups
          .filter((g) => g.isActive !== false)
          .forEach((g) => {
            const opt = document.createElement("option");
            opt.value = g.id;
            opt.textContent = g.name;
            groupSelect.appendChild(opt);
          });
      }
    }
  } catch (e) {
    console.error("[Schedule] Falha ao carregar turmas:", e);
  }

  // ─── handleOpen override ───────────────────────────────────────────────────
  // Replaces the generic handleData.js version for schedules so that:
  //   • dayAndMonth (DataTypes.DATE → ISO timestamp) is stripped to YYYY-MM-DD
  //     before being set on input[type=date] — the browser silently rejects
  //     ISO timestamps, leaving the field blank.
  //   • startTime / endTime (DataTypes.TIME → "HH:MM:SS") are truncated to
  //     HH:MM — Zod regex requires exactly 5 chars.
  //   • currentStudents defaults to 0 instead of clearing to "".
  //   • checkboxes are explicitly reset on create.
  const origHandleOpen = window.handleOpen;
  window.handleOpen = (id, config) => {
    if (config !== window.APP_CONFIG?.SCHEDULES) {
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
    document.getElementById("schedule-current-students").value = "0";
    document.getElementById("schedule-holiday").checked = false;
    document.getElementById("schedule-active").checked = true;

    if (!id) {
      window.openModal(config.modalId);
      return;
    }

    // Edit: fetch → normalize → populate → open
    fetch(`/api/${config.path}/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Falha ao buscar dados da aula.");
        return r.json();
      })
      .then(({ data }) => {
        document.getElementById(config.id).value = data.id || "";

        document.getElementById("schedule-title").value = data.title || "";
        document.getElementById("schedule-category").value =
          data.category || "";
        document.getElementById("schedule-level").value = data.level || "";
        document.getElementById("schedule-description").value =
          data.description || "";

        // Strip ISO timestamp → YYYY-MM-DD
        document.getElementById("schedule-date").value = String(
          data.dayAndMonth || "",
        )
          .split("T")[0]
          .substring(0, 10);

        // Strip seconds → HH:MM
        document.getElementById("schedule-start").value = String(
          data.startTime || "",
        ).substring(0, 5);
        document.getElementById("schedule-end").value = String(
          data.endTime || "",
        ).substring(0, 5);

        document.getElementById("schedule-current-students").value =
          data.currentStudents ?? 0;
        document.getElementById("schedule-group").value = data.groupId || "";
        document.getElementById("schedule-holiday").checked = !!data.isHoliday;
        document.getElementById("schedule-active").checked =
          data.isActive !== false;

        window.openModal(config.modalId);
      })
      .catch((err) => {
        console.error("[Schedule] Erro ao carregar aula:", err);
        alert(`Erro: ${err.message}`);
      });
  };

  // ─── handleSubmit override ─────────────────────────────────────────────────
  // Runs before handleData.js submit to:
  //   • Validate groupId is selected.
  //   • Default currentStudents to 0 if blank.
  //   • Trim any residual seconds from time values.
  const origHandleSubmit = window.handleSubmit;
  window.handleSubmit = (event, config) => {
    if (config !== window.APP_CONFIG?.SCHEDULES) {
      return typeof origHandleSubmit === "function"
        ? origHandleSubmit(event, config)
        : undefined;
    }

    const groupEl = document.getElementById("schedule-group");
    if (!groupEl?.value) {
      event.preventDefault();
      alert("Selecione uma turma para continuar.");
      return;
    }

    const studentsEl = document.getElementById("schedule-current-students");
    if (
      studentsEl &&
      (studentsEl.value === "" || Number.isNaN(Number(studentsEl.value)))
    ) {
      studentsEl.value = "0";
    }

    const startEl = document.getElementById("schedule-start");
    if (startEl?.value?.length > 5)
      startEl.value = startEl.value.substring(0, 5);

    const endEl = document.getElementById("schedule-end");
    if (endEl?.value?.length > 5) endEl.value = endEl.value.substring(0, 5);

    if (typeof origHandleSubmit === "function") origHandleSubmit(event, config);
  };
});
