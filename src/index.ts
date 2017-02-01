import * as express from 'express'
import * as config from 'config'
import * as logger from 'morgan'
import * as mongoose from 'mongoose'
import { flowerSchema, orderSchema, categorySchema } from './flowershopSchemas'
import * as bodyParser from 'body-parser'
import { getServiceAddress } from 'system-endpoints'
import { stringify } from 'querystring'
import * as rascal from 'rascal'

function promisifyCreateBroker(rascal: any, rascalConfig: any) {
    return new Promise((resolve, reject) => {
        return rascal.createBroker(rascalConfig, {}, (err: Error, broker: any) => {
            if (err) {
                console.log("ERROR in createBroker: " + err);
                return reject(err);
            }

            return resolve(broker);
        });
    });
}

function createRascalConnectionString({user, password, vhost, hostname, port, options}, endpointAddress: string) {
  const address = endpointAddress || `${hostname}:${port}`;
  const optionString = stringify(options);
  return `amqp://${user}:${password}@${address}/${vhost}?${optionString}`
}

async function createBroker(rascalConfig) {
  const endpointAddress = getServiceAddress('localhost:5672');
  const connection = createRascalConnectionString(rascalConfig.vhosts.flowershop.connection, endpointAddress);
  const config = { vhosts: { flowershop: { ...rascalConfig.vhosts.flowershop, connection } } };
  return await promisifyCreateBroker(rascal, rascal.withDefaultConfig(config));
}

function createMongoConnetionString({host, port, db}, endpointAddress: string) {
  const address = endpointAddress || `${host}:${port}`;
  return `mongodb://${address}/${db}`;
}

function createMongoConnection(mongoConfig) {
  const endpointAddress = getServiceAddress('localhost:27017')
  const connectionUri = createMongoConnetionString(mongoConfig, endpointAddress)
  mongoose.connect(connectionUri);
}

setTimeout(async function() {

    const broker = await createBroker(config.get('rascal'))

    //init database
    const endpoint = getServiceAddress('localhost:27017')

    createMongoConnection(config.get('mongodb'))
    
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

    app.get('/registration', (req, res, next) => {
        categories.find((err, result) => {
            if (err) return res.sendStatus(500)
            res.json(result)
        })
    })

    app.post('/data/order', (req, res) => {
        let oIds = JSON.parse(req.body.flowers).map(i => new mongoose.Schema.Types.ObjectId(i))
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
                publish(broker, <string>config.get('queuename'), order)
                    .then(() => publish(broker, <string>config.get('loggerQueueName'), getLogObject(getLogMessage(order))))
                    .then(() => res.sendStatus(201))
                    .catch((err) => {
                        console.log(err);
                        res.sendStatus(500);
                    });
            })
        })
    })

    app.listen(3003, () => {
        console.log('app listen on port 3003')
    })

}, 1000);

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

function publish(broker: any, queueName: string, message: any): Promise<void> {
    return new Promise<void>((resolve: Function, reject: Function) => {
        broker.publish(queueName, JSON.stringify(message), (err: Error, publication: any) => {
            if (err) {
                console.log("ERROR in publish");
                return reject(err);
            }

            publication
                .on("success", (messageId: string) => {
                    console.log("Successful publication");
                    return resolve();
                })
                .on("error", (err: Error) => {
                    console.log("ERROR in publication");
                    return reject(err);
                });
        });
    });
}

export default {}