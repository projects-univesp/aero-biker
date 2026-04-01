export function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

export function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}
window.closeModal = closeModal;
window.openModal = openModal;