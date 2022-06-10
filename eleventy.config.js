const { prime } = require('./lib/utils');

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('./public');
  eleventyConfig.addPassthroughCopy('./src/sw.js');

  // Filters
  eleventyConfig.addFilter('prime', prime);

  return {
    dataTemplateEngine: 'njk',
    dir: {
      input: 'src',
      output: 'dist',
      layouts: '_layouts',
    },
  };
};
