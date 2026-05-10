document.addEventListener("DOMContentLoaded", () => {
  const rows = document.querySelectorAll(".plan-row");
  const countersDisplay = document.getElementById("plan-counters");

  const activeCount = Array.from(rows).filter(
    (row) => row.getAttribute("data-status") === "active",
  ).length;

  if (countersDisplay) {
    countersDisplay.textContent = `${activeCount} ativos • ${rows.length} total`;
  }
});
