const { AssetCache } = require('@11ty/eleventy-fetch');
const { BaseN, CartesianProduct } = require('js-combinatorics');
const { Chord, Interval, Midi, Note, Progression } = require('@tonaljs/tonal');

/**
 * Globals
 */

const NOTE_NUMBERS = {
  'B#': 0,
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  Ebb: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  'E#': 5,
  F: 5,
  'F#': 6,
  Gb: 6,
  'F##': 7,
  G: 7,
  Abb: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  Bbb: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

/**
 * Utils
 */

// Return all rotations of an array
function rotate(list) {
  return list.map((_, i) => [...list.slice(i), ...list.slice(0, i)]);
}

// Get an item from an array by index, wrapping
function wrap(list, i) {
  return list[(list.length + i) % list.length];
}

function idFromChordName(chord) {
  // Major is 0, minor is 1
  const quality = chord.charAt(chord.length - 1) === 'm' ? 1 : 0;
  const tonic =
    NOTE_NUMBERS[chord.slice(0, chord.length - quality)].toString(12);

  return `${tonic}${quality}`;
}

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

// Generate an id for a chord progression
function getLoopId(loop) {
  // Normalize the first chord root to be 0
  const root = Note.midi(`${loop[0].tonic}4`) % 12;

  // Tonic is 0-a, quality is 0 for major, 1 for minor
  return loop
    .map(({ tonic, quality }) => {
      return `${((Note.midi(`${tonic}4`) - root) % 12).toString(12)}${
        quality === 'Major' ? 0 : 1
      }`;
    })
    .join('');
}

function getLoopType(transitions) {
  const numDestinations = transitions.filter((t) => t === 'Destination').length;
  const numIslands = transitions.filter((t) => t === 'Island').length;

  if (numDestinations === 0) {
    return 'Zero destination';
  } else if (numDestinations === 2) {
    return 'Two destination';
  } else if (numIslands === 2) {
    return 'Drift';
  } else if (numIslands === 1) {
    return 'Piston';
  } else if (numIslands === 0) {
    return 'Cascade';
  }
}

function getNegative({ notes }, axis) {
  return Chord.detect(
    notes.map((n, i, list) =>
      Note.transpose(axis, Interval.invert(Interval.distance(axis, `${n}4`)))
    )
  )
    .map((symbol) =>
      symbol.indexOf('/') === -1 ? symbol : symbol.slice(0, symbol.indexOf('/'))
    )
    .map(Chord.get)
    .filter(({ quality }) => ['Major', 'Minor'].includes(quality))[0];
}

// Prime is the lowest number when converted to an integer
function getPrime(ids) {
  return Math.min(...ids.map((id) => parseInt(id, 12)))
    .toString(12)
    .padStart(8, '0');
}

function getTransitions(chords) {
  return chords
    .map(({ tonic }) => `${tonic}4`)
    .map((root, i, list) => Interval.distance(root, wrap(list, i + 1)))
    .map((interval) =>
      [1, 2, 5, 7, 10, 11].includes(Math.abs(Interval.semitones(interval)))
    )
    .map((isToStrong, i, list) => {
      const isFromStrong = wrap(list, i - 1);

      if (isFromStrong && isToStrong) {
        return 'Connector';
      } else if (!isFromStrong && !isToStrong) {
        return 'Island';
      } else if (isToStrong) {
        return 'Signpost';
      } else if (isFromStrong) {
        return 'Destination';
      }
    });
}

function getChordsFromId(id) {
  const data = [];

  for (let i = 0; i < id.length; i += 2) {
    const chordId = id.slice(i, i + 2);
    const tonic = Midi.midiToNoteName(
      parseInt(chordId.charAt(0), 12) + 12 * 5,
      { pitchClass: true }
    );
    const quality = +chordId.charAt(1) ? 'm' : '';
    data.push(`${tonic}${quality}`);
  }

  return data;
}

// The best loop has the lowest id and the fewest chromatic chords
function getBest(id) {
  const roman = ['I', 'IIm', 'IIIm', 'IV', 'V', 'VIm'];
  const keys = [
    'C',
    'G',
    'F',
    'Bb',
    'Eb',
    'Ab',
    'Db',
    'Gb',
    'Cb',
    'Fb',
    'E',
    'B',
  ];
  const chords = getChordsFromId(id);

  let len = -1;
  let res = [];

  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const numerals = Progression.toRomanNumerals(key, chords);
    const l = numerals.filter((n) => roman.includes(n)).length;

    if (l > len) {
      len = l;
      res = [Progression.fromRomanNumerals('C', numerals)];
    } else if (l === len) {
      res.push(Progression.fromRomanNumerals('C', numerals));
    }

    // Stop processing if progression is diatonic
    if (len === 4) {
      break;
    }
  }

  const ids = res.map((chords) => chords.map(idFromChordName).join(''));

  ids.sort((x, y) => parseInt(x, 12) - parseInt(y, 12));

  return { len, id: ids[0] };
}

function getLoopDataFromId(prime) {
  const { len, id } = getBest(prime);
  const chords = getChordsFromId(id);
  const chordData = chords.map(Chord.get);
  const numChords = new Set(chords).size;
  const numChromaticChords = numChords - len;
  const rotations = rotate(chordData).map((rotation) =>
    rotation.map(
      ({ tonic, quality }) => `${tonic}${quality === 'Minor' ? 'm' : ''}`
    )
  );
  const transitions = getTransitions(chordData);
  const type = getLoopType(transitions);

  const negativeLoop = chordData.map((chord) => getNegative(chord, 'C4'));
  const negativeId = getPrime(rotate(negativeLoop).map(getLoopId));

  return {
    id,
    chords,
    rotations,
    prime: {
      id: prime,
      chords: getChordsFromId(prime),
    },
    transitions,
    type,
    negative: {
      id: negativeId,
      chords: negativeLoop.map(
        ({ tonic, quality }) => `${tonic}${quality === 'Minor' ? 'm' : ''}`
      ),
    },
    numChords,
    numChromaticChords,
  };
}

function generateUniqueIds() {
  // Raw chords are each chord available via modal interchange grouped by scale degree
  const rawChords = [
    ['C', 'Cm'],
    ['Dm', 'Db', 'D'],
    ['Em', 'Eb'],
    ['F', 'Fm'],
    ['G', 'Gm'],
    ['Am', 'Ab'],
    ['Bb', 'Bbm', 'Bm'],
  ].map((root) => root.map(idFromChordName));

  // Get every unique combination of chords which include only one chord from each scale degree
  const pitchSets = CartesianProduct.from(rawChords);

  // Cache unique ids
  const cachedIds = new Set();
  const uniqueMatchingIds = new Set();

  for (let pitchSet of pitchSets) {
    // Create all possible 4 chord loops from set of available chords
    const loops = new BaseN(pitchSet, 4);

    for (let loop of loops) {
      // Skip progression if id already processed
      if (cachedIds.has(normalize(loop).join(''))) continue;

      // Add ids of all rotations to cache
      const rotations = rotate(loop).map((rotation) =>
        normalize(rotation).join('')
      );
      rotations.forEach((rotation) => cachedIds.add(rotation));

      // Skip progression if fewer than 3 unique chords
      if (new Set(loop).size < 3) continue;

      // Skip progression if loop has the same chord multiple times consecutively
      const consecutive = loop.reduce((match, chord, i, list) => {
        if (match) return match;
        return chord.charAt(0) === wrap(list, i + 1).charAt(0);
      }, false);

      if (consecutive) continue;

      // Prime is the lowest id when converted to an integer
      const prime = [...rotations].sort(
        (x, y) => parseInt(x, 12) - parseInt(y, 12)
      )[0];

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
    .sort((x, y) => parseInt(x, 12) - parseInt(y, 12))
    .map(getLoopDataFromId);
  await asset.save(loops, 'json');

  return loops;
};
