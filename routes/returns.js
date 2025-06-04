const Joi = require("joi");
const momment = require("moment");
const express = require("express");
const router = express.Router();
const { Rental } = require("../models/rental");
const auth = require("../middleware/auth");
const { Movie } = require("../models/movie");
const validate = require("../middleware/validate");
router.post("/", [auth, validate(validateReturn)], async (req, res) => {
  //res.status(401).send("Unauthorized access. Please log in to return rentals.");
  //   if (!req.body.customerId) {
  //     return res.status(400).send("Customer ID is required.");
  //   }
  //   if (!req.body.movieId) {
  //     return res.status(400).send("Movie ID is required.");
  //   }
  //   const { error } = validateReturn(req.body);
  //   if (error) {
  //     return res.status(400).send(error.details[0].message);
  //   }

  //   const rental = await Rental.findOne({
  //     "customer._id": req.body.customerId,
  //     "movie._id": req.body.movieId,
  //   });
  //   if (!rental) {
  //     return res.status(404).send("Rental not found for this customer/movie.");
  //   }
  //   if (rental.dateReturned) {
  //     return res.status(400).send("Rental already processed.");
  //   }
  //   rental.dateReturned = new Date();
  //   const rentalDays = momment().diff(momment(rental.dateOut), "days");
  //   rental.rentalFee = rentalDays * rental.movie.dailyRentalRate;
  const rental = await Rental.lookup(req.body.customerId, req.body.movieId);

  if (!rental) return res.status(404).send("Rental not found.");

  if (rental.dateReturned)
    return res.status(400).send("Return already processed.");

  rental.return();
  await rental.save();
  await Movie.updateOne(
    { _id: rental.movie._id },
    { $inc: { numberInStock: 1 } }
  );
  return res.send(rental);
});

function validateReturn(req) {
  const schema = {
    customerId: Joi.objectId().required(),
    movieId: Joi.objectId().required(),
  };

  return Joi.validate(req, schema);
}
module.exports = router;
