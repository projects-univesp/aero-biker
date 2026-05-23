document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.getElementById("search-input");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const rows = document.querySelectorAll(".student-row");
  const countersDisplay = document.getElementById("student-counters");

  let currentFilter = "all";

  const totalCount = rows.length;
  const activeCount = Array.from(rows).filter(
    (row) => row.getAttribute("data-status") === "active",
  ).length;

  if (countersDisplay) {
    countersDisplay.textContent = `${activeCount} alunos ativos • ${totalCount} total`;
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

  // Load groups into the select
  try {
    const res = await fetch("/api/groups");
    if (res.ok) {
      const { data: groups } = await res.json();
      const groupSelect = document.getElementById("student-group");
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
    console.error("[Student] Falha ao carregar turmas:", e);
  }

  // Toggle student active/inactive
  window.handleToggleStudent = async (id) => {
    try {
      const res = await fetch(`/api/students/${id}/toggle`, {
        method: "PATCH",
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const body = await res.json().catch(() => ({}));
        alert(body.message || "Não foi possível alterar o status do aluno.");
      }
    } catch (e) {
      console.error("[Student] Erro ao alterar status:", e);
      alert("Erro de conexão. Tente novamente.");
    }
  };

  // Override handleOpen so groupId and enrollment are set correctly in edit mode
  const origHandleOpen = window.handleOpen;
  window.handleOpen = (id, config) => {
    if (config !== window.APP_CONFIG?.STUDENTS) {
      return typeof origHandleOpen === "function"
        ? origHandleOpen(id, config)
        : undefined;
    }

    // Reset fields
    document.getElementById(config.id).value = "";
    document.getElementById("student-name").value = "";
    document.getElementById("student-phone").value = "";
    document.getElementById("student-group").value = "";
    document.getElementById("student-enrollment").value = "ACTIVE";
    document.getElementById("student-active").checked = true;

    if (!id) {
      window.openModal(config.modalId);
      return;
    }

    fetch(`/api/${config.path}/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Falha ao buscar dados do aluno.");
        return r.json();
      })
      .then(({ data }) => {
        document.getElementById(config.id).value = data.id || "";
        document.getElementById("student-name").value = data.name || "";
        document.getElementById("student-phone").value = data.phone || "";
        document.getElementById("student-group").value = data.groupId || "";
        document.getElementById("student-enrollment").value =
          data.enrollment || "ACTIVE";
        document.getElementById("student-active").checked =
          data.isActive !== false;
        window.openModal(config.modalId);
      })
      .catch((err) => {
        console.error("[Student] Erro ao carregar aluno:", err);
        alert(`Erro: ${err.message}`);
      });
  };

  // Validate groupId before submit
  const origHandleSubmit = window.handleSubmit;
  window.handleSubmit = (event, config) => {
    if (config !== window.APP_CONFIG?.STUDENTS) {
      return typeof origHandleSubmit === "function"
        ? origHandleSubmit(event, config)
        : undefined;
    }

    const groupEl = document.getElementById("student-group");
    if (!groupEl?.value) {
      event.preventDefault();
      alert("Selecione uma turma para continuar.");
      return;
    }

    if (typeof origHandleSubmit === "function") origHandleSubmit(event, config);
  };
});
