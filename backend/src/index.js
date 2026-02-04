import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./backend/.env",
});
const app = express();
const port = process.env.PORT || 4000;
const host = process.env.HOST;

//approach 2: connect to database first in different file, then start the server

connectDB();

// approach 1 : function to connect to database and start the server
// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     app.on("error", (err) => {
//       console.error(
//         "Database connection error. App cannot talk to database:",
//         err
//       );
//     });
//     app.listen(port, () => {
//       console.log(`App listening at ${host}:${port}`);
//     });
//   } catch (error) {
//     console.error("Error connecting to the database:", error);
//   }
// })();
