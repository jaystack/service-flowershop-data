import System from 'corpjs-system'
import Config, { loaders, processors } from 'corpjs-config'
import MongoDb from 'corpjs-mongodb'
import Endpoints from 'corpjs-endpoints'
import Logger from 'corpjs-logger'
import { App, Server } from 'corpjs-express'
import Amqp from 'corpjs-amqp'
import Router from './router'
import RabbitLogger from './RabbitLogger'
const { name } = require('../../package.json')

export default new System({ name })
  .add('config', new Config()
    .add(config => loaders.require({ path: './config/default.js', mandatory: true }))
    .add(config => loaders.require({ path: './config/dev.js', mandatory: false }))
    .add(config => loaders.require({ path: './config/stage.js', mandatory: false }))
    .add(config => loaders.require({ path: './config/live.js', mandatory: false }))
    .add(config => loaders.require({ path: './config/molinio.json', mandatory: false }))
  )
  .add('endpoints', Endpoints()).dependsOn({ component: 'config', source: 'endpoints', as: 'config' })
  .add('mongodb', MongoDb()).dependsOn('endpoints', { component: 'config', source: 'mongodb', as: 'config' })
  .add('logger', Logger()).dependsOn({ component: 'config', source: 'logger', as: 'config' })
  .add('rabbitConn', Amqp.Connection()).dependsOn({ component: 'config', source: 'rabbit', as: 'config' }, 'endpoints').ignorable()
  .add('rabbitChannel', Amqp.Channel()).dependsOn({ component: 'rabbitConn', as: 'connection' }).ignorable()
  .add('rabbitLogger', RabbitLogger()).dependsOn('config', 'rabbitChannel', 'logger').ignorable()
  .add('app', App())
  .add('router', Router()).dependsOn('endpoints', 'app', 'logger', 'mongodb', 'config', 'rabbitLogger')
  .add('server', Server()).dependsOn('endpoints', 'app', 'router', { component: 'config', source: 'server', as: 'config' })
  .logAllEvents()
