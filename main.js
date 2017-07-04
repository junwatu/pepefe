// github.io/junwatu

const { app, BrowserWindow, ipcMain, Menu, Tray, dialog } = require('electron');
const path = require('path');
const url = require('url');
const schedule = require("node-schedule");
const Positioner = require("electron-positioner");
const isOnline = require("is-online");

const site = require("./dotdpacktpub");
const { randomColor } = require("./randomcolor");
const Store = require('./store');

// could be override by user
let autohideTime = 30000;
let reloadHour = 7;
let reloadMinute = 45;

let browserWindow;
let dotdBrowserWindow;
let timeLeft;
let updateTimeLeft;

let timeReload = false;
let scheduledReload = false;

let jsonData = { image: "", title: "", description: "", timeLeft: "" };

let autohideRuntimeTimer;
let autohideInitTimer;
let autohideToggleTimer;

let offlineStatus = false;

let rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, new schedule.Range(0, 6)];
rule.hour = reloadHour;
rule.minute = reloadMinute;

function scheduledJob() {
    let z = schedule.scheduleJob(rule, () => {
        timeReload = false;
        updateData();
    })

    return z;
}

function autoHideTimer() {
    let x = setInterval(() => {
        if (browserWindow.isVisible()) {
            browserWindow.hide();
            clearInterval(updateTimeLeft);
        }
    }, autohideTime);

    return x;
}

const store = new Store({
    configName: "user-preferences",
    defaults: {
        "autostart": false,
        "autohide": true,
        "autoreload": {
            "hour": 07,
            "minute": 45
        },
        "autohideTime": 30000
    }
});

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
        showHide();
    })

    const contextMenu = Menu.buildFromTemplate([
        // Disable for production
        { label: 'DevTools', click: showDevTools },

        { label: 'Reload', click: forceReload },
        { label: 'Autostart', type: 'checkbox', click: toggleAutostart },
        { label: 'Autohide', type: 'checkbox', click: toggleAutohide },
        // No ()
        { label: 'Exit', click: quitAllWindows }
    ]);

    function forceReload() {
        console.log('Reload browser content and update data');
    }

    function toggleAutostart() {
        let autostart = store.get("autostart");
        store.set("autostart", !autostart);
    }

    function toggleAutohide() {
        let autohide = store.get("autohide");
        store.set("autohide", !autohide);

        if (browserWindow.isVisible() && !autohide === true) {
            autohideToggleTimer = autoHideTimer();
            console.log("[AutohideMenu] Will autohide...");
        } else {
            if (autohideToggleTimer != null) {
                clearInterval(autohideToggleTimer);
                console.log("[AutohideToggle] Reset...");
            }

            if (autohideRuntimeTimer != null) {
                clearInterval(autohideRuntimeTimer);
                console.log("[AutohideRuntime] Reset...");
            }

            if (autohideInitTimer != null) {
                clearInterval(autohideInitTimer);
                console.log("[AutohideInit] Reset...");
            }
        }
    }

    function showHide() {

        let autohideRuntime = store.get("autohide");

        if (browserWindow.isVisible()) {
            browserWindow.hide();
            clearInterval(updateTimeLeft);

            if (autohideRuntime === true) {
                clearInterval(autohideRuntimeTimer);
            }
        } else {
            browserWindow.show();
            updateTimeLeft = updateInterval();

            if (autohideRuntime === true) {
                autohideRuntimeTimer = autoHideTimer();
                console.log("[ShowHideIcon] Will autohide...");
            }
        };
    }
    tray.setToolTip('Free ebook from PacktPub')
    tray.setContextMenu(contextMenu);

    let bounds = tray.getBounds();
    let positioner = new Positioner(browserWindow);
    positioner.move('trayBottomRight', bounds);

    contextMenu.items.forEach((element) => {

        if (element.label === 'Autohide') {
            let autohideInit = store.get('autohide');
            element.checked = autohideInit;

            if (autohideInit === true) {
                autohideInitTimer = autoHideTimer();
                console.log('[Init] Will close automatically...');
            }
        }

        if (element.label === 'Autostart') {
            element.checked = store.get('autostart');
        }

    }, this);

}

function quitAllWindows() {
    dotdBrowserWindow.destroy();
    browserWindow.destroy();
}

function showDevTools() {
    browserWindow.webContents.toggleDevTools();
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
        // Handle empty data here
        let data = site.processHTML(arg);
        // if(data != undefined) {
        //     browserWindow.webContents.send('asyncMessage', site.processHTML(arg));
        // } else {
        dialog.showMessageBox(browserWindow, { type: "info", message: "Something wrong with Packtpub site?" }, (index) => {
            if (index === 0) {
                if (process.platform !== 'darwin') {
                    app.quit();
                }
            }
        });
        //}
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
            offlineStatus = !status;
            createWindow(true);
        }
        else {
            offlineStatus = status;
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
