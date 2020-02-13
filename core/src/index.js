const defaults = require('./defaults')
const { createBlock, getBlock, getProof } = require('./blocks')
const { getRecord, getRecords, getLastRecordId, createRecords, deleteRecord, deleteChain } = require('./records')

module.exports = (redis, options = defaults) => {

  const webhooks = options.webhooks && options.webhooks.length > 0 && require('./webhook')(redis, options.webhooks)

  const _getRecord = async (id, data = false) => {
    const result = await getRecord(redis, id, data)
    if (!result) {
      return null
    }
    if (!data) {
      result.block = await getProof(redis, result.timestamp, Buffer.from(result.provable.id, 'hex')) || undefined
    }
    return result
  }

  return {
    getRecord: _getRecord,
    getLastRecord: async chain => {
      const id = await getLastRecordId(redis, chain)
      return id ? _getRecord(id) : null
    },
    getLastRecordId: chain => getLastRecordId(redis, chain),
    createRecords: (_records, preExec = null) => createRecords(redis, _records, preExec),
    deleteRecord: id => deleteRecord(redis, id),
    deleteChain: (id, data = false) => deleteChain(redis, id, data),
    getBlock: async (id = null, records = false) => {
      const block = await getBlock(redis, id, records)
      if (block && records && block.records.length > 0) {
        block.records = await getRecords(redis, ...block.records)
      }
      return block
    },
    createBlock: async (empty = defaults.block.empty, max = defaults.block.max) => {
      const block = await createBlock(redis, empty, max)
      if (webhooks) {
        await webhooks.add('block', block)
      }
      return block
    }
  }
}

module.exports.defaults = defaults
