// github.com/junwatu
const url = "https://www.packtpub.com/packt/offers/free-learning";

const cheerio = require("cheerio");
const request = require("request");

let jsonData = { image: "", title: "", description: "", timeLeft: "" };

function DOTDPacktPub() {
    return new Promise((resolve, reject) => {

        request(url, (error, response, html) => {
            if (!error) {
                let $ = cheerio.load(html);

                let dotdImage = $(".dotd-main-book-image").children().children().last().attr("data-original");
                let dotdTitle = $(".dotd-title").children().text();
                let dotdTime = $(".eighteen-days-countdown-bar").html();
                let dotdDescription = $(".dotd-main-book-summary").children().last().prev().text();

                jsonData.image = dotdImage;
                jsonData.title = dotdTitle.trim();
                jsonData.description = dotdDescription.trim();

                resolve(jsonData);
            } else {
                reject(error);
            }
        })
    })
}

module.exports = { dotdPacktPub: DOTDPacktPub };