exports.data = {
  layout: 'default',
  tags: ['loop'],
  permalink: ({ loop }) => `/${loop.id}/index.html`,
  pagination: {
    data: 'loops',
    size: 1,
    alias: 'loop',
    addAllPagesToCollections: true,
  },
  eleventyComputed: {
    title: ({ loop }) => loop.id,
  },
};

exports.render = function (data) {
  return ``;
};
