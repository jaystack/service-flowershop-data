export default async function logToMQ(channel, config, logger, logMessage: string) {
  const loggerQueueName = (config.messaging && config.messaging.loggerRequestQueueName) || 'loggerMQ'
  const logObject = getLogObject(logMessage)
  try {
    await channel.assertQueue(loggerQueueName)
    await channel.sendToQueue(loggerQueueName, new Buffer(JSON.stringify(logObject)))
  } catch(err) {
    logger.warn('RabbitMQ error: ' + err.message + err.stack)
  }
}

function getLogObject(message: string, logLevel: string = 'info') {
  const result = {
    message,
    logLevel
  }
  console.log(`getLogObject - result: ${JSON.stringify(result)}`)
  return result
}