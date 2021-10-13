// Return all rotations of an array
exports.rotate = function (list) {
  return list.map((_, i) => [...list.slice(i), ...list.slice(0, i)]);
};

// Get an item from an array by index, wrapping
exports.wrap = function (list, i) {
  return list[(list.length + i) % list.length];
};
