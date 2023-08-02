const EMPTY = ["[.", ".", ".]"];
const FILLED = ["[\|", "\|", "\|]"];

const DEFAULT_LENGTH = 60;

function getProgress(percentage, length = DEFAULT_LENGTH) {
  const filled = Math.floor(percentage * length);
  const empty = length - filled;

  const progress = (filled > 0 ? FILLED[0] : EMPTY[0]) + FILLED[1].repeat(filled - 1) + EMPTY[1].repeat(empty - 1) + (empty > 0 ? EMPTY[2] : FILLED[2]);

  return progress;
}

module.exports = getProgress; // ?