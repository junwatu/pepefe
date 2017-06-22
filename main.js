// github.io/junwatu

const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron');
const path = require('path');
const url = require('url');
const Positioner = require("electron-positioner");

const site = require("./dotdpacktpub");

let browserWindow;
let jsonData = { image: "", title: "", description: "", timeLeft: "" };

function createWindow() {
    browserWindow = new BrowserWindow({ width: 730, height: 270, frame: false, skipTaskbar: true })


    browserWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    browserWindow.webContents.openDevTools();

    browserWindow.on('closed', () => {
        browserWindow = null
    })
}

app.on('ready', () => {
    createWindow();
    tray = new Tray("book.png");
    tray.on('click', () => {
        browserWindow.isVisible() ? browserWindow.hide() : browserWindow.show();
    })
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Reload', role: 'reload' },
        { label: 'Exit', role: 'quit' }
    ]);

    tray.setContextMenu(contextMenu);

    let bounds = tray.getBounds();
    let positioner = new Positioner(browserWindow);
    positioner.move('trayBottomRight', bounds);
})


async function getDOTD() {
    let data = await site.dotdPacktPub();
    return data;
}

ipcMain.on('asyncData', (event, arg) => {
    try {
        getDOTD().then(jsonDotdData => event.sender.send('asyncMessage', jsonDotdData));
    } catch (error) {
        event.sender.send('asyncMessage', null);
    }
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

app.on('activate', () => {
    if (browserWindow === null) {
        createWindow();
    }
})
