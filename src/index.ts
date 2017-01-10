import * as express from 'express'
import * as config from 'config'
import * as logger from 'morgan'
import * as mongoose from 'mongoose'
import { flowerSchema, orderSchema, categorySchema } from './flowershopSchemas'
import * as bodyParser from 'body-parser'
import { getServiceEndPoint } from 'system-endpoints'

setTimeout(function () {

  //init database
  const endpoint = getServiceEndPoint('localhost:27017') || { host: "localhost", port: 27017 }

  console.log('////////////', endpoint)
  mongoose.connect(`mongodb://${endpoint.host}/flowershop`)
  const db = mongoose.connection;
  const flowers = mongoose.model('flowers', flowerSchema)
  const categories = mongoose.model('categories', categorySchema)
  const orders = mongoose.model('orders', orderSchema)

  //init express
  let app = express()

  app.use(logger('dev'))
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())
  //api
  app.get('/data/categories', (req, res, next) => {
    categories.find((err, result) => {
      if (err) return res.sendStatus(500)
      res.json(result)
    })
  })

  app.get('/data/flowers/:catName', (req, res, next) => {
    flowers.find({ Category: req.params['catName'] }, (err, docs) => {
      if (err) return res.sendStatus(500)
      res.json(docs)
    })
  })


  app.get('/data/flowers', (req, res, next) => {
    flowers.find((err, docs) => {
      if (err) return res.sendStatus(500)
      res.json(docs)
    })
  })

  app.get('/data/flower\\(:fId\\)', (req, res) => {
    flowers.findById(req.params['fId'], (err, docs) => {
      if (err) return res.sendStatus(500)
      res.json(docs)
    })
  })

  app.post('/data/order', (req, res) => {
    let oIds = JSON.parse(req.body.flowers).map(i => new mongoose.Schema.Types.ObjectId(i))
    console.log('oids: ', oIds, JSON.parse(req.body.flowers))
    flowers.find({ _id: { $in: JSON.parse(req.body.flowers) } }, (err, flowers) => {
      let order = new orders({
        CustomerName: req.body.customerName,
        CustomerAddress: req.body.customerAddress,
        Orders: flowers,
        OrderPrice: (flowers.reduce((a, b) => a + b['Price'], 0)).toFixed(2)
      })
      order.save((err, o) => {
        if (err) res.sendStatus(500)
        res.sendStatus(201)
      })
    })
  })

  app.listen(3003, () => {
    console.log('app listen on port 3003')
  })

}, 1000);
export default {}