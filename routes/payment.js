//Imports
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(
  "sk_test_51M4OpMCacX0zWTEQk37OZgvdNhYJc9npcLsoKABny9wHb4Nei8ugUBqZlBfl3JT8LGHHM0yVRr1ASQwP3MdzS0Se00QmPs1NRy"
);
const cloudinary = require("cloudinary").v2;
const Offer = require("../models/Offer");

//Connect to cloudinary
//Connect to cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
      amount: req.body.totalPrice * 100,
      currency: "eur",
      description: responseOffer.product_name,
      source: stripeToken,
    });
    console.log(response.status);
    //Delete offer in DB and image on Cloudinary
    // const responseDelete = await axios.delete
    // if (responseOffer.product_image) {
    //   const imageToDelete = await cloudinary.uploader.destroy(
    //     responseOffer.product_image.public_id
    //   );
    //   const folderToDelete = await cloudinary.api.delete_folder(
    //     responseOffer.product_image.folder
    //   );
    // }
    // const offerDeleted = await Offer.findOneAndDelete(req.body.offerId);
    // console.log(offerDeleted);
    res.status(200).json(response.status);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
});

//Export
module.exports = router;
