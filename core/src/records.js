const util = require('util')

const {
  RecordAlreadyExistsError,
  RecordNotFoundError,
  HashMismatchedDataError,
  InvalidSignatureError
} = require('./errors')
const { random, sortObject, sha256 } = require('../../common/src/utils')
const { getNewRedisClient, getTime, execOperations } = require('./redis')
const { recover } = require('../../common/src/signature')

const recordStream = 'record.stream'
const chainKeyFormat = 'chain.%s'
const recordInfoKeyFormat = 'record.info.%s'
const recordDataKeyFormat = 'record.data.%s'

const obfuscate = (seed, value) => {
  return sha256(`${seed} ${value}`)
}

const recordResponse = (recordInfo, data) => {
  const result = Object.assign({}, recordInfo)
  delete result.data
  result.data = data ? data.toString('base64') : undefined
  return result
}

const getRecordInfo = async (redis, id) => {
  const result = await redis.get(util.format(recordInfoKeyFormat, id))
  return result && JSON.parse(result)
}

const getSetRecordInfoOperation = (recordInfo) => {
  return ['set', util.format(recordInfoKeyFormat, recordInfo.provable.id), JSON.stringify(recordInfo)]
}

const getRecord = async (redis, id) => {
  const recordInfo = await getRecordInfo(redis, id)
  if (!recordInfo) {
    return null
  }
  const data = recordInfo.data !== undefined && await redis.getBuffer(util.format(recordDataKeyFormat, recordInfo.provable.id))
  return recordResponse(recordInfo, data)
}

const getLastRecordId = (redis, chain) => redis.get(util.format(chainKeyFormat, chain))

const createRecords = async (redis, records, preExec) => {
  redis = getNewRedisClient(redis)
  try {
    const operations = []
    const local = { chain: {}, record: {} }
    const results = []
    for (const record of records) {
      if (!record.hash && !record.data) {
        throw new Error('data and or hash must be provided')
      }
      {
        const key = util.format(recordInfoKeyFormat, record.id)
        await redis.watch(key)
        if (await redis.exists(key)) {
          throw new RecordAlreadyExistsError(record.id)
        }
      }
      const recordInfo = {
        provable: null,
        timestamp: await getTime(redis),
        seed: random(32),
        hash: record.data ? sha256(record.data) : record.hash,
        address: record.address,
        signature: record.signature,
        chains: {}
      }
      if (record.hash && (record.hash !== recordInfo.hash)) {
        throw new HashMismatchedDataError(record.hash, recordInfo.hash)
      }
      {
        let ok = false
        try {
          ok = recover(Buffer.from(recordInfo.hash, 'hex'), record.signature) === (record.address || '').toLowerCase()
        } catch (e) {
          // nothing to do
        }
        if (!ok) {
          throw new InvalidSignatureError(record.signature, record.address, recordInfo.hash)
        }
      }
      recordInfo.provable = {
        id: record.id,
        seed: obfuscate(recordInfo.seed, recordInfo.seed),
        hash: obfuscate(recordInfo.seed, recordInfo.hash),
        address: obfuscate(recordInfo.seed, recordInfo.address),
        signature: obfuscate(recordInfo.seed, recordInfo.signature)
      }
      if (record.store === true) {
        operations.push(['set', util.format(recordDataKeyFormat, record.id), record.data])
        recordInfo.data = record.data.length
      }
      const previous = {}
      if (record.chains) {
        for (const chain of record.chains) {
          await redis.watch(chain)
          const last = local.chain[chain] ? local.chain[chain].id : await getLastRecordId(redis, chain)
          local.chain[chain] = record.id
          recordInfo.chains[chain] = last
          if (last) {
            previous[last] = true
          }
        }
      }
      recordInfo.chains = sortObject(recordInfo.chains)
      recordInfo.provable.chains = Object.entries(recordInfo.chains).reduce((r, [k, v]) => {
        r[obfuscate(recordInfo.seed, k)] = v
        return r
      }, {})
      if (record.previous) {
        for (const id of record.previous) {
          if (!local.record[id] && (await getRecordInfo(redis, id)) === null) {
            throw new RecordNotFoundError(id)
          }
          local.record[id] = true
          previous[id] = true
        }
      }
      recordInfo.provable.previous = Object.keys(previous).sort()
      const result = recordResponse(recordInfo, record.store === true && record.data)
      operations.push(
        [
          'xadd', recordStream, '*',
          'key', record.id.match(/^[0-9a-f]*$/i) && record.id.length % 2 === 0 ? record.id : Buffer.from(record.id, 'utf8').toString('hex'),
          'value', sha256(JSON.stringify(recordInfo.provable))
        ],
        getSetRecordInfoOperation(recordInfo)
      )
      local.record[record.id] = true
      results.push(result)
    }
    Object.entries(local.chain).forEach(([chain, id]) => {
      operations.push(['set', util.format(chainKeyFormat, chain), id])
    })
    if (preExec) {
      await preExec(redis, operations)
    }
    await execOperations(redis, operations)
    return results
  } finally {
    redis.disconnect()
  }
}

const deleteRecord = async (redis, id) => {
  const record = await getRecordInfo(redis, id)
  if (!record || record.data === undefined) {
    return null
  }
  const result = record.data
  delete record.data
  await execOperations(redis, [
    getSetRecordInfoOperation(record),
    ['del', util.format(recordDataKeyFormat, id)]
  ])
  return result
}

const deleteChain = async (redis, chain, data = false) => {
  const id = await getLastRecordId(redis, chain)
  if (!id) {
    return null
  }
  const results = {
    records: 0,
    data: data ? {
      records: 0,
      bytes: 0
    } : undefined
  }
  const operations = []
  const todo = [id]
  while (todo.length > 0) {
    for (const id of todo.splice(0, todo.length)) {
      const record = await getRecordInfo(redis, id)
      results.records++
      if (data && record.data >= 0) {
        results.data.records++
        results.data.bytes += record.data
        delete record.data
        operations.push(['del', util.format(recordDataKeyFormat, id)])
      }
      if (record.chains[chain]) {
        todo.push(record.chains[chain])
      }
      delete record.chains[chain]
      operations.push(getSetRecordInfoOperation(record))
    }
  }
  operations.push(['del', util.format(chainKeyFormat, chain)])
  await execOperations(redis, operations)
  return results
}

module.exports = {
  getRecord,
  getLastRecordId,
  createRecords,
  deleteRecord,
  deleteChain
}
