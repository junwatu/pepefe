const electronWinInstaller = require('electron-winstaller');
const path = require('path');
const info = require('../package.json');

let resultPromise = electronWinInstaller.createWindowsInstaller({
    appDirectory: './build/pepefe-win32-ia32',
    outputDirectory: './build/installer64',
    productName: 'Pepefe',
    authors: 'Equan Pr.',
    title: 'Pepefe',
    exe: 'pepefe.exe',
    iconUrl: "https://raw.githubusercontent.com/junwatu/pepefe/master/book.ico",
    noMsi: true,
    setupExe: `pepefe-${info.version}-win64-setup.exe`,
    setupIcon: path.join(__dirname, '../setup.ico')
});

resultPromise.then(() => console.log("Packaging done!"), (e) => console.log(`No dice: ${e.message}`));
