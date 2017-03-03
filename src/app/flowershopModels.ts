import mongoose = require('mongoose')
import { flowerSchema, orderSchema, categorySchema } from './flowershopSchemas'

export const flowers = mongoose.model('flowers', flowerSchema)
export const categories = mongoose.model('categories', categorySchema)
export const orders = mongoose.model('orders', orderSchema)