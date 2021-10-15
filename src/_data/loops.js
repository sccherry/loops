const { BaseN, CartesianProduct } = require('js-combinatorics');
const { rotate, wrap } = require('../../lib/utils');

// Set the first chord root to be 0
function normalize(chordIds) {
  const root = parseInt(chordIds[0].charAt(0), 12);

  return chordIds.map(
    (id) =>
      `${((parseInt(id.charAt(0), 12) + 12 - root) % 12).toString(
        12
      )}${id.charAt(1)}`
  );
}

// Raw chords are each chord available via modal interchange grouped by scale degree
const notes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const rawChords = [
  ['C', 'Cm'],
  ['Dm', 'Db', 'D'],
  ['Em', 'Eb'],
  ['F', 'Fm'],
  ['G', 'Gm'],
  ['Am', 'Ab'],
  ['Bb', 'Bbm', 'Bm'],
].map((root) =>
  root.map((chord) => {
    // Major is 0, minor is 1
    const quality = chord.charAt(chord.length - 1) === 'm' ? 1 : 0;
    const tonic = notes
      .indexOf(chord.slice(0, chord.length - quality))
      .toString(12);
    return `${tonic}${quality}`;
  })
);

// Get every unique combination of chords which include only one chord from each scale degree
const pitchSets = CartesianProduct.from(rawChords);

const allLoops = new Map();

for (let pitchSet of pitchSets) {
  // Create all possible 4 chord loops from set of available chords
  const loops = new BaseN(pitchSet, 4);

  for (let loop of loops) {
    // Skip progression if fewer than 3 unique chords
    if (new Set(loop).size < 3) continue;

    // Skip progression if loop has the same chord multiple times consecutively
    const consecutive = loop.reduce((match, chord, i, list) => {
      if (match) return match;
      return chord.charAt(0) === wrap(list, i + 1).charAt(0);
    }, false);

    if (consecutive) continue;

    // Prime is the lowest id when converted to an integer
    const prime = rotate(loop)
      .map((rotation) => normalize(rotation).join(''))
      .sort((x, y) => parseInt(x, 12) - parseInt(y, 12))[0];

    if (!allLoops.has(prime)) {
      allLoops.set(prime, new Set());
    }

    // Add the prime loop the data
    allLoops.get(prime).add(loop.join(''));
  }
}

module.exports = function () {
  return Array.from(allLoops)
    .map(([prime, loops]) => ({ prime, loops: Array.from(loops) }))
    .sort((x, y) => parseInt(x.prime, 12) - parseInt(y.prime, 12));
};
