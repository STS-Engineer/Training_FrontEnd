module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.ignoreWarnings = [
        /Critical dependency: the request of a dependency is an expression/,
        // docx-preview ships without its TypeScript sources — ignore missing source-map files
        (warning) =>
          warning.module?.resource?.includes('docx-preview') &&
          warning.message?.includes('Failed to parse source map'),
      ];
      return webpackConfig;
    },
  },
};
