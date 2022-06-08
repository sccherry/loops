const { AssetCache } = require('@11ty/eleventy-fetch');
const { BaseN, CartesianProduct } = require('js-combinatorics');
const { Mode } = require('@tonaljs/tonal');
const { rotate, wrap } = require('../../lib/utils');
const Loop = require('../../lib/loop');

function generateUniqueIds() {
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
  const chordSet = modeSet.map(([mode, mix]) => {
    const mixChords = mix ? Mode.triads(mix, 'C') : [];

    return Mode.triads(mode, 'C')
      .map((chord, i) => {
        const list = new Set();

        list.add(chord);
        if (mix) list.add(mixChords[i]);
        return Array.from(list);
      })
      .map((chords) => chords.filter((chord) => !chord.endsWith('dim')))
      .filter((chords) => chords.length > 0);
  });

  // Get every unique combination of chords which include only one chord from each scale degree
  const pitchSets = chordSet.flatMap((chords) => {
    const product = CartesianProduct.from(chords);
    return Array.from(product);
  });

  // Cache unique ids
  const cachedIds = new Set();
  const uniqueMatchingIds = new Set();

  for (let pitchSet of pitchSets) {
    // Create all possible 4 chord loops from set of available chords
    const loops = new BaseN(pitchSet, 4);

    for (let loop of loops) {
      // Skip progression if id already processed
      if (cachedIds.has(Loop.normalize(loop))) continue;

      // Add ids of all rotations to cache
      const rotations = rotate(loop).map((rotation) =>
        Loop.normalize(rotation)
      );
      rotations.forEach((rotation) => cachedIds.add(rotation));

      // Skip progression if fewer than 3 unique chords
      if (new Set(loop).size < 3) continue;

      // Skip progression if loop has the same chord multiple times consecutively
      const consecutive = loop.reduce((match, chord, i, list) => {
        if (match) return match;
        return chord === wrap(list, i + 1);
      }, false);

      if (consecutive) continue;

      // Prime is the lowest id when converted to an integer
      const prime = Loop.getPrime(rotations);

      // Add the prime loop to the data
      uniqueMatchingIds.add(prime);
    }
  }

  return Array.from(uniqueMatchingIds);
}

module.exports = async function () {
  const asset = new AssetCache('generated_loops');

  if (asset.isCacheValid('1w')) {
    return asset.getCachedValue();
  }

  const loops = generateUniqueIds()
    .sort((x, y) => parseInt(x, 24) - parseInt(y, 24))
    .map(Loop.get);

  await asset.save(loops, 'json');

  return loops;
};
