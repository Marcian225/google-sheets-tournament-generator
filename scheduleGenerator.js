
function generateMatchSchedule(sheetName, startingCell, outputCell) {
  //  INPUT VALIDATION 
  
  if (!sheetName || !startingCell || !outputCell) {
    throw new Error('All parameters are required: sheetName, startingCell, outputCell');
  }
  
  if (typeof sheetName !== 'string') {
    throw new Error('sheetName must be a string');
  }
  
  if (typeof startingCell !== 'string') {
    throw new Error('startingCell must be a string');
  }
  
  if (typeof outputCell !== 'string') {
    throw new Error('outputCell must be a string');
  }
  
  const cellPattern = /^[A-Z]+\d+$/;
  if (!cellPattern.test(startingCell)) {
    throw new Error(`Invalid startingCell format: "${startingCell}". Expected format like "A2", "B5", etc.`);
  }
  
  if (!cellPattern.test(outputCell)) {
    throw new Error(`Invalid outputCell format: "${outputCell}". Expected format like "D1", "E3", etc.`);
  }
  
  //  GET SPECIFIED SHEET 
  
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('No active spreadsheet found');
  }
  
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }
  
  //  READ NAMES FROM STARTING CELL 
  
  let playerNames;
  try {
    const startCell = sheet.getRange(startingCell);
    const startRow = startCell.getRow();
    const startCol = startCell.getColumn();
    
    console.log(`Starting from cell: ${startingCell} in sheet "${sheetName}" (Row: ${startRow}, Column: ${startCol})`);
    
    let currentRow = startRow;
    let lastNonEmptyRow = startRow - 1;
    
    const columnLetter = String.fromCharCode(64 + startCol);
    
    while (true) {
      const currentCell = sheet.getRange(currentRow, startCol);
      const cellValue = currentCell.getValue();
      
      if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
        const stringValue = cellValue.toString().trim();
        if (stringValue.length > 0) {
          lastNonEmptyRow = currentRow;
          console.log(`Found player at ${sheetName}!${columnLetter}${currentRow}: "${stringValue}"`);
          currentRow++;
        } else {
          console.log(`Empty cell found at ${sheetName}!${columnLetter}${currentRow} (after trimming)`);
          break;
        }
      } else {
        console.log(`Empty cell found at ${sheetName}!${columnLetter}${currentRow}`);
        break;
      }
      
      if (currentRow > startRow + 100) {
        console.warn(`Stopped scanning at row ${currentRow} (safety limit reached)`);
        break;
      }
    }
    
    if (lastNonEmptyRow < startRow) {
      throw new Error(`No player names found starting from cell "${startingCell}" in sheet "${sheetName}"`);
    }
    
    const dynamicRange = `${columnLetter}${startRow}:${columnLetter}${lastNonEmptyRow}`;
    const rangeObj = sheet.getRange(dynamicRange);
    
    console.log(`Dynamic range detected: ${sheetName}!${dynamicRange} (${lastNonEmptyRow - startRow + 1} cells)`);
    
    const data = rangeObj.getValues();
    playerNames = data
      .flat()
      .filter(name => name !== '' && name !== null && name !== undefined)
      .map(name => name.toString().trim())
      .filter(name => name.length > 0);
    
  } catch (error) {
    throw new Error(`Error reading player names from sheet "${sheetName}": ${error.message}`);
  }
  
  //  VALIDATE PLAYERS 
  
  if (playerNames.length === 0) {
    throw new Error(`No valid player names found starting from "${startingCell}" in sheet "${sheetName}"`);
  }
  
  if (playerNames.length < 2) {
    throw new Error(`Need at least 2 players for matches. Found only ${playerNames.length} player(s).`);
  }

  const uniqueNames = [...new Set(playerNames)];
  if (uniqueNames.length !== playerNames.length) {
    const duplicates = playerNames.filter((name, index) => playerNames.indexOf(name) !== index);
    console.warn(`Warning: Found duplicate player names: ${[...new Set(duplicates)].join(', ')}`);
    playerNames = uniqueNames; 
  }
  
  console.log(`Successfully read ${playerNames.length} players: ${playerNames.join(', ')}`);
  
  //  GENERATE MATCH SCHEDULE 
  
  const matches = [];
  let matchNumber = 1;
  
  const allMatches = [];
  for (let i = 0; i < playerNames.length; i++) {
    for (let j = i + 1; j < playerNames.length; j++) {
      allMatches.push([playerNames[i], playerNames[j]]);
    }
  }
  
  console.log(`Total matches needed: ${allMatches.length} for ${playerNames.length} players`);
  
  //  OPTIMIZE MATCH ORDER TO MINIMIZE CONSECUTIVE GAMES 
  
  const optimizedMatches = [];
  const remainingMatches = [...allMatches];
  const lastMatchForPlayer = {}; 
  
  while (remainingMatches.length > 0) {
    let bestMatchIndex = -1;
    let bestScore = -1;
    let foundPerfectMatch = false;
    
    for (let i = 0; i < remainingMatches.length; i++) {
      const [player1, player2] = remainingMatches[i];
      
      const player1LastMatch = lastMatchForPlayer[player1];
      const player2LastMatch = lastMatchForPlayer[player2];
      const currentMatchNumber = optimizedMatches.length;
      
      const player1HasRest = player1LastMatch === undefined || (currentMatchNumber - player1LastMatch) >= 2;
      const player2HasRest = player2LastMatch === undefined || (currentMatchNumber - player2LastMatch) >= 2;
      
      if (player1HasRest && player2HasRest) {
        bestMatchIndex = i;
        foundPerfectMatch = true;
        break;
      }

      const timeSincePlayer1 = player1LastMatch === undefined ? 100 : (currentMatchNumber - player1LastMatch);
      const timeSincePlayer2 = player2LastMatch === undefined ? 100 : (currentMatchNumber - player2LastMatch);

      const score = Math.min(timeSincePlayer1, timeSincePlayer2);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatchIndex = i;
      }
    }
    
    if (bestMatchIndex >= 0) {
      const selectedMatch = remainingMatches[bestMatchIndex];
      const [player1, player2] = selectedMatch;
      
      optimizedMatches.push([matchNumber, player1, player2]);
      
      lastMatchForPlayer[player1] = optimizedMatches.length - 1;
      lastMatchForPlayer[player2] = optimizedMatches.length - 1;
      
      remainingMatches.splice(bestMatchIndex, 1);
      
      if (foundPerfectMatch) {
        console.log(`Match ${matchNumber}: ${player1} vs ${player2} (perfect - no recent games)`);
      } else {
        console.log(`Match ${matchNumber}: ${player1} vs ${player2} (best available)`);
      }
      
      matchNumber++;
    } else {
      console.error('No match found - this should not happen');
      break;
    }
  }
  
  console.log(`Generated optimized schedule with ${optimizedMatches.length} matches`);
  

  const consecutiveGamesCount = {};
  playerNames.forEach(player => consecutiveGamesCount[player] = 0);
  
  for (let i = 1; i < optimizedMatches.length; i++) {
    const currentMatch = optimizedMatches[i];
    const previousMatch = optimizedMatches[i - 1];
    
    const currentPlayers = [currentMatch[1], currentMatch[2]];
    const previousPlayers = [previousMatch[1], previousMatch[2]];
    
    currentPlayers.forEach(player => {
      if (previousPlayers.includes(player)) {
        consecutiveGamesCount[player]++;
      }
    });
  }
  
  const totalConsecutiveGames = Object.values(consecutiveGamesCount).reduce((sum, count) => sum + count, 0);
  console.log(`Schedule quality: ${totalConsecutiveGames} total consecutive games`);
  console.log('Consecutive games per player:', consecutiveGamesCount);
  
  //  WRITE MATCHES TO SHEET 
  
  try {
    const outputRange = sheet.getRange(outputCell);
    const outputRow = outputRange.getRow();
    const outputCol = outputRange.getColumn();
    
    console.log(`Writing matches starting at ${sheetName}!${outputCell} (Row: ${outputRow}, Column: ${outputCol})`);
    
    for (let i = 0; i < optimizedMatches.length; i++) {
      const match = optimizedMatches[i];
      const currentRow = outputRow + i;
      
      sheet.getRange(currentRow, outputCol).setValue(match[0]);
      
      sheet.getRange(currentRow, outputCol + 1).setValue(match[1]);
      
      sheet.getRange(currentRow, outputCol + 2).setValue(match[2]);
      
      console.log(`Match ${match[0]}: ${match[1]} vs ${match[2]} written to row ${currentRow}`);
    }
    
    console.log(`Successfully wrote ${optimizedMatches.length} matches to ${sheetName}!${outputCell}`);
    
  } catch (error) {
    throw new Error(`Error writing matches to sheet: ${error.message}`);
  }
  
  return optimizedMatches;
}


function testMatchSchedule() {
  try {
    const matches = generateMatchSchedule('Turniej', 'C3', 'B12'); 
    console.log('Test successful!');
    console.log('Generated matches:', matches);
    return matches;
  } catch (error) {
    console.error('Test failed:', error.message);
    return null;
  }
}



function generateSchedules(groupSize) {

  var testCases = [];
  

  if (groupSize !== 2 && groupSize !== 4) {
    throw new Error('Unsupported groupSize. Use 2 or 4.');
  }

  if (groupSize === 2) {
      testCases = [
      { group: 'C3', output: 'B12' },
      { group: 'J3', output: 'I12' },
      ];
    } else if (groupSize === 4) {
      testCases = [
      { group: 'C3', output: 'B12' },
      { group: 'J3', output: 'I12' },
      { group: 'Q3', output: 'P12' },
      { group: 'X3', output: 'W12' }
      ];
    }

  const allResults = [];
  
  testCases.forEach((testCase, index) => {
    try {
      const matches = generateMatchSchedule('Turniej', testCase.group, testCase.output);
      console.log(`Test ${index + 1} successful!`);
      console.log(`Generated matches for ${testCase.group}:`, matches);
      allResults.push({
        group: testCase.group,
        output: testCase.output,
        matches: matches,
        success: true
      });
    } catch (error) {
      console.error(`Test ${index + 1} failed:`, error.message);
      allResults.push({
        group: testCase.group,
        output: testCase.output,
        matches: null,
        success: false,
        error: error.message
      });
    }
  });
  
  return allResults;
}
