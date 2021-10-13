const { BaseN, CartesianProduct } = require('js-combinatorics');
const { Chord } = require('@tonaljs/tonal');
const { rotate, wrap } = require('../../lib/utils');
const Loop = require('../../lib/loop');

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
    const id = Loop.getLoopId(loop);

    // Skip progression if id already processed
    if (cachedIds.has(id)) continue;

    // Add ids of all rotations to cache
    const rotations = rotate(loop).map(Loop.getLoopId);

    rotations.forEach((id) => cachedIds.add(id));

    // Skip progression if fewer than 3 unique chords
    const uniqueChords = new Set(
      loop.map(({ tonic, quality }) => `${tonic}${quality}`)
    );

    if (uniqueChords.size < 3) continue;

    // Skip progression if loop has the same chord multiple times consecutively
    const consecutive = loop.reduce((match, { tonic }, i, list) => {
      if (match) return match;
      return tonic === wrap(list, i + 1).tonic;
    }, false);

    if (consecutive) continue;

    // Add the prime loop the data
    allLoops.add(Loop.getLoopData(Loop.getPrime(rotations)));
  }
}

module.exports = function () {
  return Array.from(allLoops);
};
