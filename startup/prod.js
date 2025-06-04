const helmet = require("helmet");
const compression = require("compression");

module.exports = function (app) {
  // Set security HTTP headers
  app.use(helmet());

  // Enable gzip compression
  app.use(compression());

  // Serve static files from the 'public' directory
  //app.use(express.static("public"));

  // Add other production-specific middleware here if needed
};
