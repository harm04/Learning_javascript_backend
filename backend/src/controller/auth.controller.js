const { validationResult } = require("express-validator");
const { User } = require("../models/user.model");
const { Token } = require("../models/tokens.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailSender = require("../helpers/email.helper");

//register controller
exports.register = async function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    //create a new user
    let user = new User({
      ...req.body,
      passwordHash: bcrypt.hashSync(req.body.password, 8),
    });
    //save the user to the database
    user = await user.save();
    // if saved successfully, return the user details
    // else return an error message
    if (!user) {
      return res.status(500).json({
        type: "Internal server error",
        message: "Error saving user to database",
      });
    }
    return res.status(201).json(user);
  } catch (error) {
    if (error.message.includes("email_1 dup key")) {
      return res
        .status(400)
        .json({ type: "Validation error", message: "Email already exists" });
    }
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

//login controller
exports.login = async function (req, res) {
  try {
    //request email and password from the request body
    const { email, password } = req.body;
    //find the user in the database using the email
    const user = await User.findOne({ email: email });
    //if user not found, return an error message
    if (!user) {
      return res
        .status(404)
        .json({ type: "Not Found", message: "User not found" });
    }

    //if user found, compare the password with the password hash stored in the database
    if (!bcrypt.compareSync(password, user.passwordHash)) {
      return res
        .status(400)
        .json({ type: "Validation error", message: "Invalid password" });
    }
    //if password is correct, generate an access token
    const accessToken = jwt.sign(
      {
        id: user.id,
        isAdmin: user.isAdmin,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "24h" },
    );

    //generate a refresh token
    const refreshToken = jwt.sign(
      {
        id: user.id,
        isAdmin: user.isAdmin,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "60d" },
    );

    //check if token already exists in the database
    const token = await Token.findOne({ userId: user.id });
    //if token exists delete the token from the database and create a new token
    if (token) await token.deleteOne({ userId: user.id });
    //save the token to the database
    await new Token({
      userId: user.id,
      accessToken: accessToken,
      refreshToken: refreshToken,
    }).save();
    user.passwordHash = undefined;
    //return the user details and the access token
    return res.status(200).json({ ...user._doc, accessToken, refreshToken });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

//verify token controller
exports.verifyToken = async function (req, res) {
  try {
    //request access token from the request headers
    let accessToken = req.headers.authorization;
    //no token provided then return false or else replace Bearer with empty string and verify the token
    if (!accessToken) return res.json(false);
    accessToken = accessToken.replace("Bearer ", "").trim();
    //find access token in token model
    const token = await Token.findOne({ accessToken: accessToken });
    //return false if token not found
    if (!token) return res.json(false);
    //decode token data using refreshtoken
    const tokenData = jwt.decode(token.refreshToken);
    //find user in the database using the decoded tokendata.id
    const user = await User.findById(tokenData.id);
    //no user found then return false
    if (!user) return res.json(false);
    //verify the refresh token using the refresh token secret
    const isValid = jwt.verify(
      token.refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    //if token is valid, return true else return false
    if (!isValid) return res.json(false);
    return res.json(true);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

//forgot password controller
exports.forgotPassword = async function (req, res) {
  try {
    //request email from the request body
    const { email } = req.body;
    //find user in the database using the email
    const user = await User.findOne({ email: email });
    //if user not found, return an error message
    if (!user) {
      return res
        .status(404)
        .json({ type: "Not Found", message: "User not found" });
    }
    //generate a random otp
    const otp = Math.floor(1000 + Math.random() * 9000);
    //update otp in usermodel
    user.resetPasswordOtp = otp;
    //set otp expiry time to 10 minutes
    user.resetPasswordOtpExpires = Date.now() + 600000;
    //save the user to the database
    await user.save();
    //send email to the user with the otp
    const response = await mailSender.sendEmail(
      email,
      "Password Reset OTP",

      `Your OTP for password reset is ${otp}. It will expire in 10 minutes.`,
    );
    return res.json({ message: response });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

//verify otp controller
exports.verifyOtp = async function (req, res) {
  try {
    //request email and otp from the request body
    const { email, otp } = req.body;
    //find user in the database using the email
    const user = await User.findOne({ email: email });
    //if user not found, return an error message
    if (!user) {
      return res
        .status(404)
        .json({ type: "Not Found", message: "User not found" });
    }
    //if user found, compare the otp with the otp stored in the database and check if the otp is expired or not
    if (
      user.resetPasswordOtp !== +otp ||
      Date.now() > user.resetPasswordOtpExpires
    ) {
      return res
        .status(401)
        .json({ type: "Unauthorized", message: "Invalid or expired OTP" });
    }

    //if otp is valid, resetPasswordOtp=1 and resetPasswordOtpExpires = undefined
    user.resetPasswordOtp = 1;
    user.resetPasswordOtpExpires = undefined;

    //save the user to the database and return a success message
    await user.save();
    return res.json({ message: "OTP verified successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

//reset password controller
exports.resetPassword = async function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    //request email and new password from the request body
    const { email, newPassword } = req.body;
    //find user in the database using the email
    const user = await User.findOne({ email: email });
    //if user not found, return an error message
    if (!user) {
      return res
        .status(404)
        .json({ type: "Not Found", message: "User not found" });
    }
    //if user found, if resetPasswordOtp is not 1, return an error message
    if (user.resetPasswordOtp !== 1) {
      return res
        .status(401)
        .json({ type: "Unauthorized", message: "OTP not verified" });
    }

    //if resetPasswordOtp is 1, hash the new password
    user.passwordHash = bcrypt.hashSync(newPassword, 8);
    //set resetPasswordOtp to undefined
    user.resetPasswordOtp = undefined;
    //save the user
    await user.save();
    //return a success message
    return res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
