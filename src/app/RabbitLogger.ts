export default function RabbitLogger() {
  return {
    async start({ config, rabbitChannel: channel, logger }) {
      return {
        log: async function log(logMessage: string) {
          const loggerQueueName = (config.messaging && config.messaging.loggerRequestQueueName) || 'loggerMQ'
          const logObject = getLogObject(logMessage)
          if (channel) {
            try {
              await channel.assertQueue(loggerQueueName)
              await channel.sendToQueue(loggerQueueName, new Buffer(JSON.stringify(logObject)))
            } catch (err) {
              logger.warn(err) // system shouldn't stop if rabbitmq is down
            }
          }
        }
      }
    }
  }
}

function getLogObject(message: string, logLevel: string = 'info', timestamp: Date = new Date()) {
  return {
    message,
    logLevel,
    timestamp: timestamp.toISOString()
  }
}