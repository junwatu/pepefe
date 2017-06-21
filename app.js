const express = require("express");
const cheerio = require("cheerio");
const request = require("request");
const fs = require("fs");

var app = express();

const url = "https://www.packtpub.com/packt/offers/free-learning";

app.get("/", (req, res) => {
    request(url, (error, response, html) => {
        
        if (!error) {
            let $ = cheerio.load(html);
        
            let dotdImage = $(".dotd-main-book-image").children().children().last().attr("data-original");
            res.redirect(dotdImage);
        }
    })
}).listen(8000, () => {
    console.log("Hit 8000")
})