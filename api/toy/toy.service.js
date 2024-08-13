import { ObjectId } from 'mongodb'

import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { utilService } from '../../services/util.service.js'

export const toyService = {
  remove,
  query,
  getById,
  add,
  update,
  addToyMsg,
  removeToyMsg,
}

async function query(filterBy = {}) {
  try {
    const { sortBy, sortByDir } = filterBy
    const criteria = _buildCriteria(filterBy)
    console.log('criteria:', criteria)
    const collection = await dbService.getCollection('toy')
    var toys = await collection
      .find(criteria)
      .sort({ [sortBy]: sortByDir })
      .toArray()

    return toys
  } catch (err) {
    logger.error('cannot find toys', err)
    throw err
  }
}

async function getById(toyId) {
  try {
    const collection = await dbService.getCollection('toy')

    const messages = [{ text: 'Nice toy' }, { text: 'Sup ma dude' }]

    const toyRes = await collection.findOneAndUpdate(
      { _id: ObjectId.createFromHexString(toyId) },
      { $set: { msgs: messages } },
      { returnOriginal: false }
    )
    console.log(toyRes._id.getTimestamp())

    toyRes.createdAt = toyRes._id.getTimestamp()

    return toyRes
  } catch (err) {
    logger.error(`while finding toy ${toyId}`, err)
    throw err
  }
}

async function remove(toyId) {
  try {
    const collection = await dbService.getCollection('toy')
    const { deletedCount } = await collection.deleteOne({
      _id: ObjectId.createFromHexString(toyId),
    })
    return deletedCount
  } catch (err) {
    logger.error(`cannot remove toy ${toyId}`, err)
    throw err
  }
}

// async function getById(toyId) {
//   try {
// 	const collection = await dbService.getCollection('toy')
// 	const toy = await collection.findOne({
// 	  _id: ObjectId.createFromHexString(toyId),
// 	})
// 	toy.createdAt = toy._id.getTimestamp()
// 	return toy
//   } catch (err) {
// 	logger.error(`while finding toy ${toyId}`, err)
// 	throw err
//   }
// }

async function add(toy) {
  try {
    const { name, price, labels } = toy
    const toyToAdd = {
      name,
      price: +price,
      labels,
      inStock: true,
    }
    toyToAdd.labels = toyToAdd.labels.map(label => label.toLowerCase())
    const collection = await dbService.getCollection('toy')
    await collection.insertOne(toyToAdd)
    return toyToAdd
  } catch (err) {
    logger.error('cannot insert toy', err)
    throw err
  }
}

async function update(toy) {
  try {
    const toyToSave = {
      name: toy.name,
      price: +toy.price,
      inStock: toy.inStock,
    }
    const collection = await dbService.getCollection('toy')
    await collection.updateOne(
      { _id: ObjectId.createFromHexString(toy._id) },
      { $set: toyToSave }
    )
    return toy
  } catch (err) {
    logger.error(`cannot update toy ${toy._id}`, err)
    throw err
  }
}

async function addToyMsg(toyId, msg) {
  try {
    msg.id = utilService.makeId()

    const collection = await dbService.getCollection('toy')
    await collection.updateOne(
      { _id: ObjectId.createFromHexString(toyId) },
      { $push: { msgs: msg } }
    )
    return msg
  } catch (err) {
    logger.error(`cannot add toy msg ${toyId}`, err)
    throw err
  }
}

async function removeToyMsg(toyId, msgId) {
  try {
    const collection = await dbService.getCollection('toy')
    await collection.updateOne(
      { _id: ObjectId.createFromHexString(toyId) },
      { $pull: { msgs: { id: msgId } } }
    )
    return msgId
  } catch (err) {
    logger.error(`cannot add toy msg ${toyId}`, err)
    throw err
  }
}

function _buildCriteria(filterBy) {
  console.log(filterBy)
  const { inStock, name, minPrice, labels } = filterBy

  const criteria = {
    name: { $regex: name, $options: 'i' },
    price: { $gte: +minPrice },
  }

  if (labels && labels.length > 0) {
    criteria.labels = { $all: labels };
  }

  if (typeof inStock === 'boolean') {
    criteria.inStock = inStock;
  }

  console.log(labels.length)

  return criteria
}
