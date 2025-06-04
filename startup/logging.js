const winston = require("winston");
require("express-async-errors");

const MongoDBTransport = require("../utils/mongoTransport");

module.exports = function () {
  winston.configure({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
      new winston.transports.File({ filename: "logfile.log" }),
      new MongoDBTransport({
        // Ensure your custom transport is still correct
        db: "mongodb://localhost:27017/vidly_tests",
        level: "info",
        collection: "application_logs",
      }),
    ],
    exceptionHandlers: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
      new winston.transports.File({ filename: "uncaughtExceptions.log" }),
    ],
    rejectionHandlers: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
      new winston.transports.File({ filename: "unhandledRejections.log" }),
    ],
  });
};
