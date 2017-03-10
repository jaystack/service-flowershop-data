export default function RabbitLogger() {
  return {
    async start({ config, rabbitChannel: channel, logger }) {
      return {
        log: async function log(logMessage: string) {
          const loggerQueueName = (config.messaging && config.messaging.loggerRequestQueueName) || 'loggerMQ'
          const logObject = getLogObject(logMessage)
          if (channel) {
            await channel.assertQueue(loggerQueueName)
            await channel.sendToQueue(loggerQueueName, new Buffer(JSON.stringify(logObject)))
          }
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