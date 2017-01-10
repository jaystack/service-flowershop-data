var path = require('path')
module.exports = {
  "mongodb": {
    "uri": "mongodb://localhost/flowershop"
  },
  "systemEndpoints": path.normalize(__dirname + "/../system-endpoints.json"),
  "sync": true
}