const { URL } = require("url");

module.exports = function () {
  const pathPrefix = process.env.ELEVENTY_FULL_ROOT_URL
    ? new URL(process.env.ELEVENTY_FULL_ROOT_URL).pathname
    : "/";
  return {
    dir: {
      input: "pages",
      output: "dist",
      includes: "includes",
      layouts: "layouts",
      data: "data",
    },
    dataTemplateEngine: "njk",
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
    passthroughFileCopy: true,
    templateFormats: ["md", "njk"],
    pathPrefix,
  };
};
