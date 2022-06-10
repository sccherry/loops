const { Collection } = require('@tonaljs/tonal');

// Return all rotations of an array
function rotate(list) {
  return list.map((_, i) => Collection.rotate(i, list));
}

// Get an item from an array by index, wrapping
function wrap(list, i) {
  return list[(list.length + i) % list.length];
}

// Set the tonic of the first chord to be C
function normalize(id) {
  const chordIds = id.split('');
  const root = parseInt(chordIds[0], 24) % 12;

  const ids = chordIds.map((id) => {
    const num = parseInt(id, 24);
    const isMinor = num > 11;
    return (((num + 12 - root) % 12) + (isMinor ? 12 : 0)).toString(24);
  });

  return ids.join('');
}

// Prime is the lowest id when converted to an integer
function prime(id) {
  const ids = rotate(id.split('')).map((triadIds) =>
    normalize(triadIds.join(''))
  );

  return Math.min(...ids.map((id) => parseInt(id, 24)))
    .toString(24)
    .padStart(4, '0');
}

module.exports = {
  rotate,
  wrap,
  prime,
  normalize,
};
