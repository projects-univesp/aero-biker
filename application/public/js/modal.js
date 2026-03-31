export function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

window.closeModal = closeModal;