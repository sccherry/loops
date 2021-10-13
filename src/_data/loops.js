const { BaseN, CartesianProduct } = require('js-combinatorics');
const { Chord, Note } = require('@tonaljs/tonal');

/**
 * Utilities
 */

// Return all rotations of an array
function rotate(list) {
  return list.map((_, i) => [...list.slice(i), ...list.slice(0, i)]);
}

// Generate an id for a chord progression
function getLoopId(loop) {
  // Normalize the first chord root to be 0
  const root = Note.midi(`${loop[0].tonic}4`) % 12;

  // Tonic is 0-a, quality is 0 for minor, 1 for major
  return loop
    .map(({ tonic, quality }) => {
      return `${((Note.midi(`${tonic}4`) - root) % 12).toString(12)}${
        quality === 'Major' ? 1 : 0
      }`;
    })
    .join('');
}

function getLoopData(id) {
  return {
    id,
  };
}

/**
 * Data
 */

// Raw chords are each chord available via modal interchange grouped by scale degree
const rawChords = [
  ['C', 'Cm'],
  ['Dm', 'Db', 'D'],
  ['Em', 'Eb'],
  ['F', 'Fm'],
  ['G', 'Gm'],
  ['Am', 'Ab'],
  ['Bb', 'Bbm', 'Bm'],
].map((root) => root.map(Chord.get));

// Get every unique combination of chords which include only one chord from each scale degree
const pitchSets = CartesianProduct.from(rawChords);

const cachedIds = new Set();
const allLoops = new Set();

for (let pitchSet of pitchSets) {
  // Create all possible 4 chord loops from set of available chords
  const loops = new BaseN(pitchSet, 4);

  for (let loop of loops) {
    const id = getLoopId(loop);

    // Skip progression if id already processed
    if (cachedIds.has(id)) continue;

    // Add ids of all rotations to cache
    const rotations = rotate(loop).map(getLoopId);

    rotations.forEach((id) => cachedIds.add(id));

    // Skip progression if fewer than 3 unique chords
    const uniqueChords = new Set(
      loop.map(({ tonic, quality }) => `${tonic}${quality}`)
    );

    if (uniqueChords.size < 3) continue;

    // Skip progression if loop has the same chord multiple times consecutively
    const consecutive = loop.reduce((match, chord, i, list) => {
      if (match) return match;
      return chord.tonic === list[(i + 1) % list.length].tonic;
    }, false);

    if (consecutive) continue;

    // The prime is the lowest id number when converted to an integer
    const prime = Math.min(...rotations.map((id) => parseInt(id, 12)))
      .toString(12)
      .padStart(8, '0');

    allLoops.add(getLoopData(prime));
  }
}

module.exports = function () {
  return Array.from(allLoops);
};
