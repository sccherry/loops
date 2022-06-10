const { Chord, Interval, Mode, Note, Progression } = require('@tonaljs/tonal');
const { rotate, wrap } = require('./utils');
const { negative, toNashvilleNumbers } = require('./progression');

/**
 * Utils
 */

function loopToId(loop) {
  return loop
    .map(({ tonic, quality }) =>
      (Note.chroma(tonic) + (quality === 'Minor' ? 12 : 0)).toString(24)
    )
    .join('');
}

function idToLoop(id) {
  return id.split('').map((chordId) => {
    const n = parseInt(chordId, 24);
    const note = Note.pitchClass(Note.fromMidi(n));
    return `${note}${n > 11 ? 'm' : ''}`;
  });
}

function getTransitions(chords) {
  return chords
    .map(({ tonic }, i, list) =>
      [0, 1, 2, 5, 7, 10, 11].includes(
        Math.abs(
          Interval.semitones(
            Interval.simplify(Interval.distance(tonic, wrap(list, i + 1).tonic))
          )
        )
      )
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

function getLoopQuality(transitions) {
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

const MODE_NUMERALS = Mode.names().reduce(
  (obj, mode) => ({
    ...obj,
    [mode]: Progression.toRomanNumerals('C', Mode.triads(mode, 'C')),
  }),
  {}
);

function detectMode(chordProgression) {
  const numerals = Progression.toRomanNumerals(
    Chord.get(chordProgression[0]).tonic,
    chordProgression
  );

  return Object.keys(MODE_NUMERALS)
    .map((mode) => {
      const diatonic = numerals.filter((rn) =>
        MODE_NUMERALS[mode].includes(rn)
      ).length;

      return {
        mode,
        diatonic,
        chromatic: chordProgression.length - diatonic,
      };
    })
    .reduce((prev, curr) => (prev.diatonic > curr.diatonic ? prev : curr), {});
}

/**
 * Loop data
 */

function parse(chordProgression) {
  const chords = chordProgression.map(Chord.get);
  const chroma = loopToId(chords);
  const { mode: parentMode, chromatic: numChromaticChords } =
    detectMode(chordProgression);
  const transitions = getTransitions(chords);
  const negativeChords = negative(chordProgression);

  return {
    chroma,
    chords: chordProgression,
    roman: Progression.toRomanNumerals(chords[0].tonic, chordProgression),
    nashville: toNashvilleNumbers(chords[0].tonic, chordProgression),
    parentMode,
    modes: rotate(chordProgression),
    transitions,
    quality: getLoopQuality(transitions),
    negative: {
      id: loopToId(negativeChords.map(Chord.get)),
      chords: negativeChords,
    },
    numChords: new Set(chordProgression).size,
    numChromaticChords: numChromaticChords,
  };
}

function get(src) {
  return parse(src);
}

function fromId(id) {
  return get(idToLoop(id));
}

module.exports = {
  get,
  fromId,
};
