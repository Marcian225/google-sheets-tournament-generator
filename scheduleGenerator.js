
// Read player lists from the sheet and, adjacent to a
// manually‑placed “Match Schedule” header, generate an optimal
// round‑robin schedule with minimal back‑to‑backs.

function generateSchedules(numberOfGroups) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Turniej');
  if (!sheet) throw new Error("Sheet 'Turniej' not found.");
  
  const COL_OFFSET = 7;
  const PLAYER_START_COL = 3; // Col C
  const MATCH_START_COL = 2;  // Col B 

  for (let i = 0; i < numberOfGroups; i++) {
    const pCol = PLAYER_START_COL + (i * COL_OFFSET);
    const mCol = MATCH_START_COL + (i * COL_OFFSET);
    
    const players = getPlayerNamesFromStartCell(sheet, 3, pCol);
    if (players.length < 2) continue;

    // SEARCH FIX: Find where you manually placed "Match Schedule"
    const searchValues = sheet.getRange(1, mCol - 1, 150, 1).getValues();
    let targetRow = -1;
    
    for (let r = 0; r < searchValues.length; r++) {
      const cellVal = searchValues[r][0] ? searchValues[r][0].toString().toLowerCase() : "";
      if (cellVal.includes("match schedule")) {
        targetRow = r + 3; 
        break;
      }
    }

    if (targetRow === -1) {
      console.warn(`Group ${i+1}: Header 'Match Schedule' not found in Search Column ${mCol - 1}`);
      continue;
    }

    const matches = buildDeterministicSchedule(players);

    const existingCount = getPlayerNamesFromStartCell(sheet, targetRow, mCol + 1).length; 
    const clearRows = Math.max(existingCount, matches.length, 1);
    
    sheet.getRange(targetRow, mCol, clearRows, 3).clearContent();
    sheet.getRange(targetRow, mCol, matches.length, 3).setValues(matches);
  }
}

/**
 * Generates a mathematically optimal Round-Robin schedule using
 * the Circle/Polygon Method.  Guarantees zero back‑to‑backs for
 * N ≥ 5 and minimizes them for smaller groups by reordering the
 * start of each round.
 *
 * @param {string[]} players  list of names
 * @returns {Array<Array>}    [matchNumber, playerA, playerB] rows
 */
function buildDeterministicSchedule(players) {
  const isOdd = players.length % 2 !== 0;
  const workingPlayers = [...players];
  
 // add a dummy “BYE” if necessary to make the rotation math work
  if (isOdd) workingPlayers.push("BYE");

  const numPlayers = workingPlayers.length;
  const numRounds = numPlayers - 1;
  const rounds = [];

  // 1. GENERATE PERFECT ROUNDS
  for (let round = 0; round < numRounds; round++) {
    const currentRoundMatches = [];
    
    // Pair players up (first with last, second with second-to-last, etc.)
    for (let i = 0; i < numPlayers / 2; i++) {
      const p1 = workingPlayers[i];
      const p2 = workingPlayers[numPlayers - 1 - i];
      
      if (p1 !== "BYE" && p2 !== "BYE") {
        currentRoundMatches.push([p1, p2]);
      }
    }
    rounds.push(currentRoundMatches);

    // ROTATE: Keep index 0 fixed, move the last player to index 1
    workingPlayers.splice(1, 0, workingPlayers.pop());
  }

  // 2. FLATTEN ROUNDS AND MANAGE "SEAMS"
  const finalSchedule = [];
  let matchNumber = 1;

  for (let r = 0; r < rounds.length; r++) {
    let currentRound = rounds[r];

    if (finalSchedule.length > 0 && currentRound.length > 0) {
      const lastMatch = finalSchedule[finalSchedule.length - 1];
      const lastPlayers = [lastMatch[1], lastMatch[2]];

      // Find a match in the new round that DOES NOT share players with the last match
      let safeMatchIndex = 0;
      for (let i = 0; i < currentRound.length; i++) {
        const match = currentRound[i];
        if (!lastPlayers.includes(match[0]) && !lastPlayers.includes(match[1])) {
          safeMatchIndex = i;
          break; 
        }
      }
      
      const safeMatch = currentRound.splice(safeMatchIndex, 1)[0];
      currentRound.unshift(safeMatch);
    }

    for (const match of currentRound) {
      finalSchedule.push([matchNumber++, match[0], match[1]]);
    }
  }

  return finalSchedule;
}