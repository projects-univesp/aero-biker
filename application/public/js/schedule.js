document.addEventListener("DOMContentLoaded", () => {
  const rows = document.querySelectorAll(".schedule-row");
  const countersDisplay = document.getElementById("schedule-counters");

  if (countersDisplay) {
    const total = rows.length;
    countersDisplay.textContent = `${total} aula${total !== 1 ? "s" : ""} cadastrada${total !== 1 ? "s" : ""}`;
  }

  // Usamos o dado que já está na janela (injetado pelo HBS)
  const groupSelect = document.getElementById("schedule-group");
  const daySelect = document.getElementById("schedule-day");
  const groups = window.APP_GROUPS || [];

  if (groupSelect && Array.isArray(groups)) {
    // Preenche o select de turmas
    groups
      .filter((g) => g.isActive)
      .forEach((g) => {
        const opt = document.createElement("option");
        opt.value = g.id;
        opt.textContent = g.name;
        groupSelect.appendChild(opt);
      });

    // Evento de filtro
    groupSelect.addEventListener("change", (e) => {
      const selectedId = e.target.value;
      const selectedGroup = groups.find((g) => g.id === selectedId);
      
      const allowedDays = selectedGroup ? selectedGroup.daysOfWeek.split(",") : [];

      Array.from(daySelect.options).forEach((option) => {
        if (option.value === "") return; 
        
        const isAllowed = allowedDays.includes(option.value);
        option.style.display = isAllowed ? "block" : "none";
        option.disabled = !isAllowed;
      });

      if (daySelect.value !== "" && !allowedDays.includes(daySelect.value)) {
        daySelect.value = "";
      }
    });
  }
});