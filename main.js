
function onOpen(){
  var ui = SpreadsheetApp.getUi()
  ui.createMenu("Tests")
    .addItem("Generate Groups2", "generate2Groups")
    .addItem("Generate Groups4", "generate4Groups")
    .addItem("Generate Schedule2", "generateSchedules2")
    .addItem("Generate Schedule4", "generateSchedules4")
    .addToUi()
}

function generate2Groups(){
  testTournamentGroups(2);
}

function generate4Groups(){
  testTournamentGroups(4);
}

function generateSchedules2(){
  generateSchedules(2);
}

function generateSchedules4(){
  generateSchedules(4);
}

function makeLogs(){
  console.log("HALO")
  logPlayers()
}

function getSingleDebil(){
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("debil")
  let value = sheet.getRange(1,1).getValue()
}

function logDataRange() {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("debil")
  let range = sheet.getRange(2,2,5)
  let data = range.getValues()
  Logger.log(data)

  for (let i = 0 ; i < data.length; i++){
    data[i] = data[i]*2
    // Logger.log(data[i])
  }
  Logger.log(data)
}
