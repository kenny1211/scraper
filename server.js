const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const axios = require("axios");
const cheerio = require("cheerio");
const db = require("./models");
const PORT = process.env.PORT || 3000;
const app = express();

app.set("views", "./views");

app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main"
  })
);

app.set("view engine", "handlebars");

app.use(logger("dev"));

app.use(
  express.urlencoded({
    extended: true
  })
);
app.use(express.json());

app.use(express.static("public"));

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

app.get("/", (req, res) => {
  db.Article
    .find({})
    .then(dbUser => {
      res.render("index");
    })
    .catch(err => {
      res.status(500).json(err);
    });
});

app.get("/scraper", (req, res) => {
  axios.get("https://pitchfork.com/reviews/albums/").then( (response) => {

    const $ = cheero.load(response.data);

    $("div.review").each( (i, element) => {

      const result = {};

      result.title = $(this)
        .children("h2.review__title-album")
        .text();
      
      result.link = "https://pitchfork.com/" + $(this)
        .children("a.review__link")
        .attr("href");
    
      db.Article
        .create(result)
        .then( (dbArticle) => {
          console.log(dbArticle);
        })
        .catch( (err) => {
          return res.json(err);
        });
    });
    res.redirect("/")
  });
});

app.get("articles", (req,res) => {
  db.Article
    .find({})
    .then( dbUser => {
      res.json(dbUser)
    })
    .catch( err => {
      res.json(err);
    });
});

app.get("/articles/:id", (req, res) => {
  db.Article
    .findById(req.params.id)
    .populate("note")
    .then(dbUser => {
      res.json(dbUser)
    })
    .catch(err => {
      res.json(err);
    });
});

app.post("/articles/:id", (req, res) => {
  db.Note
    .create(req.body)
    .then( dbNote => {
      return db.Article.findOneAndUpdate(
        {_id: req.params.id},
        {note: dbNote._id},
        {new: true}
      );
    })
    .then(dbArticle => {
      res.json(dbArticle);
    })
    .catch(err => {
      res.json(err);
    });
});

app.listen(PORT, () => {
  console.log("APP LISTENING ON PORT: " + PORT);
});

