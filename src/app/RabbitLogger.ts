export default function RabbitLogger() {
  return {
    async start({ config, rabbitChannel: channel, logger }) {
      return {
        log: function log(logMessage: string) {
          const loggerQueueName = (config.messaging && config.messaging.loggerRequestQueueName) || 'loggerMQ'
          const logObject = getLogObject(logMessage)
          channel.assertQueue(loggerQueueName)
            .then(_ => channel.sendToQueue(loggerQueueName, new Buffer(JSON.stringify(logObject))))
            .catch(err => logger.warn('RabbitMQ error: ' + err.toString()))
        }
      }
    }
  }
}

function getLogObject(message: string, logLevel: string = 'info') {
  return {
    message,
    logLevel,
    timestamp: (new Date()).toISOString()
  }
}