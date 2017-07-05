const fs = require('fs');
const archiver = require('archiver');
const baseFileName = require('../package.json').name;
const path = require('path');

const output = fs.createWriteStream(path.join(__dirname, '../build', `${baseFileName}-win32-ia32.zip`));
const archive = archiver('zip', {
    zlib: { level: 9 }
});

output.on('close', () => {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');
});

archive.on('close', () => {
    console.log('zip ok!');
})

archive.on('error', (e) => {
    console.log(e);
})

archive.pipe(output);
archive.directory(path.join('build', `${baseFileName}-win32-ia32`), false);
archive.finalize();
