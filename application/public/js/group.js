document.addEventListener("DOMContentLoaded", () => {
  const rows = document.querySelectorAll(".group-row");
  const countersDisplay = document.getElementById("group-counters");

  const activeCount = Array.from(rows).filter(
    (row) => row.getAttribute("data-status") === "active",
  ).length;

  if (countersDisplay) {
    countersDisplay.textContent = `${activeCount} ativas • ${rows.length} total`;
  }
});
