import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = process.env.PORT || 4000;
const host = process.env.HOST;

//get a list of jokes
app.get("/api/jokes", (req, res) => {
  const jokes = [
    {
      id: 1,
      title: "A Joke",
      content:
        "Why did the scarecrow win an award? Because he was outstanding in his field!",
    },
    {
      id: 2,
      title: "Another Joke",
      content:
        "Why don't scientists trust atoms? Because they make up everything!",
    },
    {
      id: 3,
      title: "One More Joke",
      content:
        "Why did the chicken join a band? Because it had the drumsticks!",
    },
  ];
  res.json(jokes);
});

app.listen(port, () => {
  console.log(`App listening at ${host}:${port}`);
});
