const defaults = require('./defaults')
const { createBlock, getBlock, getProof } = require('./blocks')
const { getRecord, getRecords, getLastRecordIds, createRecords, deleteRecord, deleteChain } = require('./records')

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
      const id = (await getLastRecordIds(redis, chain))[0]
      return id ? _getRecord(id) : null
    },
    getLastRecordIds: (...chains) => getLastRecordIds(redis, ...chains),
    createRecords: (_records, preExec = null) => createRecords(redis, _records, preExec),
    deleteRecord: (id, preExec) => deleteRecord(redis, id, preExec),
    deleteChain: (id, preExec) => deleteChain(redis, id, preExec),
    getBlock: async (id = null, records = false) => {
      const block = await getBlock(redis, id, records)
      if (block && records && block.records.length > 0) {
        block.records = await getRecords(redis, ...block.records)
      }
      return block
    },
    createBlock: async (empty = defaults.block.empty, max = defaults.block.max, preExec) => {
      const block = await createBlock(redis, empty, max, preExec)
      if (webhooks) {
        await webhooks.add('block', block)
      }
      return block
    }
  }
}

module.exports.defaults = defaults
