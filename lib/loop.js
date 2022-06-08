const { Chord, Interval, Note, Progression } = require('@tonaljs/tonal');
const { rotate, wrap } = require('./utils');

/**
 * Utils
 */

function chordToId(symbol) {
  const { tonic, quality } = Chord.get(symbol);
  const { chroma } = Note.get(tonic);
  // C:B -> 0:11, minor adds 12
  return (chroma + (quality === 'Minor' ? 12 : 0)).toString(24);
}

function loopToId(loop) {
  return loop.map(chordToId).join('');
}

function idToChord(id) {
  const n = parseInt(id, 24);
  const note = Note.pitchClass(Note.fromMidi(n));
  return `${note}${n > 11 ? 'm' : ''}`;
}

function idToLoop(id) {
  return id.split('').map(idToChord);
}

// Set the first chord root to be 0
function normalize(chords) {
  const root = parseInt(chordToId(chords[0]), 24) % 12;

  const ids = chords.map((chord) => {
    const id = chordToId(chord);
    const num = parseInt(id, 24);
    const isMinor = num > 11;
    return (((num + 12 - root) % 12) + (isMinor ? 12 : 0)).toString(24);
  });

  return ids.join('');
}

function getLoopType(transitions) {
  const numDestinations = transitions.filter((t) => t === 'Destination').length;
  const numIslands = transitions.filter((t) => t === 'Island').length;

  if (numIslands === 4) {
    return 'Archipelago';
  } else if (numDestinations === 0) {
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
  return Math.min(...ids.map((id) => parseInt(id, 24)))
    .toString(24)
    .padStart(4, '0');
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
  const chords = idToLoop(id);

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

  const ids = res.map(loopToId);

  ids.sort((x, y) => parseInt(x, 24) - parseInt(y, 24));

  return { len, id: ids[0] };
}

function get(prime) {
  const { len, id } = getBest(prime);
  const chords = idToLoop(id);
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

  const negativeLoop = chordData
    .map((chord) => getNegative(chord, 'C4'))
    .map(({ tonic, quality }) => `${tonic}${quality === 'Minor' ? 'm' : ''}`);
  const negativeId = getPrime(rotate(negativeLoop).map(normalize));

  return {
    id,
    chords,
    rotations,
    prime: {
      id: prime,
      chords: idToLoop(prime),
    },
    transitions,
    type,
    negative: {
      id: negativeId,
      chords: negativeLoop,
    },
    numChords,
    numChromaticChords,
  };
}

module.exports = {
  get,
  normalize,
  getPrime,
};
