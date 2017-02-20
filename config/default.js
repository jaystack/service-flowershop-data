var path = require('path')
module.exports = {
  "mongodb": {
    "host": "localhost",
    "port": 27017,
    "db": "flowershop",
    "uri": "mongodb://localhost:27017/flowershop"
  },
  "systemEndpoints": {
    "host": path.normalize(__dirname + "/../system-endpoints.json"),
    "sync": true,
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