document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const menuBtn = document.getElementById('mobile-menu-btn');

  function toggleSidebar() {
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
  }

  if (menuBtn) menuBtn.addEventListener('click', toggleSidebar);
  if (overlay) overlay.addEventListener('click', toggleSidebar);

  const currentPath = window.location.pathname;
  document.querySelectorAll('nav a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href !== '/' && currentPath.startsWith(href)) {
      link.classList.remove('text-gray-400', 'hover:bg-gray-800', 'hover:text-white');
      link.classList.add('bg-green-500', 'text-white');
    }
  });

  // ── User menu dropdown ──────────────────────────────────────────────────────
  const userBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-menu-dropdown');
  const userChevron = document.getElementById('user-menu-chevron');
  let menuOpen = false;

  function openMenu() {
    menuOpen = true;
    userDropdown.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-2');
    userDropdown.classList.add('opacity-100', 'translate-y-0');
    userChevron.style.transform = 'rotate(180deg)';
  }

  function closeMenu() {
    menuOpen = false;
    userDropdown.classList.add('opacity-0', 'pointer-events-none', 'translate-y-2');
    userDropdown.classList.remove('opacity-100', 'translate-y-0');
    userChevron.style.transform = '';
  }

  if (userBtn) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menuOpen ? closeMenu() : openMenu();
    });
  }

  document.addEventListener('click', (e) => {
    if (!menuOpen) return;
    if (!userDropdown.contains(e.target) && !userBtn.contains(e.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) closeMenu();
  });
});
