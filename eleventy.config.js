module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('public');

  return {
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    dir: {
      input: 'src',
      output: 'dist',
      layouts: '_layouts',
    },
  };
};
