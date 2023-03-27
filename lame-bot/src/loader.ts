import fs from 'fs';
import path from 'path';
import LameGame from '../types/LameGame';

// Define a type to store the mapping of game identifiers to game classes
type GameMap = {
  [key: string]: typeof LameGame;
};

// Initialize an empty game map
const gameMap: GameMap = {};

// Get the absolute path to the "games" folder
const gamesDir = path.resolve(__dirname, '../games');

// Read the contents of the "games" folder
fs.readdirSync(gamesDir)
  // Filter out any non-TypeScript files
  .filter((filename) => filename.endsWith('.ts'))
  // Iterate over each game file
  .forEach((filename) => {
    // Get the absolute path to the game file
    const gamePath = path.resolve(gamesDir, filename);
    // Dynamically import the game class from the file
    import(gamePath)
      .then((module) => {
        // Add the game class to the game map using its identifier as the key
        gameMap[module.default.identifier] = module.default;
      })
      .catch((error) => {
        console.error(`Error importing ${gamePath}: ${error}`);
      });
  });
