const {
  Chord,
  Interval,
  Note,
  Progression,
  RomanNumeral,
} = require('@tonaljs/tonal');

function negative(chordProgression, axis) {
  const chords = chordProgression.map(Chord.get);
  axis = axis || chords[0].tonic;

  return chords.map(({ notes }) => {
    const negative = notes.map((note) =>
      Note.transpose(axis, Interval.invert(Interval.distance(axis, note)))
    );

    return Chord.detect(negative)
      .map((symbol) => symbol.split('/')[0])
      .filter((symbol) => symbol.toLowerCase().endsWith('m'))
      .map((symbol) =>
        symbol.endsWith('M') ? symbol.slice(0, -1) : symbol
      )[0];
  });
}

function toNashvilleNumbers(keyTonic, chordProgression) {
  const numerals = Progression.toRomanNumerals(keyTonic, chordProgression);

  return numerals.map((numeral) => {
    const { acc, step, chordType } = RomanNumeral.get(numeral);
    return `${acc}${step + 1}${chordType}`;
  });
}

module.exports = {
  negative,
  toNashvilleNumbers,
};
