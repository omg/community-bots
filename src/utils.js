function formatNumber(x) {
  return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

function formatPercentage(x) {
  return parseFloat(x * 100).toFixed(1) + '%';
}

function formatPlacement(x) {
  let checker = BigInt(x) % 100n;
  if (checker > 10 && checker < 20) return x + 'th';
  checker %= 10n;
  if (checker == 1) return formatNumber(x) + 'st';
  if (checker == 2) return formatNumber(x) + 'nd';
  if (checker == 3) return formatNumber(x) + 'rd';
  return formatNumber(x) + 'th';
}

function createEnglishList(items) {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return items[0] + ' and ' + items[1];
  let listString = items[0];
  for (let i = 1; i < items.length; i++) listString += (i == items.length - 1 ? ', and ' : ', ') + items[i];
  return listString;
}

function shuffle(array) {
  let currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function escapeDiscordMarkdown(string) {
  return string.replace(/[\\`_~\*\|:!#@><]/g, '\\$&');
}

module.exports = {
  formatNumber,
  shuffle,
  escapeDiscordMarkdown,
  formatPercentage,
  formatPlacement,
  createEnglishList
}