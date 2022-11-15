//Imports
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(
  "sk_test_51M4OpMCacX0zWTEQk37OZgvdNhYJc9npcLsoKABny9wHb4Nei8ugUBqZlBfl3JT8LGHHM0yVRr1ASQwP3MdzS0Se00QmPs1NRy"
);

const Offer = require("../models/Offer");

//Payment route
router.post("/payment", async (req, res) => {
  //Send payment request to stripe
  try {
    //Get offer details from DB
    console.log(req.body);
    const responseOffer = await Offer.findById(req.body.offerId);
    console.log(responseOffer);
    // console.log(responseOffer.data.offer.product_price);
    const stripeToken = req.body.stripeToken;
    // console.log(req.body.stripeToken);
    const response = await stripe.charges.create({
      amount: responseOffer.product_price * 100,
      currency: "eur",
      description: responseOffer.product_name,
      source: stripeToken,
    });
    console.log(response);
    //Delete offer
    // const responseDelete = await axios.delete

    res.status(200).json(responseOffer);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
});

//Export
module.exports = router;
