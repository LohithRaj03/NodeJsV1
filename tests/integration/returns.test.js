const momment = require("moment");
const request = require("supertest");
const { Rental } = require("../../models/rental");
const { Movie } = require("../../models/movie");
const { User } = require("../../models/user");
const mongoose = require("mongoose");
describe("/api/returns", () => {
  let server;
  let customerId;
  let movieId;
  let rental;
  let movie;
  let token;
  const exec = (body) => {
    return request(server)
      .post("/api/returns")
      .set("x-auth-token", token)
      .send(body);
  };
  beforeEach(async () => {
    server = require("../../index");

    customerId = mongoose.Types.ObjectId();
    movieId = mongoose.Types.ObjectId();
    token = new User().generateAuthToken();
    movie = new Movie({
      _id: movieId,
      title: "Inception",
      dailyRentalRate: 2,
      genre: { name: "Sci-Fi" },
      numberInStock: 10,
    });
    await movie.save();
    rental = new Rental({
      customer: {
        _id: customerId,
        name: "John Doe",
        phone: "1234567890",
      },
      movie: {
        _id: movieId,
        title: "Inception",
        dailyRentalRate: 2,
      },
      dateOut: new Date(),
      dateReturned: null,
      rentalFee: 0,
    });
    await rental.save();
  });
  afterEach(async () => {
    await server.close();
    await Rental.remove({});
    await Movie.remove({});
  });

  it("should work!", async () => {
    const result = await Rental.findById(rental._id);
    expect(result).not.toBeNull();
  });
  it("should return 401 if client is not logged in", async () => {
    token = ""; // Simulate no token
    const res = await exec({ customerId, movieId });
    expect(res.status).toBe(401);
  });

  it("should return 400 if customerId is not provided", async () => {
    const res = await exec({ movieId });
    expect(res.status).toBe(400);
  });
  it("should return 400 if movieId is not provided", async () => {
    const res = await exec({ customerId });
    expect(res.status).toBe(400);
  });
  it("should return 404 if no rental found for this customer/movie", async () => {
    await Rental.remove({});
    const res = await exec({ customerId, movieId });
    expect(res.status).toBe(404);
  });

  it("should return 400 if rental already processed", async () => {
    rental.dateReturned = new Date();
    await rental.save();
    const res = await exec({ customerId, movieId });
    expect(res.status).toBe(400);
  });
  it("should return 200 if valid request", async () => {
    const res = await exec({ customerId, movieId });
    expect(res.status).toBe(200);
  });
  it("should set the return date if input is valid", async () => {
    rental.dateOut = momment().subtract(7, "days").toDate(); // Set dateOut to 7 days ago
    await rental.save();
    const res = await exec({ customerId, movieId });
    const rentalInDb = await Rental.findById(rental._id);
    const diff = new Date() - rentalInDb.dateReturned;
    //expect(rentalInDb.dateReturned).toBeDefined();
    expect(diff).toBeLessThan(10 * 1000); // Check if the return date is set within 10 seconds
    expect(rentalInDb.rentalFee).toBe(14);
  });
  it("should increase the stock if input is valid", async () => {
    const res = await exec({ customerId, movieId });
    const movieInDb = await Movie.findById(movieId);
    expect(movieInDb.numberInStock).toBe(movie.numberInStock + 1);
  });
  it("should return the rental if input is valid", async () => {
    const res = await exec({ customerId, movieId });
    const rentalInDb = await Rental.findById(rental._id);
    // expect(res.body).toHaveProperty("customerId", customerId.toHexString());
    // expect(res.body).toHaveProperty("movieId", movieId.toHexString());
    // expect(res.body).toHaveProperty("dateOut");
    // expect(res.body).toHaveProperty("dateReturned");
    // expect(res.body).toHaveProperty("rentalFee");

    // expect(Object.keys(res.body).length).toBe(5);
    expect(Object.keys(res.body)).toEqual(
      expect.arrayContaining([
        "dateOut",
        "dateReturned",
        "rentalFee",
        "customer",
        "movie",
      ])
    );
  });
});
