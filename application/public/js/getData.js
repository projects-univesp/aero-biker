export const populateAndOpen = async (itemId, config) => {
    document.getElementById(config.id).value = '';
    if (config.fields) Object.values(config.fields).forEach(input => document.getElementById(input).value = '');
    
    if (itemId) {
        document.getElementById(config.id).value = itemId; 

        try {
            const response = await fetch(`/api/${config.path}/${itemId}`);
            const result = await response.json();
            const data = result.data;

            if (config.fields) {
                for (const [dbKey, htmlId] of Object.entries(config.fields)) {
                    if (data[dbKey] !== undefined) document.getElementById(htmlId).value = data[dbKey];
                }
            }
            if (config.checkboxes) {
                for (const [dbKey, htmlId] of Object.entries(config.checkboxes)) {
                    if (data[dbKey] !== undefined) document.getElementById(htmlId).checked = data[dbKey];
                }
            }
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            alert("Erro ao carregar os dados para edição.");
            return; 
        }
    }

    document.getElementById(config.modalId).classList.remove('hidden');
}

window.populateAndOpen = populateAndOpen;