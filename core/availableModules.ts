import * as fs from 'fs';

const MODULES_PATH = '../modules';

/**
 * Checks whether a directory is empty or not.
 *
 * @param directoryPath The path of the directory
 */
function isDirectoryEmpty(directoryPath: string): boolean {
  const files = fs.readdirSync(directoryPath);
  return files.length === 0;
}

// Find which modules are available
// it may even be better in the future if it detected the modules by entering the index file or something similar
// rather than just checking if there's a file within the directory ?
const modules: string[] = [];
fs.readdirSync(MODULES_PATH).forEach(file => {
  if (isDirectoryEmpty(`${MODULES_PATH}/${file}`)) return;
  modules.push(file);
});

console.log('Available modules:', modules);

export default modules;