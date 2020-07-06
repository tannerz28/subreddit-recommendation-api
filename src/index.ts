import express from "express";
const app = express();
import redditDataClient from "./lib/redditDataClient";

app.get("/:subreddit", async (req, res) => {
  const subreddit = req.params.subreddit;

  const result = await redditDataClient.getRelated(subreddit);

  if (!result) return res.sendStatus(404);

  res.send(result);
});

const address = "http://localhost";
const port = 8084;
app.listen(port);
console.log(`Subreddit Recommendation API is running on ${address}:${port}`);
