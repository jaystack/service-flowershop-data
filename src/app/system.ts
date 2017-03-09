import System from 'corpjs-system'
import Config, { loaders, processors } from 'corpjs-config'
import MongoDb from 'corpjs-mongodb'
import Endpoints from 'corpjs-endpoints'
import Logger from 'corpjs-logger'
import { App, Server } from 'corpjs-express'
import Amqp from 'corpjs-amqp'
//import MongoDbConfig from './mongoDbConfig'
import Router from './Router'
import RabbitLogger from './RabbitLogger'
const {name} = require('../../package.json')

process.on('unhandledRejection', err => console.error(err))

export default new System()
  .add('config', new Config()
    .add(config => loaders.require({ path: './config/default.js', mandatory: true }))
    .add(config => loaders.require({ path: './config/dev.js', mandatory: false }))
    .add(config => loaders.require({ path: './config/stage.js', mandatory: false }))
    .add(config => loaders.require({ path: './config/live.js', mandatory: false })))
  .add('endpoints', Endpoints()).dependsOn({ component: 'config', source: 'endpoints', as: 'config' })
  //.add('mongoDbConfig', MongoDbConfig()).dependsOn('endpoints')
  //.add('mongodb', MongoDb()).dependsOn('mongoDbConfig')
  .add('mongodb', MongoDb()).dependsOn('endpoints', { component: 'config', source: 'mongodb', as: 'config' })
  .add('logger', Logger()).dependsOn({ component: 'config', source: 'logger', as: 'config' })
  .add('rabbitConn', Amqp.Connection()).dependsOn({ component: 'config', source: 'rabbit', as: 'config' }, 'endpoints')
  .add('rabbitChannel', Amqp.Channel()).dependsOn({ component: 'rabbitConn', as: 'connection' })
  .add('rabbitLogger', RabbitLogger()).dependsOn('config', 'rabbitChannel', 'logger')
  .add('app', App())
  .add('router', Router()).dependsOn('endpoints', 'app', 'logger', 'mongodb', 'config', 'rabbitLogger')
  .add('server', Server()).dependsOn('endpoints', 'app', 'router', { component: 'config', source: 'server', as: 'config' })
  .on('componentStart', (componentName: string) => console.log(`Started component: ${componentName}`))
  .on('componentStop', (componentName: string) => console.log(`Stopped component: ${componentName}`))
  .on('start', (resources) => {
    console.log(`Started service: ${name}`)
    resources.logger.verbose(`Started service: ${name}`)
  })
  .on('stop', (err, stopErr) => {
    console.log(`Stopped service: ${name}`, err || '', stopErr || '')
    console.log((new Date()).toISOString() + ' Stopping finished.')
  })