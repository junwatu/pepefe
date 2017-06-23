// github.com/junwatu
const url = "https://www.packtpub.com/packt/offers/free-learning";

const cheerio = require("cheerio");
const request = require("request");

let jsonData = { image: "", title: "", description: "", timeLeft: "" };

function DOTDPacktPub() {
    return new Promise((resolve, reject) => {

        request(url, (error, response, html) => {
            if (!error) {
                resolve(queryData(html));
            } else {
                reject(error);
            }
        })
    })
}

function queryData(html) {
    let $ = cheerio.load(html);

    let dotdImage = $(".dotd-main-book-image").children().children().last().attr("data-original");
    let dotdTitle = $(".dotd-title").children().text();
    let dotdTimeLeft = $(".packt-js-countdown").text();
    let dotdDescription = $(".dotd-main-book-summary").children().last().prev().text();

    jsonData.image = dotdImage;
    jsonData.title = dotdTitle.trim();
    jsonData.description = dotdDescription.trim();
    jsonData.timeLeft = dotdTimeLeft;

    return jsonData;
}

function processHTML(arg) {
    let htmlData = queryData(arg);
    return htmlData;
}

module.exports = { dotdPacktPub: DOTDPacktPub, processHTML: processHTML, URL: url };