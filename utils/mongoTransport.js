const { MongoClient } = require("mongodb");
const Transport = require("winston-transport");

class MongoDBTransport extends Transport {
  constructor(options) {
    super(options);
    this.db = null;
    this.collectionName = options.collection || "logs"; // Default collection name
    this.url = options.db; // MongoDB connection URL

    if (!this.url) {
      throw new Error("MongoDB URL is required for MongoDBTransport");
    }

    // Connect to MongoDB
    MongoClient.connect(this.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
      .then((client) => {
        this.db = client.db(new URL(this.url).pathname.substring(1)); // Extract DB name from URL
        this.collection = this.db.collection(this.collectionName);
        this.emit("connected", this.db); // Emit event on successful connection
        console.info(`Custom MongoDB Transport: Connected to ${this.url}`); // Use console.info for connection
      })
      .catch((err) => {
        this.emit("error", err); // Emit error on connection failure
        console.error(
          `Custom MongoDB Transport: Connection error: ${err.message}`
        ); // Use console.error
      });
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    if (!this.collection) {
      // If collection is not ready, defer logging or handle gracefully
      return callback();
    }

    // Prepare log entry (ensure it's serializable and useful)
    const logEntry = {
      timestamp: new Date(),
      level: info.level,
      message: info.message,
      meta: info.meta || {}, // Include any additional metadata
    };

    this.collection
      .insertOne(logEntry)
      .then(() => {
        // Log successfully inserted
      })
      .catch((err) => {
        this.emit("error", err); // Emit error if insertion fails
        console.error(
          `Custom MongoDB Transport: Log insertion error: ${err.message}`
        );
      });

    callback();
  }
}

module.exports = MongoDBTransport;
