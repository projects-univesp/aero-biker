document.addEventListener("DOMContentLoaded", async () => {
  const rows = document.querySelectorAll(".subscription-row");
  const countersDisplay = document.getElementById("subscription-counters");

  // Elementos do novo filtro visual
  const searchInput = document.getElementById("search-input");
  const monthFilter = document.getElementById("month-filter");
  const filterButtons = document.querySelectorAll(".filter-btn");

  // 1. Lógica original de preenchimento e formatação
  const origHandleOpen = window.handleOpen;
  window.handleOpen = (id, config) => {
    const promise =
      typeof origHandleOpen === "function"
        ? origHandleOpen(id, config)
        : Promise.resolve();
    if (config === window.APP_CONFIG?.SUBSCRIPTIONS) {
      Promise.resolve(promise).then(() => {
        const startDateEl = document.getElementById("subscription-start-date");
        const renDateEl = document.getElementById(
          "subscription-renovation-date",
        );
        if (id) {
          if (startDateEl?.value?.includes("T"))
            startDateEl.value = startDateEl.value.split("T")[0];
          if (renDateEl?.value?.includes("T"))
            renDateEl.value = renDateEl.value.split("T")[0];
        } else {
          const today = new Date().toISOString().split("T")[0];
          if (startDateEl) startDateEl.value = today;
        }
      });
    }
  };
  
  try {
    const [studentsRes, plansRes] = await Promise.all([
      fetch("/api/students"),
      fetch("/api/plans"),
    ]);

    // Extrai o JSON das respostas
    const studentsJson = await studentsRes.json();
    const plansJson = await plansRes.json();

    // A sua API retorna { message: "...", data: [...] }
    const students = studentsJson.data || [];
    const plans = plansJson.data || [];

    // Mapas para busca rápida
    const studentMap = {};
    const planMap = {};

    const studentSelect = document.getElementById("subscription-student");
    const planSelect = document.getElementById("subscription-plan");

    // Popula o mapa de alunos e o <select> do modal
    students.forEach((student) => {
      studentMap[student.id] = student.name;
      if (studentSelect) {
        const option = document.createElement("option");
        option.value = student.id;
        option.textContent = student.name;
        studentSelect.appendChild(option);
      }
    });

    // Popula o mapa de planos e o <select> do modal
    plans.forEach((plan) => {
      planMap[plan.id] = plan.name;
      if (planSelect) {
        const option = document.createElement("option");
        option.value = plan.id;
        option.textContent = plan.name;
        planSelect.appendChild(option);
      }
    });

    // Substitui os "—" pelos nomes reais na tabela baseados nos IDs
    rows.forEach((row) => {
      const studentSpan = row.querySelector(".student-name");
      const planSpan = row.querySelector(".plan-name");

      if (studentSpan) {
        const studentId = studentSpan.getAttribute("data-student-id");
        if (studentId && studentMap[studentId]) {
          studentSpan.textContent = studentMap[studentId];
        }
      }

      if (planSpan) {
        const planId = planSpan.getAttribute("data-plan-id");
        if (planId && planMap[planId]) {
          planSpan.textContent = planMap[planId];
        }
      }
    });

    // É IMPORTANTE chamar o filtro novamente aqui para garantir
    // que a busca por texto funcione com os nomes recém-renderizados
    filterAndCount();
  } catch (e) {
    console.error("[Subscription] Falha ao carregar dados:", e);
  }

  // 2. Lógica de Filtro e Contadores
  let activeStatus = "all";

  // Seta mês atual no filtro (YYYY-MM)
  if (monthFilter) monthFilter.value = new Date().toISOString().substring(0, 7);

  function filterAndCount() {
    const term = searchInput ? searchInput.value.toLowerCase() : "";
    const selectedMonth = monthFilter ? monthFilter.value : "";
    let counts = { all: 0, PAID: 0, PENDING: 0, CANCELLED: 0 };

    rows.forEach((row) => {
      const studentName =
        row.querySelector(".student-name")?.textContent?.toLowerCase() || "";
      const planName =
        row.querySelector(".plan-name")?.textContent?.toLowerCase() || "";
      const status = row.getAttribute("data-status");
      const rawDate = row.getAttribute("data-date") || "";
      const rowMonth = rawDate.substring(0, 7);

      const matchesSearch =
        studentName.includes(term) || planName.includes(term);
      const matchesMonth = selectedMonth === "" || rowMonth === selectedMonth;
      const matchesStatus = activeStatus === "all" || status === activeStatus;

      if (matchesSearch && matchesMonth) {
        counts.all++;
        if (counts[status] !== undefined) counts[status]++;
        row.style.display = matchesStatus ? "" : "none";
      } else {
        row.style.display = "none";
      }
    });

    // Atualiza os contadores na tela (os que você definiu no modal ou top)
    if (countersDisplay)
      countersDisplay.textContent = `${counts.all} filtradas • ${rows.length} total`;

    // Atualiza os crachás dos botões, se existirem
    Object.keys(counts).forEach((key) => {
      const badge = document.getElementById(`count-${key.toLowerCase()}`);
      if (badge) badge.textContent = counts[key];
    });
  }

  // Listeners
  searchInput?.addEventListener("input", filterAndCount);
  monthFilter?.addEventListener("change", filterAndCount);
  filterButtons.forEach((btn) =>
    btn.addEventListener("click", (e) => {
      // 1. Volta todos para o Dark Theme inativo
      filterButtons.forEach((b) => {
        b.classList.remove("bg-green-500", "text-white", "border-green-500");
        b.classList.add("bg-zinc-900", "text-zinc-400", "border-zinc-800");
      });
      // 2. Coloca o estilo verde vibrante apenas no botão clicado
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

      activeStatus = e.currentTarget.getAttribute("data-filter");
      filterAndCount();
    }),
  );
});
