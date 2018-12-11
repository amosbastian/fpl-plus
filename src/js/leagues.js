import '../css/main.scss';

const leagueTriangles = Array.from(document.getElementsByClassName('icon-triangle-right leagues'));
const leagueTables = Array.from(document.getElementsByClassName('fpl-league-table-container'));

function back() {
  chrome.browserAction.setPopup({ popup: 'index.html' });
  window.location.href = 'index.html';
}

/**
 * Returns an array of maxLength (or less) page numbers where a 0 in the returned array denotes a
 * gap in the series.
 *
 * Idea taken from: https://stackoverflow.com/a/46385144/4255859
 * @param {number} totalLeagues
 * @param {number} page
 * @param {number} maxLength
 */
function getPageList(totalLeagues, page, maxLength) {
  function range(start, end) {
    return Array.from(Array(end - start + 1), (_, i) => i + start);
  }

  const sideWidth = maxLength < 9 ? 1 : 2;
  const leftWidth = (maxLength - sideWidth * 2 - 3) >> 1;
  const rightWidth = (maxLength - sideWidth * 2 - 2) >> 1;

  // No ...
  if (totalLeagues <= maxLength) {
    return range(1, totalLeagues);
  }
  // No ... on left side
  if (page <= maxLength - sideWidth - 1 - rightWidth) {
    return range(1, maxLength - sideWidth - 1)
      .concat([0])
      .concat(range(totalLeagues - sideWidth + 1, totalLeagues));
  }
  // No ... on right side
  if (page >= totalLeagues - sideWidth - 1 - rightWidth) {
    return range(1, sideWidth)
      .concat([0])
      .concat(range(totalLeagues - sideWidth - 1 - rightWidth - leftWidth, totalLeagues));
  }
  // ... on both sides
  return range(1, sideWidth)
    .concat([0])
    .concat(range(page - leftWidth, page + rightWidth))
    .concat([0])
    .concat(range(totalLeagues - sideWidth + 1, totalLeagues));
}
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
function showPage(button, currentPage = 0) {
  const whichPage = currentPage || parseInt(button.textContent, 10);
  const leagueRows = Array.from(button.parentElement.parentElement.previousElementSibling
    .getElementsByClassName('fpl-league-table-row--body'));
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
  const leagueRows = Array.from(leagueTable.getElementsByClassName('fpl-league-table-row--body'));
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
  showPage(event.srcElement);
}

function showLeagueTable() {
  if (this.classList.contains('active')) {
    this.classList.remove('active');
    this.parentElement.nextElementSibling.classList.remove('active');
    return;
  }

  // Dropdown triangles
  leagueTriangles.forEach(triangle => triangle.classList.remove('active'));
  this.classList.toggle('active');

  leagueTables.forEach(leagueTable => leagueTable.classList.remove('active'));
  this.parentElement.nextElementSibling.classList.toggle('active');

  // Initialise private classic league table by default
  initialiseTable(this.parentElement.nextElementSibling.getElementsByClassName('fpl-league-table')[0]);
}

/**
 * Changes the league table's page depending on if the "previous" or "next" button is clicked.
 */
function changePage() {
  if (this.classList.contains('disabled')) return;
  const currentPage = this.parentElement.getElementsByClassName('active')[0].textContent;
  const change = this.classList.contains('previous-page') ? -1 : 1;

  showPage(this.parentElement.lastElementChild, parseInt(currentPage, 10) + change);
}


document.addEventListener('DOMContentLoaded', () => {
  const backButton = document.getElementById('back');
  backButton.addEventListener('click', back);

  leagueTriangles.forEach(triangle => triangle.addEventListener('click', showLeagueTable));

  const privateClassicTable = document.getElementById('private-classic');
  initialiseTable(privateClassicTable);

  const paginationElement = document.getElementsByClassName('fpl-league-table-pagination')[0];
  paginationElement.addEventListener('click', event => paginationClickHandler(event));

  const previousButtons = Array.from(document.getElementsByClassName('fpl-pagination-button previous-page'));
  previousButtons.forEach(button => button.addEventListener('click', changePage));

  const nextButtons = Array.from(document.getElementsByClassName('fpl-pagination-button next-page'));
  nextButtons.forEach(button => button.addEventListener('click', changePage));
});