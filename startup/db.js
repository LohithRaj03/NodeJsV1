const winston = require("winston");
const mongoose = require("mongoose");
const config = require("config");
module.exports = function () {
  const db = config.get("db");
  if (!db) {
    throw new Error("FATAL ERROR: db is not defined.");
  }
  mongoose
    .connect(db)
    .then(() => winston.info(`Connected to ${db} MongoDB...`));
};
