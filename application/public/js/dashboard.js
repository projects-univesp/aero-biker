const formatDate = () => {
  const date = new Date();
  const formmatter = new Intl.DateTimeFormat("pt-BR", {
    month: "2-digit",
    year: "numeric",
  });
  return formmatter.format(date);
};

document.addEventListener("DOMContentLoaded", () => {
  const studentRows = document.querySelectorAll(".student-row");
  const groupRows = document.querySelectorAll(".group-row");
  const planRows = document.querySelectorAll(".plan-row");
  const paymentRows = document.querySelectorAll(".payment-row");
  const dashboardCounters = document.getElementById("dashboard-counters");
  const dashboardSubtitle = document.getElementById("dashboard-subtitle");

  const activeGroupsCount = Array.from(groupRows).filter(
    (row) => row.getAttribute("data-status") === "active",
  ).length;

  const _activePlansCount = Array.from(planRows).filter(
    (row) => row.getAttribute("data-status") === "active",
  ).length;

  if (dashboardCounters) {
    dashboardCounters.textContent = `${studentRows.length} alunos * ${activeGroupsCount} turmas ativas * ${paymentRows.length} pagamentos`;
  }
  if (dashboardSubtitle) {
    dashboardSubtitle.textContent = `Visão Geral — ${formatDate()}`;
  }

  let dashboardData = {};
  const dataScript = document.getElementById("dashboard-data");
  if (dataScript) {
    try {
      dashboardData = JSON.parse(dataScript.textContent);
    } catch (e) {
      console.error("Error parsing dashboard data", e);
    }
  }

  // Chart: Alunos por Turma
  const studentsPerGroupCtx = document.getElementById("studentsPerGroupChart");
  if (studentsPerGroupCtx && typeof Chart !== "undefined") {
    const rawStudentsData = dashboardData.studentsPerGroup || [];
    const studentLabels = rawStudentsData.map((item) => item.name);
    const studentCounts = rawStudentsData.map((item) => Number(item.count));

    new Chart(studentsPerGroupCtx, {
      type: "bar",
      data: {
        labels: studentLabels.length ? studentLabels : ["Sem Turmas"],
        datasets: [
          {
            label: "Alunos",
            data: studentCounts.length ? studentCounts : [0],
            backgroundColor: "#22c55e",
            borderRadius: 4,
            barThickness: 12,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
            grid: {
              display: true,
              drawBorder: false,
            },
          },
          x: {
            grid: { display: false },
          },
        },
      },
    });
  }

  // Chart: Distribuição de Planos
  const planDistributionCtx = document.getElementById("planDistributionChart");
  if (planDistributionCtx && typeof Chart !== "undefined") {
    const rawPlanData = dashboardData.planDistribution || [];
    const planLabels = rawPlanData.map((item) => item.name);
    const planCounts = rawPlanData.map((item) => Number(item.count));

    new Chart(planDistributionCtx, {
      type: "pie",
      data: {
        labels: planLabels.length ? planLabels : ["Sem Planos"],
        datasets: [
          {
            data: planCounts.length ? planCounts : [1],
            backgroundColor: [
              "#22c55e", // Green
              "#3b82f6", // Blue
              "#eab308", // Yellow
              "#8b5cf6", // Purple
              "#f97316", // Orange
              "#ec4899", // Pink
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              padding: 20,
            },
          },
        },
      },
    });
  }
});
