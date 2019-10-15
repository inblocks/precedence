const Redis = require('ioredis')

const blocks = require('./blocks')
const defaults = require('./defaults')
const records = require('./records')

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
    const result = await records.getRecord(redisReadOnly, id)
    if (!result) {
      return null
    }
    result.block = await blocks.getProof(
      redisReadOnly,
      result.timestamp,
      Buffer.from(result.provable.id, result.provable.id.match(/^[0-9a-f]*$/i) && result.provable.id.length % 2 === 0 ? 'hex' : 'utf8')
    )
    return result
  }

  const getLastRecord = async (chain) => {
    const id = await getLastRecordId(chain)
    if (!id) {
      return null
    }
    return getRecord(id)
  }

  const getLastRecordId = (chain) => records.getLastRecordId(redisReadOnly, chain)

  const createRecords = (_records, preExec = null) => records.createRecords(redisReadOnly, _records, preExec)

  const deleteRecord = (id) => records.deleteRecord(redisReadOnly, id)

  const deleteChain = (id, data = false) => records.deleteChain(redisReadOnly, id, data)

  const getBlock = (id = null, records = false) => blocks.getBlock(redisReadOnly, id, records)

  const createBlock = async (empty = defaults.block.empty, max = defaults.block.max) => {
    const block = await blocks.createBlock(redisReadOnly, empty, max)
    webhooks && webhooks.add('block', block)
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
