document.addEventListener("DOMContentLoaded", async () => {
  const rows = document.querySelectorAll(".schedule-row");
  const countersDisplay = document.getElementById("schedule-counters");

  if (countersDisplay) {
    const total = rows.length;
    countersDisplay.textContent = `${total} aula${total !== 1 ? "s" : ""} cadastrada${total !== 1 ? "s" : ""}`;
  }

  try {
    const res = await fetch("/api/groups");
    if (!res.ok) return;
    const { data: groups } = await res.json();
    const groupSelect = document.getElementById("schedule-group");
    if (groupSelect && Array.isArray(groups)) {
      groups
        .filter((g) => g.isActive)
        .forEach((g) => {
          const opt = document.createElement("option");
          opt.value = g.id;
          opt.textContent = g.name;
          groupSelect.appendChild(opt);
        });
    }
  } catch (e) {
    console.error("[Schedule] Falha ao carregar turmas:", e);
  }
});
