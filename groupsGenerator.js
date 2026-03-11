// Randomly distribute a list of player names into a specified number
// of groups and write each group into separate columns on the
// “Turniej” sheet.  Input list is read from another sheet.

function generateTournamentGroups(inputSheetName, inputRange, outputSheetName, numberOfGroups) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inputSheet = ss.getSheetByName(inputSheetName);
  const outputSheet = ss.getSheetByName(outputSheetName);

  if (!inputSheet || !outputSheet) throw new Error("Sheets not found.");

  // Parse start cell (e.g., "B3") to coordinates
  const startRange = inputSheet.getRange(inputRange);
  const playerNames = getPlayerNamesFromStartCell(inputSheet, startRange.getRow(), startRange.getColumn());
  
  if (playerNames.length < numberOfGroups) throw new Error("Not enough players for this many groups.");

  // remove duplicates just in case, then shuffle with Fisher‑Yates
  const shuffled = [...new Set(playerNames)];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // distribute names round‑robin into the requested number of groups
  const groups = Array.from({length: numberOfGroups}, () => []);
  shuffled.forEach((name, i) => groups[i % numberOfGroups].push(name));

  const BASE_ROW = 3; 
  const BASE_COL = 3;   // Col C
  const COL_OFFSET = 7; // gap between groups

  groups.forEach((group, i) => {
    const col = BASE_COL + (i * COL_OFFSET);
    
    // clear any existing names before writing the new group
    const existingPlayers = getPlayerNamesFromStartCell(outputSheet, BASE_ROW, col);
    if (existingPlayers.length > 0) {
      outputSheet.getRange(BASE_ROW, col, existingPlayers.length, 1).clearContent();
    }
    
    if (group.length > 0) {
      const vals = group.map(p => [p]);
      outputSheet.getRange(BASE_ROW, col, group.length, 1).setValues(vals);
    }
  });
}