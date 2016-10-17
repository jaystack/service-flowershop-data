const winston = require('winston');
const pkg = require('./package.json');
const app = require('./lib/index').default;

winston.info('Started', pkg.name);
