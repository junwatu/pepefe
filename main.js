// github.io/junwatu
const urlPacktPub = "https://www.packtpub.com/packt/offers/free-learning";

const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron');
const path = require('path');
const url = require('url');
const cheerio = require("cheerio");
const request = require("request");

let win;
let jsonData = { image: "", title: "", description: "", timeLeft: "" };

function createWindow() {
    win = new BrowserWindow({ width: 680, height: 315, frame: false })

    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    win.webContents.openDevTools()

    win.on('closed', () => {
        win = null
    })
}

app.on('ready', () => {
    createWindow();
    tray = new Tray("book.png");
})

ipcMain.on('asyncData', (event, arg) => {
    request(urlPacktPub, (error, response, html) => {

        if (!error) {
            let $ = cheerio.load(html);

            let dotdImage = $(".dotd-main-book-image").children().children().last().attr("data-original");
            let dotdTitle = $(".dotd-title").children().text();
            let dotdTime = $(".eighteen-days-countdown-bar").html();
            let dotdDescription = $(".dotd-main-book-summary").children().last().prev().text();

            jsonData.image = dotdImage;
            jsonData.title = dotdTitle.trim();
            jsonData.description = dotdDescription.trim();

            event.sender.send('asyncMessage', jsonData);
        } else {
            event.sender.send('asyncMessage', null);
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
})
