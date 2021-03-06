import '../css/main.scss';
import {
  getLocalUser, showPage, getClassicLeague, getH2HLeague, getPageList,
} from './fpl';

const leagueTriangles = Array.from(document.getElementsByClassName('icon-triangle-right leagues'));
const leagueTableHeader = `
  <div class="fpl-leagues-table-row fpl-leagues-table-row--header">
    <div>
      League
    </div>
    <span></span>
    <div>
      Rank
    </div>
  </div>
`;

const leagueTablePagination = `
  <div class="pagination-wrapper">
  <div class="fpl-leagues-table-pagination">
    <div class="fpl-pagination-button previous-page"><span class="icon-triangle-left"></span></div>
    <div class="fpl-pagination-button next-page"><span class="icon-triangle-right"></span></div>
  </div>
  </div>
`;

const limitPerPage = 5;
const paginationSize = 5;

function showTableRows(currentPage, leagueRows) {
  leagueRows.forEach((leagueRow) => {
    leagueRow.classList.add('hidden');
  });

  leagueRows.slice((currentPage - 1) * limitPerPage, currentPage * limitPerPage)
    .forEach((leagueRow) => {
      leagueRow.classList.remove('hidden');
    });
}

/**
 * Updates the league table's pagination by inserting new pagination buttons before the "next"
 * button.
 * @param {number} currentPage
 * @param {Array<number>} pageList
 * @param {Node} paginationElement
 */
function updatePagination(currentPage, pageList, paginationElement) {
  const paginationContainer = paginationElement.parentElement;
  const paginationButtons = paginationContainer.getElementsByClassName('fpl-pagination-button');

  // Remove all buttons apart from the "previous" and "next" buttons
  Array.from(paginationButtons).slice(1, -1).forEach((button) => {
    button.remove();
  });

  pageList.forEach((page) => {
    const paginationButton = document.createElement('div');
    paginationButton.className = 'fpl-pagination-button fpl-pagination-button--number';

    if (page === currentPage) {
      paginationButton.classList.add('active');
    }

    // If page = 0, set content to "..." and disable
    paginationButton.textContent = page || '...';
    if (paginationButton.textContent === '...') {
      paginationButton.classList.add('non-number');
    }

    // Insert all pagination buttons before the "next" button
    paginationElement.insertAdjacentElement('beforebegin', paginationButton);
  });


  // Update CSS of previous and next buttons
  const previousButton = paginationContainer.getElementsByClassName('previous-page')[0];
  previousButton.classList.remove('disabled');
  const nextButton = paginationContainer.getElementsByClassName('next-page')[0];
  nextButton.classList.remove('disabled');

  if (currentPage === 1) {
    previousButton.classList.add('disabled');
  } else if (currentPage === paginationContainer.children.length) {
    nextButton.classList.add('disabled');
  }
}

/**
 * Shows the leagues of the given table and updates the league table's pagination.
 * @param {Node} button
 * @param {number} currentPage
 */
function showLeagueElement(button, currentPage = 0) {
  const whichPage = currentPage || parseInt(button.textContent, 10);
  const leagueRows = Array.from(button.parentElement.parentElement.previousElementSibling
    .getElementsByClassName('fpl-leagues-table-row--body'));
  const numberOfLeagues = leagueRows.length;
  const totalPages = Math.ceil(numberOfLeagues / limitPerPage);

  if (whichPage < 1 || whichPage > totalPages) return;

  showTableRows(whichPage, leagueRows);

  const pageList = getPageList(totalPages, whichPage, paginationSize);
  const paginationElement = button.parentElement.lastElementChild;
  updatePagination(whichPage, pageList, paginationElement);
}

/**
 * Initialises the league table's rows and its pagination element.
 * @param {Node} leagueTable
 */
function initialiseTable(leagueTable) {
  // Show the first 5 rows of the league table
  const leagueRows = Array.from(leagueTable.getElementsByClassName('fpl-leagues-table-row--body'));
  showTableRows(1, leagueRows);

  const numberOfLeagues = leagueRows.length;
  const totalLeagues = Math.ceil(numberOfLeagues / limitPerPage);
  const pageList = getPageList(totalLeagues, 1, paginationSize);

  // Get the "next" pagination button
  const paginationElement = leagueTable.nextElementSibling.firstElementChild.lastElementChild;
  updatePagination(1, pageList, paginationElement);
}

function paginationClickHandler(event) {
  if (!event.srcElement.classList.contains('fpl-pagination-button--number')
    || event.srcElement.textContent === '...') {
    return;
  }
  showLeagueElement(event.srcElement);
}

/**
 * Shows a table of all leagues a user is participating in.
 */
function showLeagueTable() {
  if (this.classList.contains('active')) {
    this.classList.remove('active');
    this.parentElement.nextElementSibling.classList.remove('active');
    return;
  }

  // User is not participating in one of these leagues, so don't show the table
  if (this.classList.contains('triangle-disabled')) {
    return;
  }

  // Dropdown triangles
  leagueTriangles.forEach(triangle => triangle.classList.remove('active'));
  this.classList.toggle('active');

  const leagueTables = Array.from(document.getElementsByClassName('fpl-leagues-table-container'));
  leagueTables.forEach(leagueTable => leagueTable.classList.remove('active'));
  this.parentElement.nextElementSibling.classList.toggle('active');

  // Initialise private classic league table by default
  initialiseTable(this.parentElement.nextElementSibling.getElementsByClassName('fpl-leagues-table')[0]);
}

/**
 * Changes the league table's page depending on if the "previous" or "next" button is clicked.
 */
function changePage() {
  if (this.classList.contains('disabled')) return;
  const currentPage = this.parentElement.getElementsByClassName('active')[0].textContent;
  const change = this.classList.contains('previous-page') ? -1 : 1;

  showLeagueElement(this.parentElement.lastElementChild, parseInt(currentPage, 10) + change);
}

/**
 * Populates the league table with the given `leagueType` with the given leagues.
 * @param {Array<Object>} leagues
 * @param {string} leagueType
 */
function populateLeaguesTable(leagues, leagueType) {
  const leagueHeader = document.getElementById(leagueType);

  // Main container
  const leagueTableContainer = document.createElement('div');
  leagueTableContainer.className = `fpl-leagues-table-container ${leagueType === 'private-classic' ? 'active' : ''}`;

  // League table container
  const leagueTableElement = document.createElement('div');
  leagueTableElement.className = 'fpl-leagues-table';
  leagueTableElement.id = 'private-classic-league-table';
  leagueTableElement.insertAdjacentHTML('afterbegin', leagueTableHeader);

  // League table body
  const leagueTableBody = document.createElement('div');
  leagueTableBody.className = 'fpl-leagues-table-body';

  // Create each row of the table and insert into the body
  leagues.forEach((league) => {
    const leagueTableRow = document.createElement('div');

    let rankChange = '<span class="icon-triangle-up"></span>';
    if (league.entry_movement === 'down') {
      rankChange = '<span class="icon-triangle-down"></span>';
    } else if (league.entry_movement === 'same') {
      rankChange = '<span><div class="icon-circle"></div></span>';
    }

    leagueTableRow.className = 'fpl-leagues-table-row fpl-leagues-table-row--body hidden';
    leagueTableRow.insertAdjacentHTML('beforeend', `<div><a data-league-id="${league.id}" class="fpl-league-name">${league.name}</a></div>`);
    leagueTableRow.insertAdjacentHTML('beforeend', rankChange);
    leagueTableRow.insertAdjacentHTML('beforeend', `<div>${league.entry_rank}</div>`);
    leagueTableBody.insertAdjacentElement('beforeend', leagueTableRow);
  });

  // Create the entire element and insert
  leagueTableElement.insertAdjacentElement('beforeend', leagueTableBody);
  leagueTableContainer.insertAdjacentHTML('beforeend', leagueTablePagination);
  leagueTableContainer.insertAdjacentElement('afterbegin', leagueTableElement);
  leagueHeader.insertAdjacentElement('afterend', leagueTableContainer);
}

async function populateLeagues() {
  const user = await getLocalUser();

  // Private classic
  const privateClassicLeagues = user.leagues.classic.filter(league => league.league_type === 'x');
  if (privateClassicLeagues.length > 0) populateLeaguesTable(privateClassicLeagues, 'private-classic');

  // Private H2H
  const privateH2HLeagues = user.leagues.h2h.filter(league => league.league_type === 'x');
  if (privateH2HLeagues.length > 0) populateLeaguesTable(privateH2HLeagues, 'private-h2h');

  // Public H2H
  const publicH2HLeagues = user.leagues.h2h.filter(league => league.league_type === 'c');
  if (publicH2HLeagues.length > 0) populateLeaguesTable(publicH2HLeagues, 'public-h2h');

  // Global
  const globalLeagues = user.leagues.classic.filter(league => league.league_type === 's');
  if (globalLeagues.length > 0) populateLeaguesTable(globalLeagues, 'global');

  // Show private classic league table by default
  const privateClassicTable = document.getElementById('private-classic-league-table');
  initialiseTable(privateClassicTable);

  const paginationElement = document.getElementsByClassName('fpl-leagues-table-pagination')[0];
  paginationElement.addEventListener('click', event => paginationClickHandler(event));

  const previousButtons = Array.from(document.getElementsByClassName('fpl-pagination-button previous-page'));
  previousButtons.forEach(button => button.addEventListener('click', changePage));

  const nextButtons = Array.from(document.getElementsByClassName('fpl-pagination-button next-page'));
  nextButtons.forEach(button => button.addEventListener('click', changePage));
}

/**
 * Fetches and sets an individual league.
 */
async function setLeague() {
  const leagueId = this.dataset.leagueId;
  const leagueType = this.parentElement.parentElement.parentElement.parentElement.id;

  let league = {};
  if (leagueType.includes('classic') || leagueType.includes('global')) {
    league = await getClassicLeague(leagueId);
  } else {
    league = await getH2HLeague(leagueId);
  }

  chrome.storage.local.set({ currentLeague: league });
  chrome.storage.local.set({ previousPage: 'leagues-overview' });
  showPage('league-overview');
}

document.addEventListener('DOMContentLoaded', () => {
  populateLeagues();

  setTimeout(() => {
    leagueTriangles.forEach((triangle) => {
      triangle.addEventListener('click', showLeagueTable);

      // User not participating in this type of league so disable the button
      if (triangle.parentElement.nextElementSibling.classList.contains('fpl-league')) {
        triangle.classList.add('triangle-disabled');
      }
    });

    const leagueURLs = Array.from(document.getElementsByClassName('fpl-league-name'));
    leagueURLs.forEach((element) => {
      element.addEventListener('click', setLeague);
    });
  }, 100);
});
