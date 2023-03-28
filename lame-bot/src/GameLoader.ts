// go through the GameSchema and load each game by creating a new instance of the game type from the GameDirectory

import mongoose from "mongoose";
import { GameSchema } from "../../src/database/db";

const Game = mongoose.model("Game", GameSchema);

// iterate through all games in the Game model
// for each game, create a new instance of the game type from the GameDirectory

Game.find({}, (err, games) => {
  // iterate through all games every 0.1 seconds
  games.forEach((game, index) => {
    setTimeout(() => {
      // get the game type from the GameDirectory
      const GameType = GameDirectory[game.gameType].Game;
      // create a new instance of the game type
      const newGame = new GameType();

      // set the game's properties to the new game's properties
      game.game = newGame;

      // save the game
      game.save();
    }, 100 * index);
  });
})