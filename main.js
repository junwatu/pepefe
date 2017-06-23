// github.io/junwatu

const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron');
const path = require('path');
const url = require('url');
const Positioner = require("electron-positioner");

const site = require("./dotdpacktpub");
const { randomColor } = require("./randomcolor");

let browserWindow;
let dotdBrowserWindow;
let timeLeft;
let updateTimeLeft;

let jsonData = { image: "", title: "", description: "", timeLeft: "" };

function createWindow() {
    browserWindow = new BrowserWindow({ width: 730, height: 250, frame: false, skipTaskbar: true });

    browserWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    browserWindow.on('closed', () => {
        browserWindow = null
    })

    browserWindow.webContents.executeJavaScript(`document.body.style.backgroundColor="#${randomColor()}"`);    
}

function loadDOTD() {
    dotdBrowserWindow = new BrowserWindow({ show: false });
    dotdBrowserWindow.loadURL(site.URL);
    dotdBrowserWindow.webContents.on('dom-ready', (event, url) => {
        updateTimeLeft = updateTime();
    })
}

function updateTime() {
    let update = setInterval(() => {
        getTimeLeft();
    }, 1000);
    return update;
}

function getTimeLeft() {
    if(dotdBrowserWindow != null){
        dotdBrowserWindow.webContents.executeJavaScript('require("electron").ipcRenderer.send("HTMLData", document.getElementsByClassName("packt-js-countdown")[0].innerHTML);');
    }
}

app.on('ready', () => {
    // Should be scheduled
    loadDOTD();

    createWindow();
    
    browserWindow.webContents.once('ready-to-show', () => {

    })
    
    tray = new Tray("book.png");
    tray.on('click', () => {
        if (browserWindow.isVisible()) { 
            browserWindow.hide();
            clearInterval(updateTimeLeft);
        } else { 
            browserWindow.show();
            updateTimeLeft = updateTime();
        };
    })

    const contextMenu = Menu.buildFromTemplate([
        { label: 'DevTools', click: showDevTools },
        { label: 'Settings' },
        { label: 'Autostart', type: 'checkbox' },
        
        // No ()
        { label: 'Exit', click: quitAllWindows }
    ]);

    function quitAllWindows() {
        dotdBrowserWindow.destroy();
        browserWindow.destroy();
    }

    function showDevTools() {
        browserWindow.webContents.toggleDevTools();
    }

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

ipcMain.on('HTMLData', (event, arg) => {
    timeLeft = site.processHTML(arg);
    let stringCommand = `document.getElementById("book-time-left").innerHTML="${timeLeft}"`;
    browserWindow.webContents.executeJavaScript(stringCommand);
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
