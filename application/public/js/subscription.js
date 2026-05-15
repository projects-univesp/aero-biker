document.addEventListener("DOMContentLoaded", async () => {
  // Counters
  const rows = document.querySelectorAll(".subscription-row");
  const countersDisplay = document.getElementById("subscription-counters");
  const activeCount = Array.from(rows).filter(
    (row) => row.getAttribute("data-status") === "ACTIVE",
  ).length;
  if (countersDisplay) {
    countersDisplay.textContent = `${activeCount} ativas • ${rows.length} total`;
  }

  // Patch handleOpen to normalize ISO dates to YYYY-MM-DD after data load
  const origHandleOpen = window.handleOpen;
  window.handleOpen = (id, config) => {
    const promise =
      typeof origHandleOpen === "function"
        ? origHandleOpen(id, config)
        : Promise.resolve();

    if (config === window.APP_CONFIG?.SUBSCRIPTIONS && id) {
      Promise.resolve(promise).then(() => {
        ["subscription-start-date", "subscription-renovation-date"].forEach(
          (fieldId) => {
            const el = document.getElementById(fieldId);
            if (el?.value?.includes("T")) {
              el.value = el.value.split("T")[0];
            }
          },
        );
      });
    }
  };

  // Load students and plans: populate selects + enrich table display
  try {
    const [studentsRes, plansRes] = await Promise.all([
      fetch("/api/students"),
      fetch("/api/plans"),
    ]);

    if (studentsRes.ok) {
      const { data: students } = await studentsRes.json();
      const studentMap = Object.fromEntries(students.map((s) => [s.id, s.name]));

      const studentSelect = document.getElementById("subscription-student");
      if (studentSelect) {
        students
          .filter((s) => s.isActive)
          .forEach((s) => {
            const opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = s.name;
            studentSelect.appendChild(opt);
          });
      }

      document.querySelectorAll(".student-name[data-student-id]").forEach((el) => {
        const name = studentMap[el.dataset.studentId];
        if (name) el.textContent = name;
      });
    }

    if (plansRes.ok) {
      const { data: plans } = await plansRes.json();
      const planMap = Object.fromEntries(plans.map((p) => [p.id, p.name]));

      const planSelect = document.getElementById("subscription-plan");
      if (planSelect) {
        plans
          .filter((p) => p.isActive)
          .forEach((p) => {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = `${p.name} — R$ ${Number(p.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
            planSelect.appendChild(opt);
          });
      }

      document.querySelectorAll(".plan-name[data-plan-id]").forEach((el) => {
        const name = planMap[el.dataset.planId];
        if (name) el.textContent = name;
      });
    }
  } catch (e) {
    console.error("[Subscription] Falha ao carregar dados:", e);
  }
});
