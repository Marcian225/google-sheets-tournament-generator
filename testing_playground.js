function generateContinuousSchedule() {
  const players = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank"];
  const schedule = createOptimizedSchedule(players);
  

  schedule.forEach((match, index) => {
    console.log(`Match ${index + 1}: ${match[0]} vs ${match[1]}`);
  });
}

function createOptimizedSchedule(players) {
  let p = [...players];
  if (p.length % 2 !== 0) {
    p.push("BYE");
  }

  const numPlayers = p.length;
  const numRounds = numPlayers - 1;
  const halfSize = numPlayers / 2;
  const rounds = [];

  for (let round = 0; round < numRounds; round++) {
    const currentRound = [];
    for (let i = 0; i < halfSize; i++) {
      const p1 = p[i];
      const p2 = p[numPlayers - 1 - i];
      
      if (p1 !== "BYE" && p2 !== "BYE") {
        currentRound.push([p1, p2]);
      }
    }
    rounds.push(currentRound);
    
    p.splice(1, 0, p.pop());
  }

  const continuousSchedule = [];
  
  for (let i = 0; i < rounds.length; i++) {
    let currentRound = rounds[i];

    if (continuousSchedule.length > 0) {
      const lastMatch = continuousSchedule[continuousSchedule.length - 1];
      

      let safeMatchIndex = currentRound.findIndex(match => 
        !lastMatch.includes(match[0]) && !lastMatch.includes(match[1])
      );
      
      if (safeMatchIndex > 0) {
        const safeMatch = currentRound.splice(safeMatchIndex, 1)[0];
        currentRound.unshift(safeMatch);
      }
    }

    continuousSchedule.push(...currentRound);
  }

  return continuousSchedule;
}

console.log(generateContinuousSchedule());