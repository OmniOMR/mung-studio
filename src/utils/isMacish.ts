/**
 * Returns true if the computer is Mac-like and so has the Comand key
 * instead of the Windows Control key.
 */
export function isMacish() {
  // Pattern borrowed from TinyKeys library.
  // https://github.com/jamiebuilds/tinykeys/blob/e0d23b4f248af59ffbbe52411505c3d681c73045/src/tinykeys.ts#L50-L54
  const macOsPattern = /Mac|iPod|iPhone|iPad/;

  return macOsPattern.test(window.navigator.platform);
}