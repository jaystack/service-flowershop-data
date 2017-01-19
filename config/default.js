var path = require('path')
module.exports = {
  "mongodb": {
    "uri": "mongodb://localhost/flowershop"
  },
  "systemEndpoints": path.normalize(__dirname + "/../system-endpoints.json"),
  "sync": true,
  "rascal": {
    "vhosts": {
      "flowershop": {
        "connection": {
          "slashes": true,
          "protocol": "amqp",
          "hostname": "localhost",
          "user": "guest",
          "password": "guest",
          "port": 5672,
          "vhost": "flowershop",
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
          }
        },
        "publications": {
          "sendEmailMQ": {
            "queue": "sendEmailMQ"
          }
        }
      }
    }
  },
  "defer": 1000,
  "queuename": "sendEmailMQ"
}