import morganLogger = require('morgan')
import bodyParser = require('body-parser')
import { static as expressStatic } from 'express'
import path = require('path')
const ObjectId = require('mongodb').ObjectId

export default function Router() {
  return {
    async start({ endpoints, app, logger, mongodb: db, config, rabbitLogger }) {
      //const { host, port } = endpoints.getServiceEndpoint('dataServer')

      const categoriesCollection = db.collection('categories')
      const flowersCollection = db.collection('flowers')
      const ordersCollection = db.collection('orders')
      const usersCollection = db.collection('users')

      app.use(morganLogger('dev'))
      app.use(bodyParser.urlencoded({ extended: false }))
      app.use(bodyParser.json())
      //api
      app.get('/data/categories', (req, res, next) => {
        //console.log(req.protocol + '://' + req.get('host') + req.originalUrl)
        categoriesCollection.find().sort({ DisplayName: 1 }).toArray()
          .then(arr => arr.map(doc => ({ ...doc, __v: undefined })))
          .then(results => {
            const lastItems = results.filter(item => item.Name === "other" || item.Name === "cats")
            const sortItems = results.filter(item => item.Name !== "other" && item.Name !== "cats")
            return [...sortItems, ...lastItems]
          })
          .then(results => results.map(doc => ({ ...doc, _id: doc._id.toHexString() })))
          .then(results => {
            res.json(results)
          })
          .catch(err => res.sendStatus(500))
      })

      app.get('/data/flowers/:catName', (req, res, next) => {
        //console.log(req.protocol + '://' + req.get('host') + req.originalUrl, JSON.stringify(req.params))
        flowersCollection.find({ Category: req.params['catName'] }).sort({ Name: 1 }).toArray()
          .then(arr => arr.map(doc => ({ ...doc, __v: undefined })))
          .then(results => results.map(doc => ({ ...doc, _id: doc._id.toHexString() })))
          .then(results => {
            res.json(results)
          })
          .catch(err => res.sendStatus(500))
      })

      app.get('/data/flowers', (req, res, next) => {
        //console.log(req.protocol + '://' + req.get('host') + req.originalUrl)
        flowersCollection.find().sort({ Name: 1 }).toArray()
          .then(arr => arr.map(doc => ({ ...doc, __v: undefined })))
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
          .then(arr => arr.map(doc => ({ ...doc, __v: undefined })))
          .then(results => results[0])
          .then(result => ({ ...result, _id: result._id.toHexString() }))
          .then(result => {
            //console.log(`result: ${JSON.stringify(result)}`)
            res.json(result)
          })
          .catch(err => res.sendStatus(500))
      })

      app.post('/data/user', async (req, res) => {
        //console.log(req.protocol + '://' + req.get('host') + req.originalUrl)
        const user = {
          userName: req.body.userName,
          password: req.body.password,
          email: req.body.email
        }
        const result = await usersCollection.insertOne(user)
        //console.log(`result: ${result}, user: ${JSON.stringify(user)}`)
        rabbitLogger.log(getUserLogMessage(user))
        return res.sendStatus(201)
      })

      app.post('/data/order', async (req, res) => {
        //console.log(req.protocol + '://' + req.get('host') + req.originalUrl)
        let flowersIn = (req.body.flowers && JSON.parse( req.body.flowers)) || []
        let oIds = flowersIn.map(i => new ObjectId(i))
        //console.log('oids: ', oIds, JSON.stringify(flowersIn))
        const results = await flowersCollection.find({ _id: { $in: oIds } }).toArray()
        const flowers = await results.map(doc => ({ ...doc, _id: doc._id.toHexString() }))
        const order = {
          CustomerName: req.body.customerName,
          CustomerAddress: req.body.customerAddress,
          EmailAddress: req.body.emailAddress,
          Orders: flowers,
          OrderPrice: (flowers.reduce((a, b) => a + b['Price'], 0)).toFixed(2),
          TimeStamp: new Date()
        }
        const result = await ordersCollection.insertOne(order)
        //console.log(`result: ${result}, order: ${JSON.stringify(order)}`)
        rabbitLogger.log(getOrderLogMessage(order))
        return res.sendStatus(201)
      })
    }
  }
}

function getOrderLogMessage(order: any): string {
  return `Successful order!
Ordered items: ${order.Orders.map(item => item.Name).join(', ')}`;
}

function getUserLogMessage(user: any): string {
  return `Successful user registration!
User: ${user.userName}, ${user.email}`;
}