import { flowerSchema, categorySchema } from './flowershopSchemas'
import * as config from 'config'
import * as mongoose from 'mongoose'

if (!mongoose.connection.readyState) {
    mongoose.connect(config.get<string>('mongodb.uri'))
}
const db = mongoose.connection

export class Categories {
    private model
    constructor() {
        this.model = db.model('categories', categorySchema)
    }

    addCategory (category: any) {
        console.log(category)
        return new Promise((resolve, reject) => {
            this.getCategory(category.Name).then((res: any) => {
                if (!res) {
                    try {
                        if (!category) throw new Error('empty category is not supported')
                        let view = new this.model(category)
                        view.save((err, result) => {
                            if (err) return reject(err)
                            console.log(result.Name + ' saved')
                            resolve(result)
                        })
                    } catch (e) {
                        console.log('error at save: ', e)
                        reject(e)
                    }
                    return
                }
                res.save((err, result) => {
                    if (err) return reject(err)
                    console.log(result.Name + ' updated')
                    resolve(result)
                })
                resolve(null)
            }).catch((err) => { console.log('Error:', err) })
        })
    }

    public getCategory(name: string) {
        return new Promise((resolve, reject) => {
            this.model.findOne({ $or: [{ Name: name }] }, (err, res) => {
                if (err) return console.log(err), reject(err)
                resolve(res)
            })
        })
    }
}

export class Flowers {
    private model
    constructor() {
        this.model = db.model('flowers', flowerSchema)
    }

    addFlower (flower: any) {
        console.log(flower)
        return new Promise((resolve, reject) => {
            this.getFlower(flower.Name).then((res: any) => {
                if (!res) {
                    try {
                        if (!flower) throw new Error('empty flower is not supported')
                        let view = new this.model(flower)
                        view.save((err, result) => {
                            if (err) return reject(err)
                            console.log(result.Name + ' saved')
                            resolve(result)
                        })
                    } catch (e) {
                        console.log('error at save: ', e)
                        reject(e)
                    }
                    return
                }
                res.save((err, result) => {
                    if (err) return reject(err)
                    console.log(result.Name + ' updated')
                    resolve(result)
                })
                resolve(null)
            }).catch((err) => { console.log('Error:', err) })
        })
    }

    public getFlower(name: string) {
        return new Promise((resolve, reject) => {
            this.model.findOne({ $or: [{ Name: name }] }, (err, res) => {
                if (err) return console.log(err), reject(err)
                resolve(res)
            })
        })
    }
}