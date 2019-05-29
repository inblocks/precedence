const Redis = require('ioredis')

const blocks = require('./blocks')
const defaults = require('./defaults')
const record = require('./records')

module.exports = (options = defaults) => {
  const namespace = options.namespace || defaults.namespace
  const redisHostPort = (options.redis || defaults.redis).split(':')

  const redisReadOnly = new Redis({
    keyPrefix: `${namespace}.`,
    readOnly: true,
    host: redisHostPort[0],
    port: redisHostPort[1],
    maxRetriesPerRequest: null
  })

  const webhooks = (options.webhooks || defaults.webhooks).length > 0 && require('./webhook')(
    redisReadOnly,
    options.webhooks || defaults.webhooks
  )

  const getRecord = async (id) => {
    const result = await record.getRecord(redisReadOnly, id)
    if (!result) {
      return null
    }
    result.block = await blocks.getProof(redisReadOnly, result.timestamp, result.provable.id)
    return result
  }

  const getLastRecord = async (chain) => {
    const id = await getLastRecordId(chain)
    if (!id) {
      return null
    }
    return getRecord(id)
  }

  const getLastRecordId = (chain) => record.getLastRecordId(redisReadOnly, chain)

  const createRecords = (records, preExec = null) => record.createRecords(redisReadOnly, records, preExec)

  const deleteRecord = (id) => record.deleteRecord(redisReadOnly, id)

  const deleteChain = (id, data = false) => record.deleteChain(redisReadOnly, id, data)

  const getBlock = (id = null, records = false) => blocks.getBlock(redisReadOnly, id, records)

  const createBlock = async (empty = defaults.block.empty, max = defaults.block.max) => {
    const block = await blocks.createBlock(redisReadOnly, empty, max)
    setTimeout(() => {
      if (webhooks && block) {
        webhooks.add('block', block)
      }
    }, 0)
    return block
  }

  return {
    redisReadOnly,
    getRecord,
    getLastRecord,
    getLastRecordId,
    createRecords,
    deleteRecord,
    deleteChain,
    getBlock,
    createBlock
  }
}

module.exports.defaults = defaults
