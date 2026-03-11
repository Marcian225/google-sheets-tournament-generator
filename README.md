# Google-Sheets Tournament Generator

A custom Google Apps Script application designed to automate the management of tournaments.
It handles player distribution, dynamic spreadsheet rendering, and most importantly,
calculates a mathematically optimal match schedule to guarantee maximum player rest between games.

---

## Requirements

This application is dedicated to work with a specific sheet layout (provided in `TOURNAMENT_TEMPLATE.xlsx`).
It does **not** generate the tables and graphics.

The code is written in such a way that any changes to the sheet may result in unexpected behaviour.
It is not perfectly prepared for arbitrary changes, but it is ready for some kinds of changes
like number of rows in groups or schedule.

To run this code you need to use the **Apps Script** extension.
How to do it: https://developers.google.com/apps-script/guides/sheets

When you enable it, all you have to do is copy the code from `main.js`, `scheduleGenerator.js`,
and `groupsGenerator.js` and paste it into new `.gs` files in the Apps Script application.

The script menu is added automatically when opening the sheet and looks like this:

![Script menu](https://github.com/user-attachments/assets/3ed05930-a3af-4812-a18b-96551d14919b)

If you don't see it, try refreshing the sheet.

Once the script is added, all you need is:

- A sheet in the same format as the template
- A list of players written in the **"Lista Zawodników"** sheet (players list)
- Generate groups and schedule through menu:
  
  <img width="406" height="135" alt="image" src="https://github.com/user-attachments/assets/77fa5448-750a-4f52-b146-3dc3a5502819" />



---

## How It Works

1. **Generate Groups** — The script reads a list of participants, applies a Fisher-Yates shuffle,
   and evenly distributes them across a user-defined number of groups.

2. **Generate Schedules** — The script scans the dimensions of the generated groups, executes
   the Circle Method scheduling algorithm, and outputs a match list directly to the spreadsheet.

---

## File Structure

| File | Description |
|---|---|
| `main.gs` | Custom UI menu, user prompts, and shared data-reading helpers |
| `groupsGenerator.gs` | Handles randomization and dynamic horizontal group layout |
| `scheduleGenerator.gs` | The core script that builds the optimized Round-Robin schedules |

---

## Features

**Match Scheduling Algorithm**
Uses the Circle Method to generate Round-Robin match schedules. It minimizes situations where
a player has to play two games in a row, completely avoiding them for groups of 5 or more players.

**Continuous Match Flow**
Adjusts the generated schedule to prevent back-to-back games that might accidentally occur
when transitioning between mathematical rounds.

**Preserves Sheet Formatting**
The script searches the column for specific headers (like "Match Schedule") rather than relying
on hardcoded row numbers. This means you can manually add, delete, or style rows above the schedule
without breaking the script.

**Efficient Execution**
Uses Google Apps Script batch operations (`getValues()` and `setValues()`) to read and write data
in single steps, preventing the script from slowing down or freezing the sheet.

---

## Tech Stack

- **Language:** JavaScript (Google Apps Script)
- **Platform:** Google Sheets API
- **Concepts:** Graph Theory, Combinatorics, Heuristic Optimization
