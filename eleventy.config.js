module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('public');

  return {
    dataTemplateEngine: 'njk',
    dir: {
      input: 'src',
      output: 'dist',
      layouts: '_layouts',
    },
  };
};
