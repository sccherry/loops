// Return all rotations of an array
exports.rotate = function (list) {
  return list.map((_, i) => [...list.slice(i), ...list.slice(0, i)]);
};

// Get an item from an array by index, wrapping
exports.wrap = function (list, i) {
  return list[(list.length + i) % list.length];
};

const notes = {
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

exports.idFromChordName = function (chord) {
  // Major is 0, minor is 1
  const quality = chord.charAt(chord.length - 1) === 'm' ? 1 : 0;
  const tonic = notes[chord.slice(0, chord.length - quality)].toString(12);

  return `${tonic}${quality}`;
};
