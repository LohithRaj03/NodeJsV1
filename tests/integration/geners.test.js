const request = require("supertest");
let server;
const { Genre } = require("../../models/genre"); // Adjust the path to your genre model
const { User } = require("../../models/user"); // Adjust the path to your user model
describe("/api/genres", () => {
  beforeEach(async () => {
    server = require("../../index"); // Adjust the path to your index.js file
    await Genre.deleteMany({});
  });
  afterEach(async () => {
    await server.close();
    await Genre.deleteMany({});
  });
  describe("GET /", () => {
    it("should return all genres", async () => {
      const res = await request(server).get("/api/genres");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });
    it("should return all genres 2", async () => {
      await Genre.collection.insertMany([
        { name: "Genre1" },
        { name: "Genre2" },
      ]);
      const res = await request(server).get("/api/genres");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some((g) => g.name === "Genre1")).toBeTruthy();
      expect(res.body.some((g) => g.name === "Genre2")).toBeTruthy();
    });
  });
  describe("GET /:id", () => {
    it("should return a genre if valid id is passed", async () => {
      const genre = new Genre({ name: "Genre1" });
      await genre.save();

      const res = await request(server).get("/api/genres/" + genre._id);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("name", genre.name);
    });

    it("should return 404 if invalid id is passed", async () => {
      const res = await request(server).get("/api/genres/1");
      expect(res.status).toBe(404);
    });

    // it("should return 404 if no genre with the given id exists", async () => {
    //   const id = mongoose.Types.ObjectId();
    //   const res = await request(server).get("/api/genres/" + id);
    //   expect(res.status).toBe(404);
    // });
  });
  describe("POST /", () => {
    let token;
    beforeEach(() => {
      token = new User().generateAuthToken();
    });

    const exec = async (name) => {
      return await request(server)
        .post("/api/genres")
        .set("x-auth-token", token)
        .send({ name });
    };

    it("should return 401 if client is not logged in", async () => {
      const res = await request(server)
        .post("/api/genres")
        .send({ name: "Genre1" });
      expect(res.status).toBe(401);
    });

    it("should return 400 if genre is less than 5 characters", async () => {
      //const token = new mongoose.Types.ObjectId().toHexString(); // Simulate a valid token
      //const token = new User().generateAuthToken(); // Simulate a valid token
      const res = await exec("1234");
      expect(res.status).toBe(400);
    });
    it("should return 400 if genre is more than 50 characters", async () => {
      //const token = new mongoose.Types.ObjectId().toHexString(); // Simulate a valid token
      //const token = new User().generateAuthToken();
      const name = new Array(52).join("a"); // Simulate a valid token
      const res = await exec(name);
      expect(res.status).toBe(400);
    });

    it("should save the genre if it is valid", async () => {
      //const token = new mongoose.Types.ObjectId().toHexString(); // Simulate a valid token
      //const token = new User().generateAuthToken();
      const res = await exec("Genre1");
      const genre = await Genre.findById(res.body._id);
      expect(res.status).toBe(200);
      expect(genre).not.toBeNull();
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("name", "Genre1");
    });
  });
});
