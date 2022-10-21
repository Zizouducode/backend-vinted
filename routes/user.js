//Imports
const express = require("express");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const User = require("../models/User");
//Routes creation

//Connect to cloudinary
cloudinary.config({
  cloud_name: "drvzc7x1z",
  api_key: "968927151259927",
  api_secret: "xDBGdP6ESsAzIxjMlxGncwYbqDk",
});

//Function to convert image to Base64 for cloudinary
const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

///Signup route
router.post("/user/signup", fileUpload(), async (req, res) => {
  const { username, email, password, newsletter } = req.body;

  try {
    //Check if user is existing in base
    const userToCheck = await User.findOne({
      email: email,
    });

    if (userToCheck) {
      return res.status(409).json({ message: "User already exists" });
    }

    //Check if username is filled and !== from empty string

    if (!username) {
      return res.status(400).json({ message: "Username needs to be filled" });
    }

    //Create secured password and token
    const salt = uid2(16);
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(64);

    //Create new user
    const newUser = new User({
      email: email,
      account: {
        username: username,
        //avatar: null, // nous verrons plus tard comment uploader une image
      },
      newsletter: newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });

    //Add avatar to user if req.files exist
    if (req.files) {
      // Convert img to Base64 for cloudinary
      const pictureConverted = convertToBase64(req.files.picture);

      //Send img to cloudinary
      const userId = newUser._id;
      const image = await cloudinary.uploader.upload(pictureConverted, {
        folder: `/vinted/users/${userId}`,
        public_id: "preview",
      });
      //Create key product_image in newOffer
      newUser.account.avatar = image;
    }

    //Save new user
    await newUser.save();
    res.status(200).json({
      _id: newUser._id,
      token: newUser.token,
      account: {
        username: newUser.account.username,
        avatar: newUser.account.avatar,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

///LogIn route
router.post("/user/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    //Get user
    userToLogIn = await User.findOne({ email: email });
    //Check if user exists
    if (userToLogIn.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    //Check if hash is the same
    salt = userToLogIn.salt;
    const hashToCheck = SHA256(password + salt).toString(encBase64);
    if (userToLogIn.hash !== hashToCheck) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      _id: userToLogIn._id,
      token: userToLogIn.token,
      account: { username: userToLogIn.account.username },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Export
module.exports = router;
