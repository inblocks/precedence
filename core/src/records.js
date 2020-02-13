const { format } = require('util')

const {
  ConflictError,
  RecordAlreadyExistsError,
  RecordNotFoundError,
  HashMismatchedDataError,
  InvalidSignatureError
} = require('./errors')
const { random, sortObject, sha256 } = require('../../common/src/utils')
const { timeToTimestamp, execOperations } = require('./redis')
const { recover } = require('../../common/src/signature')

const chainsHashKey = 'chains:h'
const recordsStream = 'records:s'
const recordsHashKey = 'records:h'
const recordsDataHashKey = 'records.data:h'
const tmpChainKeyFormat = 'tmp.chain.%s'
const tmpRecordKeyFormat = 'tmp.record.%s'

const obfuscate = (seed, value) => {
  return sha256(`${seed} ${value}`)
}

const getSetRecordOperation = (id, record) => {
  return ['hset', recordsHashKey, id, JSON.stringify(record)]
}

const getRecord = async (redis, id, data = false) => {
  return data ? redis.hgetBuffer(recordsDataHashKey, id) || null : (await getRecords(redis, [id]))[0]
}

const getRecords = async (redis, ...id) => {
  const results = await redis.hmget(recordsHashKey, ...id)
  return results.map(r => JSON.parse(r))
}

const getLastRecordId = (redis, chain) => redis.hget(chainsHashKey, chain)

const createRecords = async (redis, records, preExec) => {
  redis = redis.duplicate()
  try {
    const id = random(32)
    const ids = []
    const local = {
      chain: {},
      record: {}
    }
    const watched = []
    records.forEach(record => {
      const id = record.id ? sha256(record.id) : random(32)
      if (local.record[id]) {
        throw new ConflictError()
      }
      ids.push(id)
      watched.push(format(tmpRecordKeyFormat, id))
      if (record.chains) {
        watched.push(...record.chains.map(chain => format(tmpChainKeyFormat, chain)))
      }
    }, {})
    const timestamp = await (async () => {
      const [time, exists] = await execOperations(redis, [
        ['time'],
        ['hexists', recordsHashKey, ...ids],
        ['mset', watched.reduce((r, key) => {
          r.push(key, id)
          return r
        }, [])],
        ['watch', recordsHashKey, ...watched]
      ])
      if (exists > 0) {
        for (const id of ids) {
          if (await redis.hexists(recordsHashKey, id)) throw new RecordAlreadyExistsError(id)
        }
      }
      return timeToTimestamp(time)
    })()
    if ((await redis.mget(...watched)).some(value => value !== id)) {
      throw new ConflictError()
    }
    const operations = [['del'].concat(watched)]
    const results = []
    for (let i = 0; i < records.length; i++) {
      const id = ids[i]
      if (!records[i].hash && !records[i].data) {
        throw new Error('data and or hash must be provided')
      }
      const record = {
        provable: null,
        timestamp,
        seed: random(32),
        hash: records[i].data ? sha256(records[i].data) : records[i].hash,
        address: records[i].address,
        signature: records[i].signature,
        chains: {}
      }
      if (records[i].hash && (records[i].hash !== record.hash)) {
        throw new HashMismatchedDataError(records[i].hash, record.hash)
      }
      {
        let ok = false
        try {
          ok = recover(Buffer.from(record.hash, 'hex'), record.signature) === (record.address || '').toLowerCase()
        } catch (e) {
          // nothing to do
        }
        if (!ok) {
          throw new InvalidSignatureError(record.signature, record.address, record.hash)
        }
      }
      record.provable = {
        id,
        seed: obfuscate(record.seed, record.seed),
        hash: obfuscate(record.seed, record.hash),
        address: obfuscate(record.seed, record.address),
        signature: obfuscate(record.seed, record.signature)
      }
      if (records[i].store === true) {
        operations.push(['hset', recordsDataHashKey, id, records[i].data])
        record.data = {
          bytes: records[i].data.length
        }
      }
      const previous = {}
      if (records[i].chains) {
        for (const chain of records[i].chains) {
          const last = local.chain[chain] ? local.chain[chain].id : await getLastRecordId(redis, chain)
          local.chain[chain] = id
          record.chains[chain] = last
          if (last) {
            previous[last] = true
          }
        }
      }
      record.chains = sortObject(record.chains)
      record.provable.chains = Object.entries(record.chains).reduce((r, [k, v]) => {
        r[obfuscate(record.seed, k)] = v
        return r
      }, {})
      if (records[i].previous) {
        for (const id of records[i].previous) {
          if (!local.record[id] && (await getRecord(redis, id)) === null) {
            throw new RecordNotFoundError(id)
          }
          local.record[id] = true
          previous[id] = true
        }
      }
      record.provable.previous = Object.keys(previous).sort()
      operations.push(
        ['xadd', recordsStream, '*', '', id],
        getSetRecordOperation(id, record)
      )
      local.record[id] = true
      results.push(record)
    }
    Object.entries(local.chain).forEach(([chain, id]) => {
      operations.push(['hset', chainsHashKey, chain, id])
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
  const record = await getRecord(redis, id)
  if (!record || !record.data) {
    return null
  }
  const bytes = record.data.bytes
  delete record.data
  await execOperations(redis, [
    getSetRecordOperation(id, record),
    ['hdel', recordsDataHashKey, id]
  ])
  return {
    bytes
  }
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
      const record = await getRecord(redis, id)
      results.records++
      if (data && record.data && record.data.bytes >= 0) {
        results.data.records++
        results.data.bytes += record.data.bytes
        delete record.data
        operations.push(['del', recordsDataHashKey, id])
      }
      if (record.chains[chain]) {
        todo.push(record.chains[chain])
      }
      delete record.chains[chain]
      operations.push(getSetRecordOperation(id, record))
    }
  }
  operations.push(['hdel', chainsHashKey, chain])
  await execOperations(redis, operations)
  return results
}

module.exports = {
  getRecord,
  getRecords,
  getLastRecordId,
  createRecords,
  deleteRecord,
  deleteChain
}
