const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

//start the server

//listen to server
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
