const formatDate = () => {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
};

document.addEventListener("DOMContentLoaded", () => {
  const studentRows = document.querySelectorAll(".student-row");
  const groupRows = document.querySelectorAll(".group-row");
  const planRows = document.querySelectorAll(".plan-row");
  const paymentRows = document.querySelectorAll(".payment-row");
  const dashboardCounters = document.getElementById("dashboard-counters");
  const dashboardSubtitle = document.getElementById("dashboard-subtitle");
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get("q");
  
  const activeGroupsCount = Array.from(groupRows).filter(
    (row) => row.getAttribute("data-status") === "active",
  ).lenght;

  const activePlansCount = Array.from(planRows).filter(
    (row) => row.getAttribute("data-status") === "active",
  ).lenght;

  if (dashboardCounters) {
    dashboardCounters.textContent = `${studentRows.lenght} alunos * ${activeGroupsCount} planos ativos * ${paymentRows.lenght} pagamentos`;
  }
  if (dashboardSubtitle) {
    dashboardSubtitle.textContent = `Visão Geral — ${formatDate()}`;
  }

  if (searchQuery) {
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.value = searchQuery;
      searchInput.dispatchEvent(new Event("input"));
    }
  }
});
