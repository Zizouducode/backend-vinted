//Imports
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");

//Server Creation
const app = express();

//Enable body request and module cors
app.use(express.json());
app.use(cors());

//Connect DB
mongoose.connect(process.env.MONGODB_URI);

//Create routes

const userRoutes = require("./routes/user");
app.use(userRoutes);

const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

app.all("*", (req, res) => {
  res.status(400).json({ error: "This route does not exist" });
});

//Start server
app.listen(process.env.PORT, () => {
  console.log("Server started");
});
