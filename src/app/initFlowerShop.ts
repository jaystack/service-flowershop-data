import system from './system'

system.start()
  .then(({mongodb: db, logger}) => {
    const categoriesCollection = db.collection('categories')
    const flowersCollection = db.collection('flowers')

    const categoriesData = require('../../../app-flowershop/public/images/categories.json')
    const flowersData = require('../../../app-flowershop/public/images/flowers.json')

    const categoriesPromises = categoriesData.map(category => categoriesCollection.insertOne(category))
    Promise.all(categoriesPromises)
      .then(_ => {
        logger.verbose(`Categories were successfully imported. Number of categories: ${categoriesData.length}`)
        const flowersPromises = flowersData.map(flower => flowersCollection.insertOne(flower))
        return Promise.all(flowersPromises)
      })
      .then(_ => logger.verbose(`Flowers were successfully imported. Number of flowers: ${flowersData.length}`))
      .then(_ => logger.verbose('Data import is finished successfully'))
      .then(_ => system.stop())
      .catch(err => {
        logger.verbose('An error occured during data import:')
        logger.verbose(err)
      })
  })



/*
import { Flowers, Categories } from './FlowerShopModel'

const categories = new Categories()
const flowers = new Flowers()

const categoriesData = require('../../../app-flowershop/public/images/categories.json')
const flowersData = require('../../../app-flowershop/public/images/flowers.json')

let addCategories = (callback) => {
  if (!categoriesData.length) {
    console.log('Categories init finished')
    return flowers.addFlower(flowersData.pop()).then(addFlowers).catch(addFlowers)
  }
  categories.addCategory(categoriesData.pop()).then(addCategories).catch((err) => {
    console.log('err', err)
  })
}

let addFlowers = () => {
  if (!flowersData.length) {
    console.log('Flowers init finished')
    process.exit()
  }
  flowers.addFlower(flowersData.pop()).then(addFlowers).catch((err) => {
    console.log('err', err)
  })
}

categories.addCategory(flowersData.pop()).then(addCategories).catch(addCategories)
*/