//Imports
const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

//Import model
const Offer = require("../models/Offer");

// Import middelware isAuthenticated
const isAuthenticated = require("../middlewares/isAuthenticated");

//Connect to cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//Function to convert image to Base64 for cloudinary
const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

//Route creation
//// Publish offer
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      // Create new offer
      const product_name = req.body.title;
      const product_description = req.body.description;
      const product_price = req.body.price;
      const brand = req.body.brand;
      const size = req.body.size;
      const condtion = req.body.condition;
      const color = req.body.color;
      const city = req.body.city;
      const owner = req.user;
      if (
        product_description.length >= 500 ||
        product_name >= 50 ||
        product_price >= 100000
      ) {
        return res
          .status(400)
          .json({ message: "Description or Title or Price not correct" });
      }
      const newOffer = new Offer({
        product_name: product_name,
        product_description: product_description,
        product_price: product_price,
        product_details: [
          { brand: brand },
          { size: size },
          { condition: condtion },
          { color: color },
          { city: city },
        ],
        owner: owner,
      });

      if (req.files) {
        // Convert img to Base64 for cloudinary
        const pictureConverted = convertToBase64(req.files.picture);
        // console.log("je suis ici ");
        //Send img to cloudinary
        const offerId = newOffer._id;
        const image = await cloudinary.uploader.upload(pictureConverted, {
          folder: `/vinted/offers/${offerId}`,
          public_id: "preview",
        });

        //Create key product_image in newOffer
        newOffer.product_image = image;
      }

      //Save new offer in DB
      await newOffer.save();

      //Response to client
      res.status(200).json({
        newOffer,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

////Update offer
router.put("/offer/update", isAuthenticated, fileUpload(), async (req, res) => {
  try {
    //Find offer to update
    const offerToUpdateId = req.body.offerToUpdateId;
    const product_name = req.body.title;
    const product_description = req.body.description;
    const product_price = req.body.price;
    const brand = req.body.brand;
    const size = req.body.size;
    const condtion = req.body.condition;
    const color = req.body.color;
    const city = req.body.city;
    const owner = req.user;

    const offerToUpdate = await Offer.findById(offerToUpdateId);

    offerToUpdate.product_name = product_name;
    offerToUpdate.product_description = product_description;
    offerToUpdate.product_price = product_price;
    offerToUpdate.product_details = [
      { brand: brand },
      { size: size },
      { condition: condtion },
      { color: color },
      { city: city },
    ];

    //Upload image to cloudinary if  in req.files exists
    if (req.files) {
      // Convert img to Base64 for cloudinary
      const pictureConverted = convertToBase64(req.files.picture);

      //Upload image and send img to cloudinary
      const offerId = offerToUpdateId;

      const image = await cloudinary.uploader.upload(pictureConverted, {
        folder: `/vinted/offers/${offerId}`,
        public_id: "preview",
      });

      //Update product_image in offer in req.files exists

      offerToUpdate.product_image.secure_url = image.secure_url;
      // offerToUpdate.product_image.public_id = image.public_id;
    }
    //Save offer in DB
    await offerToUpdate.save();

    //Response to client
    res.status(200).json({
      _id: offerToUpdate._id,
      product_name: offerToUpdate.product_name,
      product_description: offerToUpdate.product_description,
      product_price: offerToUpdate.product_price,
      product_details: offerToUpdate.product_details,
      owner: { account: owner.account, _id: owner._id },
      product_image: offerToUpdate.product_image,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

////Delete offer
router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
  const offerToDeleteId = req.params.id;
  const user = req.user;

  try {
    //Find offer
    const offerToDelete = await Offer.findById(offerToDeleteId).populate(
      "owner"
    );

    if (!offerToDelete) {
      return res.status(400).json({ message: "This offer does not exist" });
    }
    //If user is the owner of the offer delete offer in DB et file in cloudinary
    // console.log(user.id);
    // console.log(offerToDelete.owner.id);
    if (user.id === offerToDelete.owner.id) {
      // console.log("je suis la ");
      // console.log(offerToDelete.product_image.public_id);
      if (offerToDelete.product_image) {
        const imageToDelete = await cloudinary.uploader.destroy(
          offerToDelete.product_image.public_id
        );
        const folderToDelete = await cloudinary.api.delete_folder(
          offerToDelete.product_image.folder
        );
      }
      await Offer.findOneAndDelete(offerToDelete._id);

      res.status(200).json({
        message: "Offer deleted in DB and file deleted in cloundinary",
      });
    } else {
      res.status(200).json({
        message: "Unauthorized",
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

////Get all offers
router.get("/offers", async (req, res) => {
  try {
    // const title = req.query.title;
    // const priceMin = req.query.priceMin;

    const { title, priceMin, priceMax, sort, page, viewMore } = req.query;

    const filters = {};
    const sorting = {};

    //If title exists, add key value to object,
    //use regex to fin all the collections with the word in the tilte param inside
    if (title) {
      filters.product_name = new RegExp(title, "i");
    }
    //Check conditions to create priceObject based on params received
    if (priceMin && priceMax) {
      filters.product_price = {
        $gte: Number(priceMin),
        $lte: Number(priceMax),
      };
    } else if (priceMin && !priceMax) {
      filters.product_price = { $gte: Number(priceMin) };
    } else if (!priceMin && priceMax) {
      filters.product_price = { $lte: Number(priceMax) };
    }

    //Check if we need to sort by asc or desc
    if (sort) {
      if (sort === "asc" || sort === "1") {
        sorting.product_price = "asc";
      } else if (sort === "desc" || sort === "-1") {
        sorting.product_price = "desc";
      } else {
        console.log({ message: "sorting paramater is not asc 1 desc or -1" });
      }
    }
    // console.log(sorting);
    //console.log(titleObject);
    //console.log(priceObject);
    //console.log(filters);

    //Pagination
    const limit = 8;
    let skip = 0;

    let productToReturn = viewMore * limit;
    if (page === "1" || !page) {
      skip = skip;
    } else {
      skip = (Number(page) - 1) * limit;
    }

    //Get the offer(s) corresponding to the req params
    const offersToSent = await Offer.find(filters)
      .populate("owner", "account.username")
      .sort(sorting)
      .skip(skip)
      .limit(productToReturn);
    //.select("product_name product_price -_id owner");

    //Get total offers
    const totalOffers = await Offer.countDocuments(filters);

    //Send response to client
    return res
      .status(200)
      .json({
        count: totalOffers,
        offers: offersToSent,
        viewMore: viewMore,
        limit: limit,
      });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

/// Get one offer
router.get("/offer/:id", async (req, res) => {
  try {
    //Find offer with the id sent in params

    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );

    return res.status(200).json({
      offer,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

//Export
module.exports = router;
