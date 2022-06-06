// Return all rotations of an array
function rotate(list) {
  return list.map((_, i) => [...list.slice(i), ...list.slice(0, i)]);
}

// Get an item from an array by index, wrapping
function wrap(list, i) {
  return list[(list.length + i) % list.length];
}

module.exports = {
  rotate,
  wrap,
};
