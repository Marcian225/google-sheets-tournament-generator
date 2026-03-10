var playersToCellMap = new Map()

function logPlayers(){
  console.log(playersToCellMap)
}

function generateTournamentGroupsAdvanced(inputSheetName, inputRange, outputSheetName, outputRanges, numberOfGroups) {

  if (!inputSheetName || !inputRange || !outputSheetName || !outputRanges || !numberOfGroups) {
    throw new Error('All parameters are required: inputSheetName, inputRange, outputSheetName, outputRanges, numberOfGroups');
  }
  

  if (typeof inputSheetName !== 'string') {
    throw new Error('inputSheetName must be a string');
  }
  
  if (typeof inputRange !== 'string') {
    throw new Error('inputRange must be a string (starting cell like "A2")');
  }
  
  if (typeof outputSheetName !== 'string') {
    throw new Error('outputSheetName must be a string');
  }
  
  if (!Array.isArray(outputRanges)) {
    throw new Error('outputRanges must be an array of strings');
  }
  
  if (!Number.isInteger(numberOfGroups) || numberOfGroups <= 0) {
    throw new Error('numberOfGroups must be a positive integer');
  }
  

  if (outputRanges.length !== numberOfGroups) {
    throw new Error(`Number of output ranges (${outputRanges.length}) must match numberOfGroups (${numberOfGroups})`);
  }
  
  const singleCellPattern = /^[A-Z]+\d+$/;
  if (!singleCellPattern.test(inputRange)) {
    throw new Error(`Invalid input range format: "${inputRange}". Expected single cell format like "A2", "B5", etc.`);
  }
  
  const rangePattern = /^[A-Z]+\d+$/;
  for (let i = 0; i < outputRanges.length; i++) {
    if (typeof outputRanges[i] !== 'string') {
      throw new Error(`Output range at index ${i} must be a string`);
    }
    if (!rangePattern.test(outputRanges[i])) {
      throw new Error(`Invalid output range format at index ${i}: "${outputRanges[i]}". Expected format: "A1", "B5", etc.`);
    }
  }
  


  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('No active spreadsheet found');
  }
  
  const inputSheet = spreadsheet.getSheetByName(inputSheetName);
  if (!inputSheet) {
    throw new Error(`Input sheet "${inputSheetName}" not found`);
  }

  let inputRangeObj;
  try {
    const startCell = inputSheet.getRange(inputRange);
    const startRow = startCell.getRow();
    const startCol = startCell.getColumn();
    
    console.log(`Starting from cell: ${inputRange} (Row: ${startRow}, Column: ${startCol})`);

    let currentRow = startRow;
    let lastNonEmptyRow = startRow - 1; 
    
    const columnLetter = String.fromCharCode(64 + startCol); // A=65, so 64+1=A
  
    while (true) {
      const currentCell = inputSheet.getRange(currentRow, startCol);
      const cellValue = currentCell.getValue();
      
      if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
        const stringValue = cellValue.toString().trim();
        if (stringValue.length > 0) {
          lastNonEmptyRow = currentRow;
          console.log(`Found player at ${columnLetter}${currentRow}: "${stringValue}"`);
          currentRow++;
        } else {
          console.log(`Empty cell found at ${columnLetter}${currentRow} (after trimming)`);
          break;
        }
      } else {
        console.log(`Empty cell found at ${columnLetter}${currentRow}`);
        break;
      }
      
      if (currentRow > startRow + 1000) {
        console.warn(`Stopped scanning at row ${currentRow} (safety limit reached)`);
        break;
      }
    }
    
    if (lastNonEmptyRow < startRow) {
      throw new Error(`No data found starting from cell "${inputRange}"`);
    }
    
    const dynamicRange = `${columnLetter}${startRow}:${columnLetter}${lastNonEmptyRow}`;
    inputRangeObj = inputSheet.getRange(dynamicRange);
    
    console.log(`Dynamic range detected: ${dynamicRange} (${lastNonEmptyRow - startRow + 1} cells)`);
    
  } catch (error) {
    throw new Error(`Invalid input range "${inputRange}" or error detecting range: ${error.message}`);
  }
  
  let outputSheet = spreadsheet.getSheetByName(outputSheetName);
  if (!outputSheet) {
    try {
      outputSheet = spreadsheet.insertSheet(outputSheetName);
      console.log(`Created new sheet: "${outputSheetName}"`);
    } catch (error) {
      throw new Error(`Failed to create output sheet "${outputSheetName}": ${error.message}`);
    }
  }
  
  for (let i = 0; i < outputRanges.length; i++) {
    try {
      outputSheet.getRange(outputRanges[i]);
    } catch (error) {
      throw new Error(`Invalid output range "${outputRanges[i]}" for group ${i + 1}: ${error.message}`);
    }
  }
  
  //  DATA EXTRACTION AND VALIDATION 
  
  let playerNames;
  try {
    const inputData = inputRangeObj.getValues();
    playerNames = inputData
      .flat()
      .filter(name => name !== '' && name !== null && name !== undefined)
      .map(name => name.toString().trim())
      .filter(name => name.length > 0); 
  } catch (error) {
    throw new Error(`Failed to read data from input range: ${error.message}`);
  }
  
  if (playerNames.length === 0) {
    throw new Error(`No player names found starting from cell "${inputRange}" in sheet "${inputSheetName}"`);
  }
  
  if (playerNames.length < numberOfGroups) {
    throw new Error(`Not enough players (${playerNames.length}) for ${numberOfGroups} groups. Need at least ${numberOfGroups} players.`);
  }
  
  const uniqueNames = [...new Set(playerNames)];
  if (uniqueNames.length !== playerNames.length) {
    const duplicates = playerNames.filter((name, index) => playerNames.indexOf(name) !== index);
    console.warn(`Warning: Found duplicate player names: ${[...new Set(duplicates)].join(', ')}`);
  }
  
  console.log(`Processing ${playerNames.length} players into ${numberOfGroups} groups`);
  
  //  GROUP GENERATION 

  const shuffledPlayers = [...playerNames];
  for (let i = shuffledPlayers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
  }

  const groups = Array.from({length: numberOfGroups}, () => []);
  shuffledPlayers.forEach((player, index) => {
    const groupIndex = index % numberOfGroups;
    groups[groupIndex].push(player);
  });
  
  //  OUTPUT TO SHEET 
  try {
    const maxGroupSize = Math.max(...groups.map(group => group.length));
    
    groups.forEach((group, groupIndex) => {
      const startCell = outputRanges[groupIndex];
      const range = outputSheet.getRange(startCell);
      const startRow = range.getRow();
      const startCol = range.getColumn();
      
      const clearRange = outputSheet.getRange(startRow, startCol, maxGroupSize, 1);
      clearRange.clearContent();
      

      group.forEach((player, playerIndex) => {
        playersToCellMap[player]=[startRow+playerIndex, startCol]
        const playerCell = outputSheet.getRange(startRow + playerIndex, startCol);
        playerCell.setValue(player);
        playerCell.setFontWeight('normal');
        playerCell.setBackground('white');
      });
      console.log("PlayerToCellMap: ", playersToCellMap)
      console.log(`Group ${String.fromCharCode(65 + groupIndex)}: ${group.length} players assigned to ${startCell}`);
    });
    
  } catch (error) {
    throw new Error(`Failed to write groups to output sheet: ${error.message}`);
  }
  

  
  console.log('=== TOURNAMENT GROUPS GENERATED SUCCESSFULLY ===');
  console.log(`Input: ${playerNames.length} players from "${inputSheetName}!${inputRange}"`);
  console.log(`Output: ${numberOfGroups} groups written to "${outputSheetName}"`);
  groups.forEach((group, index) => {
    console.log(`Group ${String.fromCharCode(65 + index)}: ${group.join(', ')}`);
  });
  
  return groups;
}


function testTournamentGroups(halo) {

  var starting_cells ;
  var size = 4

  if (halo == 2) {
    starting_cells =  ['C3', 'J3'];
    size = 2
  }
  else starting_cells =  ['C3', 'J3', 'Q3', 'X3'];


  try {
    const groups = generateTournamentGroupsAdvanced(
      'Lista Zawodników', // Input sheet
      'B3',               // Starting cell
      'Turniej',          // Output sheet
      starting_cells,     // Starting cells for each group
      size                // Number of groups
    );
    
    console.log('Test completed successfully!');
    console.log('Generated groups:', groups);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}