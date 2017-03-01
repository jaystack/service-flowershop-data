import morganLogger = require('morgan')
import bodyParser = require('body-parser')
import { static as expressStatic } from 'express'
import path = require('path')
const ObjectId = require('mongodb').ObjectId

export default function Router() {
  return {
    async start({endpoints, app, logger, mongodb: db, config, requestChannel: ch}) {
      const {host, port} = endpoints.getServiceEndpoint('dataServer')

      const categories = db.collection('categories')
      const flowers = db.collection('flowers')
      const orders = db.collection('orders')

      app.use(morganLogger('dev'))
      app.use(bodyParser.urlencoded({ extended: false }))
      app.use(bodyParser.json())
      //api
      app.get('/data/categories', (req, res, next) => {
        categories.find().toArray()
          .then(arr => arr.map(({_id, Name}) => ({_id, Name})))
          .then(results => {
            res.json(results)
          })
          .catch(err => res.sendStatus(500))
      })

      app.get('/data/flowers/:catName', (req, res, next) => {
        flowers.find({ Category: req.params['catName'] }).toArray()
          .then(results => {
            res.json(results)
          })
          .catch(err => res.sendStatus(500))
      })

      app.get('/data/flowers', (req, res, next) => {
        flowers.find().toArray()
          .then(results => {
            res.json(results)
          })
          .catch(err => res.sendStatus(500))
      })

      app.get('/data/flower\\(:fId\\)', (req, res) => {
        flowers.find({ _id: req.params['fId'] }).toArray()
          .then(results => {
            res.json(results)
          })
          .catch(err => res.sendStatus(500))
      })

      app.get('/registration', (req, res, next) => {
        categories.find().toArray()
          .then(results => {
            res.json(results)
          })
          .catch(err => res.sendStatus(500))
      })

      app.post('/data/order', (req, res) => {
        let oIds = JSON.parse(req.body.flowers).map(i => new ObjectId(i))
        console.log('oids: ', oIds, JSON.parse(req.body.flowers))
        flowers.find({ _id: { $in: JSON.parse(req.body.flowers) } }).toArray()
          .then(flowers => {
            const order = {
              CustomerName: req.body.customerName,
              CustomerAddress: req.body.customerAddress,
              EmailAddress: req.body.emailAddress,
              Orders: flowers,
              OrderPrice: (flowers.reduce((a, b) => a + b['Price'], 0)).toFixed(2)
            }
            return ({result: orders.insert(order), order})
          })
          .then(({result, order}) =>  {
            if (result.nInserted !== 1) return res.sendStatus(500)
            const loggerQueueName = (config.messaging && config.messaging.loggerRequestQueueName) || 'loggerMQ'
            ch.assertQueue(loggerQueueName)
            ch.sendToQueue(loggerQueueName, new Buffer(JSON.stringify(getLogObject(getLogMessage(order)))))
            return res.sendStatus(201)
            // publish(broker, <string>config.get('queuename'), order)
            //     .then(() => publish(broker, <string>config.get('loggerQueueName'), getLogObject(getLogMessage(order))))
            //     .then(() => res.sendStatus(201))
            //     .catch((err) => {
            //         res.sendStatus(500);
            //         //console.log(err);
            //         showErrorMessageAndExit(err);
            //     });
          })
          .catch(err => res.sendStatus(500))
      })
/*
      app.post('/data/order', (req, res) => {
        let oIds = JSON.parse(req.body.flowers).map(i => new ObjectId(i))
        console.log('oids: ', oIds, JSON.parse(req.body.flowers))
        flowers.find({ _id: { $in: JSON.parse(req.body.flowers) } }, (err, flowers) => {
          const order = new orders({
            CustomerName: req.body.customerName,
            CustomerAddress: req.body.customerAddress,
            EmailAddress: req.body.emailAddress,
            Orders: flowers,
            OrderPrice: (flowers.reduce((a, b) => a + b['Price'], 0)).toFixed(2)
          })
          order.save((err, o) => {
            if (err) res.sendStatus(500)
            const loggerQueueName = (config.messaging && config.messaging.requestQueueName) || 'loggerQueue'
            ch.assertQueue(loggerQueueName)
            ch.sendToQueue(loggerQueueName, new Buffer(JSON.stringify(getLogObject(getLogMessage(order)))))
            // publish(broker, <string>config.get('queuename'), order)
            //     .then(() => publish(broker, <string>config.get('loggerQueueName'), getLogObject(getLogMessage(order))))
            //     .then(() => res.sendStatus(201))
            //     .catch((err) => {
            //         res.sendStatus(500);
            //         //console.log(err);
            //         showErrorMessageAndExit(err);
            //     });
          })
        })
      })
*/
      app.listen(port, () => {
        logger.verbose(`service listening on ${host}:${port}`)
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