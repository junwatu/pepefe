// github.io/junwatu

const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron');
const path = require('path');
const url = require('url');
const schedule = require("node-schedule");
const Positioner = require("electron-positioner");
const isOnline = require("is-online");

const site = require("./dotdpacktpub");
const { randomColor } = require("./randomcolor");
const Store = require('./store');

let browserWindow;
let dotdBrowserWindow;
let timeLeft;
let updateTimeLeft;

let timeReload = false;
let scheduledReload = false;

let jsonData = { image: "", title: "", description: "", timeLeft: "" };

let rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, new schedule.Range(0, 6)];
rule.hour = 7;
rule.minute = 45;

function scheduledJob() {
    let z = schedule.scheduleJob(rule, () => {
        timeReload = false;
        updateData();
    })

    return z;
}

function createWindow(onlineStatus) {
    browserWindow = new BrowserWindow({ width: 730, height: 245, frame: false, skipTaskbar: true });
    // Performance (?)
    let randomAwesomeColor = `document.body.style.background="linear-gradient(135deg, #${randomColor()} 0%, #${randomColor()} 100%)";`;
    browserWindow.webContents.executeJavaScript(randomAwesomeColor);

    if (onlineStatus === true) {

        browserWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file:',
            slashes: true
        }))

        scheduledJob(null);

    } else {
        browserWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'offline.html'),
            protocol: 'file:',
            slashes: true
        }))
    }

    browserWindow.on('closed', () => {
        browserWindow = null;
    })

    tray = new Tray("book.png");
    tray.on('click', () => {
        if (browserWindow.isVisible()) {
            browserWindow.hide();
            clearInterval(updateTimeLeft);
        } else {
            browserWindow.show();
            updateTimeLeft = updateInterval();
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

    const store = new Store({
        configName: "preferences",
        defaults: {
            "autostart": false,
            "autohide": true
        }
    });
}

function loadDOTD() {
    dotdBrowserWindow = new BrowserWindow({ show: false });
    dotdBrowserWindow.loadURL(site.URL);
}

function updateInterval() {
    let updateTime = setInterval(() => {
        try {
            dotdBrowserWindow.webContents.executeJavaScript('require("electron").ipcRenderer.send("HTMLData", document.getElementsByClassName("packt-js-countdown")[0].innerHTML);');
        } catch (error) {
            console.log(error);
        }
    }, 1000);

    return updateTime;
}

function updateData() {

    if (dotdBrowserWindow != null) {
        // Should check force reload flag, schedule time to reload.
        if (timeReload) {
            updateTimeLeft = updateInterval();

        } else {
            dotdBrowserWindow.webContents.executeJavaScript('require("electron").ipcRenderer.send("HTMLData", document.body.innerHTML);');
        }
    }
}

async function getOnlineStatus() {
    let onlineStatus = await isOnline();
    return onlineStatus;
}

ipcMain.on('asyncData', (event, arg) => {

    dotdBrowserWindow.webContents.on('dom-ready', (event, url) => {
        updateData();
    })
})

ipcMain.on('HTMLData', (event, arg) => {

    if (timeReload) {
        let stringCommand = `document.getElementById("book-time-left").innerHTML="${arg}"`;
        browserWindow.webContents.executeJavaScript(stringCommand);
    } else {
        browserWindow.webContents.send('asyncMessage', site.processHTML(arg));
    }
})

ipcMain.on('hiddenLoader', () => {
    browserWindow.webContents.executeJavaScript('document.getElementById("loaderUI").style.display = "none";');
    timeReload = true;
    updateData();
})

app.on('ready', () => {
    
    loadDOTD();

    getOnlineStatus().then((status) => {
        if (status === true) {
            createWindow(true);
        }
        else {
            createWindow(false);
        }
    });
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
