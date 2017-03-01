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