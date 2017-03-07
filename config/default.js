const winston = require('winston')
const path = require('path')
const mkdirp = require('mkdirp')

// prepare logger folder & filename
const loggerDir = "./log"
const loggerFileName = path.join(loggerDir, "all-logs.log")
// winston logger needs and existing folder
mkdirp(loggerDir, function (err) {
    if (err) return console.error(err)
    return console.log(`Log folder: '${loggerDir}' ('${loggerFileName}')`)
});

// set config options
module.exports = {
  endpoints: {
    _systemEndpoints_: "endpoints.json",
    endpointsFilePath: "system-endpoints.json"
  },
  server: {
    port: 3003
  },
  mongodb: {
    db: "flowershop",
    _uri_: "Needed by `npm run init`",
    uri: "mongodb://localhost/flowershop"
  },
  logger: {
    transportFactories: [
      () => new winston.transports.Console({
        level: "debug",
        handleExceptions: true,
        json: false,
        colorize: true,
        timestamp: true
      }),
      () => new winston.transports.File({
        level: "info",
        filename: loggerFileName
        ,handleExceptions: true
        ,json: true
        ,maxsize: 5242880
        ,maxFiles: 5
        ,colorize: false
        ,timestamp: true
      })
    ]
  },
  rabbit: {
    connection: {
      username: 'guest',
      password: 'guest'
    }
  },
  messaging: {
    loggerRequestQueueName: 'loggerMQ',
    sendEmailRequestQueueName: 'sendEmailMQ'
  },
  "rascal": {
    "vhosts": {
      "flowershop": {
        "connection": {
          "protocol": "amqp",
          "hostname": "localhost",
          "user": "guest",
          "password": "guest",
          "port": 5672,
          "vhost": "/",
          "options": {
            "heartbeat": 5
          }
        },
        "queues": {
          "sendEmailMQ": {
            "options": {
              "arguments": {
                "x-message-ttl": 60000,
                "x-max-length": 5000
              }
            }
          },
          "loggerMQ": {
            "options": {
              "arguments": {
                "x-message-ttl": 60000,
                "x-max-length": 5000
              }
            }
          }
        },
        "publications": {
          "sendEmailMQ": {
            "queue": "sendEmailMQ"
          },
          "loggerMQ": {
            "queue": "loggerMQ"
          }
        }
      }
    }
  },
  "defer": 1000,
  "queuename": "sendEmailMQ",
  "loggerQueueName": "loggerMQ"
}