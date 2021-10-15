const { Chord, Interval, Midi, Note, Progression } = require('@tonaljs/tonal');
const { idFromChordName, rotate, wrap } = require('./utils');

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

function getLoopData(prime) {
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

module.exports = {
  getLoopData,
};
