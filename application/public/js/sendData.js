// (POST) or (PATCH)
import { closeModal } from "./modal.js";

export const handleSubmit = async (event, config) => {
    event.preventDefault(); 
    
    const idElement = document.getElementById(config.id);
    const id = idElement ? idElement.value : '';

    const payload = {};

    if (config.fields) {
        for (const [apiKey, elementId] of Object.entries(config.fields)) {
            const el = document.getElementById(elementId);
            if (el) payload[apiKey] = el.value;
        }
    }

    if (config.checkboxes) {
        for (const [apiKey, elementId] of Object.entries(config.checkboxes)) {
            const el = document.getElementById(elementId);
            if (el) payload[apiKey] = el.checked;
        }
    }

    const method = id ? 'PATCH' : 'POST';
    const url = id ? `/api/${config.path}/${id}` : `/api/${config.path}`;

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            if (config.modalId && typeof closeModal === 'function') {
                closeModal(config.modalId);
            }
            window.location.reload(); 
        } else {
            const errorData = await response.json();
            alert(`Erro: ${errorData.message || 'Não foi possível salvar os dados.'}`);
        }
    } catch (error) {
        console.error("Erro na comunicação com a API:", error);
        alert("Erro crítico ao tentar comunicar com o servidor.");
    }
}

// (DELETE)
export const handleDelete = async (id, path) => {

    try {
        const response = await fetch(`/api/${path}/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            window.location.reload();
        } else {
            const errorData = await response.json();
            alert(`Erro ao excluir: ${errorData.message || 'Falha na operação.'}`);
        }
    } catch (error) {
        console.error("Erro na comunicação com a API:", error);
        alert("Erro crítico ao tentar comunicar com o servidor.");
    }
}

window.handleSubmit = handleSubmit;
window.handleDelete = handleDelete;