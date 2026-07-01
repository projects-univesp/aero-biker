document.addEventListener("DOMContentLoaded", async () => {
  const rows = document.querySelectorAll(".subscription-row");
  const countersDisplay = document.getElementById("subscription-counters");
  const searchInput = document.getElementById("search-input");
  const monthFilter = document.getElementById("month-filter");
  
  // Função mestre de filtro
  function filterAndCount() {
    const term = searchInput ? searchInput.value.toLowerCase() : "";
    const selectedMonth = monthFilter ? monthFilter.value : ""; // "2026-07"
    let counts = { all: 0, PAID: 0, PENDING: 0, CANCELLED: 0 };

    rows.forEach((row) => {
      // Usamos atributos de dados (data-*) para filtrar, pois são fixos
      const studentName = row.querySelector(".student-name")?.textContent?.toLowerCase() || "";
      const status = row.getAttribute("data-status");
      
      // Captura a data da linha (assumindo que você colocou data-date na <tr>)
      const rawDate = row.getAttribute("data-date") || "";
      const rowMonth = rawDate.substring(0, 7); 

      const matchesSearch = studentName.includes(term);
      const matchesMonth = selectedMonth === "" || rowMonth === selectedMonth;

      if (matchesSearch && matchesMonth) {
        counts.all++;
        if (counts[status] !== undefined) counts[status]++;
        row.style.display = ""; // Mostra
      } else {
        row.style.display = "none"; // Esconde
      }
    });

    // Atualiza contadores
    if (countersDisplay) countersDisplay.textContent = `${counts.all} filtradas • ${rows.length} total`;
    
    // Atualiza badges dos botões
    Object.keys(counts).forEach(key => {
      const el = document.getElementById(`count-${key.toLowerCase()}`);
      if(el) el.textContent = counts[key];
    });
  }

  // Eventos
  searchInput?.addEventListener("input", filterAndCount);
  monthFilter?.addEventListener("change", filterAndCount);
  
  // Inicialização forçada após um breve delay para garantir que os nomes foram carregados
  setTimeout(filterAndCount, 500); 
});