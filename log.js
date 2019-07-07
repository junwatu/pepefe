const bunyan = require('bunyan');
const log = bunyan.createLogger({ name: "Pepefe" })

module.exports = { log: log }