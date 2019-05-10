const Redis = require('ioredis')

const merkle = require('./blocks')
const record = require('./records')
const defaults = require('./defaults')

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

  const getRecord = async (id) => {
    const result = await record.getRecord(redisReadOnly, id)
    result.block = await merkle.getProof(redisReadOnly, result.timestamp, result.provable.id)
    return result
  }

  const getLastRecord = async (chain) => getRecord(await getLastRecordId(chain))

  const getLastRecordId = (chain) => record.getLastRecordId(redisReadOnly, chain)

  const createRecords = (records, preExec = null) => record.createRecords(redisReadOnly, records, preExec)

  const deleteRecord = (id, recursive = false) => record.deleteRecord(redisReadOnly, id, recursive)

  const deleteChain = (id) => record.deleteChain(redisReadOnly, id)

  const getBlock = (id = null) => merkle.getBlock(redisReadOnly, id)

  const createBlock = (empty = defaults.block.empty, max = defaults.block.max) => {
    return merkle.createBlock(redisReadOnly, empty, max)
  }

  const lib = {
    redisReadOnly,
    getRecord,
    getLastRecord,
    getLastRecordId,
    createRecords,
    deleteRecord,
    deleteChain,
    getBlock,
    createBlock,
    extensions: {}
  }
  Object.entries(defaults.extensions || {}).forEach(([key, value]) => {
    lib.extensions[key] = require(value)(key, lib)
  })
  return lib
}

module.exports.defaults = defaults
