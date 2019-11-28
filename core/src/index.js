const blocks = require('./blocks')
const defaults = require('./defaults')
const records = require('./records')

module.exports = (redis, options = defaults) => {

  const webhooks = options.webhooks && options.webhooks.length > 0 && require('./webhook')(redis, options.webhooks)

  const getRecord = async (id) => {
    const result = await records.getRecord(redis, id)
    if (!result) {
      return null
    }
    result.block = await blocks.getProof(redis, result.timestamp, Buffer.from(result.provable.id, 'hex'))
    return result
  }

  const getLastRecord = async (chain) => {
    const id = await getLastRecordId(chain)
    if (!id) {
      return null
    }
    return getRecord(id)
  }

  const getLastRecordId = (chain) => records.getLastRecordId(redis, chain)

  const createRecords = (_records, preExec = null) => records.createRecords(redis, _records, preExec)

  const deleteRecord = (id) => records.deleteRecord(redis, id)

  const deleteChain = (id, data = false) => records.deleteChain(redis, id, data)

  const getBlock = (id = null, records = false) => blocks.getBlock(redis, id, records)

  const createBlock = async (empty = defaults.block.empty, max = defaults.block.max) => {
    const block = await blocks.createBlock(redis, empty, max)
    webhooks && await webhooks.add('block', block)
    return block
  }

  return {
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
