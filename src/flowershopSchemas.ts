import * as mongoose from 'mongoose'

export const flowerSchema = new mongoose.Schema({
    Name: String,
    ImageUrl: String,
    Category: String,
    Price: Number
});

export const categorySchema = new mongoose.Schema({
    Name: String,
    DisplayName: String
})

export const orderSchema = new mongoose.Schema({
    CustomerName: String,
    CustomerAddress: String,
    Orders: [flowerSchema],
    OrderPrice: Number
})