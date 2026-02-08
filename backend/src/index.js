//imports
const express = require("express");
const dotenv = require("dotenv").config();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");

//variables
const app = express();
const env = process.env;
const port = env.PORT || 3000;
const host = env.HOST;
const API= env.API_URL;

//middleware
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(
  cors({
    origin: "*", // Allow all origins for testing
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

//routes
const authRouter = require("./routes/auth");

app.use(`${API}/`, authRouter);

//connect to mongodb
mongoose
  .connect(env.MONGODB_URL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.log("Error connecting to MongoDB:", error);
  });

//listen to server
app.listen(port, host, () => {
  console.log(`Server is running on ${host}:${port}`);
});
