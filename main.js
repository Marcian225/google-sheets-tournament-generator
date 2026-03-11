

// Entry point that adds a custom menu to the spreadsheet
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("🏆 Tournament Menu")
    .addItem("1. Generate Groups", "uiGenerateGroups")
    .addItem("2. Generate Schedules", "uiGenerateSchedules")
    .addToUi();
}

function uiGenerateGroups() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Generate Groups', 'How many groups do you want to create?', ui.ButtonSet.OK_CANCEL);
  
  if (response.getSelectedButton() == ui.Button.OK) {
    const numGroups = parseInt(response.getResponseText());
    if (isNaN(numGroups) || numGroups <= 0) {
      ui.alert('Please enter a valid number.');
      return;
    }
    
    try {
      // groupsGenerator.js exports this function
      generateTournamentGroups('Lista Zawodników', 'B3', 'Turniej', numGroups);
      SpreadsheetApp.flush();
      ui.alert(`✅ Successfully generated ${numGroups} groups!`);
    } catch (e) {
      ui.alert(`❌ Error: ${e.message}`);
    }
  }
}

function uiGenerateSchedules() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Generate Schedules', 'How many groups need schedules?', ui.ButtonSet.OK_CANCEL);
  
  if (response.getSelectedButton() == ui.Button.OK) {
    const numGroups = parseInt(response.getResponseText());
    if (isNaN(numGroups) || numGroups <= 0) return;
    
    try {
      generateSchedules(numGroups); // from scheduleGenerator.js
      SpreadsheetApp.flush();
      ui.alert(`✅ Schedules generated!`);
    } catch (e) {
      ui.alert(`❌ Error: ${e.message}`);
    }
  }
}

/**
 * Read names from a column, starting at startRow/startCol and
 * stopping when an empty cell is encountered.
 *
 * @param {Sheet} sheet          Google Sheets sheet object
 * @param {number} startRow      one‑based row index
 * @param {number} startCol      one‑based column index
 * @returns {string[]}           list of trimmed, non‑empty names
 */

function getPlayerNamesFromStartCell(sheet, startRow, startCol) {
  const maxRows = sheet.getMaxRows();
  if (startRow > maxRows) return [];
  
  const values = sheet.getRange(startRow, startCol, maxRows - startRow + 1, 1).getValues();
  const players = [];
  
  for (let i = 0; i < values.length; i++) {
    const val = values[i][0];
    if (val === null || val === undefined || val === '') break; 
    const strVal = val.toString().trim();
    if (strVal === '') break;
    players.push(strVal);
  }
  return players;
}