//Imports
const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(400).json({ message: "Unauthorized" });
    }
    //Get the token in the hearder request
    const token = req.headers.authorization.replace("Bearer ", "");

    //Get user with this token and get only account info
    const user = await User.findOne({ token: token }).select("account");

    if (!user) {
      return res.status(400).json({ message: "Unauthorized" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(409).json({ message: error.message });
  }
};

//Export
module.exports = isAuthenticated;
