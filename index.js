const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const dns = require("dns");
require("dotenv").config({ path: "sample.env" });
const { MongoClient } = require("mongodb");

const uri = process.env.DB_URI;

console.log(uri);
const client = new MongoClient(uri);
const db = client.db("urlshortener");
const urls = db.collection("urls");

// Middleware for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.post("/api/shorturl", (req, res) => {
  const url = req.body.url;
  const dnslookup = dns.lookup(new URL(url).hostname, async (err, address) => {
    if (!address) {
      res.json({ error: "Invalid URL" });
    } else {
      const urlCount = await urls.countDocuments({});
      const urlDoc = {
        url,
        short_url: urlCount,
      };
      const result = await urls.insertOne(urlDoc);
      console.log(result);
      res.json({
        original_url: url,
        short_url: urlCount,
      });
    }
  });
});

app.get("/api/shorturl/:url", async (req, res) => {
  const shorturl = req.params.url;
  const urlDoc = await urls.findOne({ short_url: +shorturl });
  res.redirect(urlDoc.url);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
