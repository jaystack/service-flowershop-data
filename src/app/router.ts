import morganLogger = require('morgan')
import bodyParser = require('body-parser')
import { static as expressStatic } from 'express'
import path = require('path')
const ObjectId = require('mongodb').ObjectId

export default function Router() {
  return {
    async start({ endpoints, app, logger, mongodb: db, config, requestChannel: ch }) {
      const { host, port } = endpoints.getServiceEndpoint('dataServer')

      const categoriesCollection = db.collection('categories')
      const flowersCollection = db.collection('flowers')
      const ordersCollection = db.collection('orders')

      app.use(morganLogger('dev'))
      app.use(bodyParser.urlencoded({ extended: false }))
      app.use(bodyParser.json())
      //api
      app.get('/data/categories', (req, res, next) => {
        //console.log(req.protocol + '://' + req.get('host') + req.originalUrl)
        categoriesCollection.find().toArray()
          .then(arr => arr.map(({ _id, Name }) => ({ _id, Name })))
          .then(results => results.map(doc => ({ ...doc, _id: doc._id.toHexString() })))
          .then(results => {
            res.json(results)
          })
          .catch(err => res.sendStatus(500))
      })

      app.get('/data/flowers/:catName', (req, res, next) => {
        //console.log(req.protocol + '://' + req.get('host') + req.originalUrl, JSON.stringify(req.params))
        flowersCollection.find({ Category: req.params['catName'] }).toArray()
          .then(results => results.map(doc => ({ ...doc, _id: doc._id.toHexString() })))
          .then(results => {
            res.json(results)
          })
          .catch(err => res.sendStatus(500))
      })

      app.get('/data/flowers', (req, res, next) => {
        //console.log(req.protocol + '://' + req.get('host') + req.originalUrl)
        flowersCollection.find().toArray()
          .then(results => results.map(doc => ({ ...doc, _id: doc._id.toHexString() })))
          .then(results => {
            //console.log(JSON.stringify(results))
            return results
          })
          .then(results => {
            res.json(results)
          })
          .catch(err => res.sendStatus(500))
      })

      app.get('/data/flower\\(:fId\\)', (req, res) => {
        //console.log(req.protocol + '://' + req.get('host') + req.originalUrl, JSON.stringify(req.params))
        flowersCollection.find({ _id: new ObjectId(req.params['fId']) }).toArray()
          .then(results => results[0])
          .then(result => ({ ...result, _id: result._id.toHexString() }))
          .then(result => {
            console.log(`result: ${JSON.stringify(result)}`)
            res.json(result)
          })
          .catch(err => res.sendStatus(500))
      })

      app.get('/registration', (req, res, next) => {
        //console.log(req.protocol + '://' + req.get('host') + req.originalUrl)
        categoriesCollection.find().toArray()
          .then(results => {
            res.json(results)
          })
          .catch(err => res.sendStatus(500))
      })

      app.post('/data/order', async (req, res) => {
        //console.log(req.protocol + '://' + req.get('host') + req.originalUrl)
        let oIds = JSON.parse(req.body.flowers).map(i => new ObjectId(i))
        //console.log('oids: ', oIds, JSON.parse(req.body.flowers))
        const results = await flowersCollection.find({ _id: { $in: oIds } }).toArray()
        const flowers = await results.map(doc => ({ ...doc, _id: doc._id.toHexString() }))
        const order = {
          CustomerName: req.body.customerName,
          CustomerAddress: req.body.customerAddress,
          EmailAddress: req.body.emailAddress,
          Orders: flowers,
          OrderPrice: (flowers.reduce((a, b) => a + b['Price'], 0)).toFixed(2)
        }
        const result = await ordersCollection.insertOne(order)
        //console.log(`result: ${result.constructor}, order: ${JSON.stringify(order)}`)
        //console.log(`result["ok"]: ${result["ok"]}`, `${result}`)
        //if (result.ok !== 1) return res.sendStatus(500)
        //console.log(`order._id: '${order["_id"]}'`)
        const loggerQueueName = (config.messaging && config.messaging.loggerRequestQueueName) || 'loggerMQ'
        await ch.assertQueue(loggerQueueName)
        await ch.sendToQueue(loggerQueueName, new Buffer(JSON.stringify(getLogObject(getLogMessage(order)))))
        return res.sendStatus(201)
      })
    }
  }
}

function getLogMessage(order: any): string {
  return `Successful order!
Ordered items: ${order.Orders.map(item => item.Name).join(', ')}`;
}

function getLogObject(message: string, logLevel: string = 'info') {
  return {
    message,
    logLevel
  }
}