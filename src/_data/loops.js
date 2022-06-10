const { AssetCache } = require('@11ty/eleventy-fetch');
const { BaseN, CartesianProduct } = require('js-combinatorics');
const { prime, wrap } = require('../../lib/utils');
const Loop = require('../../lib/loop');

function generateUniqueIds() {
  // The ids of the triads of each mode with a tonic F
  // C:B -> 0:b, minor chords add 12
  const triadIds = {
    lydian: ['5', '7', 'l', undefined, '0', 'e', 'g'],
    ionian: ['5', 'j', 'l', 'a', '0', 'e', undefined],
    mixolydian: ['5', 'j', undefined, 'a', 'c', 'e', '3'],
    dorian: ['h', 'j', '8', 'a', 'c', undefined, '3'],
    aeolian: ['h', undefined, '8', 'm', 'c', '1', '3'],
    phrygian: ['h', '6', '8', 'm', undefined, '1', 'f'],
    locrian: [undefined, '6', 'k', 'm', 'b', '1', 'f'],
  };

  // All the pairs of modes that produce unique combinations of chords
  const modeSet = [
    ['lydian'],
    ['lydian', 'ionian'],
    ['lydian', 'mixolydian'],
    ['lydian', 'dorian'],
    ['lydian', 'aeolian'],
    ['lydian', 'phrygian'],
    ['lydian', 'locrian'],
  ];

  // Convert the list of mode combinations to a set of available chords
  const triadSet = modeSet.map(([mode, mix]) => {
    const mixTriads = mix ? triadIds[mix] : [];

    return triadIds[mode]
      .map((triad, i) => {
        const list = new Set();
        list.add(triad);
        if (mix) list.add(mixTriads[i]);
        return Array.from(list);
      })
      .map((triads) => triads.filter((triad) => triad !== undefined))
      .filter((triads) => triads.length > 0);
  });

  // Get every unique combination of chords which include only one chord from each scale degree
  const loopSets = triadSet.flatMap((triads) => {
    const product = CartesianProduct.from(triads);
    return Array.from(product);
  });

  // Cache unique ids
  const cachedIds = new Set();
  const uniqueMatchingIds = new Set();

  for (let loopSet of loopSets) {
    // Create all possible 4 chord loops from set of available chords
    const loops = new BaseN(loopSet, 4);

    for (let loop of loops) {
      const primeId = prime(loop.join(''));

      // Skip progression if id already processed
      if (cachedIds.has(primeId)) continue;

      // Skip progression if fewer than 3 unique chords
      if (new Set(loop).size < 3) continue;

      // Skip progression if loop has the same chord multiple times consecutively
      const consecutive = loop.reduce((match, chord, i, list) => {
        if (match) return match;
        return chord === wrap(list, i + 1);
      }, false);

      if (consecutive) continue;

      // Add the prime loop to the data
      uniqueMatchingIds.add(primeId);
    }
  }

  return Array.from(uniqueMatchingIds);
}

module.exports = async function () {
  const asset = new AssetCache('generated_loops');

  // if (asset.isCacheValid('1w')) {
  //   return asset.getCachedValue();
  // }

  const loops = generateUniqueIds()
    .sort((x, y) => parseInt(x, 24) - parseInt(y, 24))
    .map(Loop.fromId);

  await asset.save(loops, 'json');

  return loops;
};
