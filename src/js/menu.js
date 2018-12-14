import { updateData } from './background';
import { showPage, getCurrentPage } from './fpl';

function toggleMenuStyle() {
  const menuIcon = document.getElementById('fpl-menu');
  menuIcon.classList.toggle('icon-menu');
  menuIcon.classList.toggle('icon-cross');

  const menu = document.getElementById('fpl-menu-list');
  menu.classList.toggle('menu-hidden');
}

async function toggleMenu() {
  const currentPage = await getCurrentPage();
  if (currentPage === 'login-overview' || currentPage === 'features-overview') {
    return;
  }

  toggleMenuStyle();
}

function logout() {
  chrome.storage.local.set({ loggedIn: false }, () => {
    showPage('login-overview');
  });
  toggleMenuStyle();
}

function refreshData() {
  updateData();
  toggleMenu();
}

document.addEventListener('DOMContentLoaded', () => {
  const menuIcon = document.getElementById('fpl-menu');
  menuIcon.addEventListener('click', toggleMenu);

  const logoutButton = document.getElementById('logout');
  logoutButton.addEventListener('click', logout);

  const refreshDataButton = document.getElementById('refresh-data');
  refreshDataButton.addEventListener('click', refreshData);
});
