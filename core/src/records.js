const { format } = require('util')

const {
  ConflictError,
  HashFormatError,
  HashMismatchError,
  InvalidSignatureError,
  MissingDataError,
  RecordAlreadyExistsError,
  RecordNotFoundError
} = require('./errors')
const { random, sortObject, sha256 } = require('../../common/src/utils')
const { timeToTimestamp, execOperations } = require('./redis')
const { recover } = require('../../common/src/signature')

const chainsHashKey = 'chains:h'
const recordsStream = 'records:x'
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

const getLastRecordIds = (redis, ...chains) => redis.hmget(chainsHashKey, ...chains)

const createRecords = async (redis, records, preExec) => {
  let tmpKeys
  redis = redis.duplicate()
  try {
    const local = {
      chain: {},
      record: {}
    }
    const watched = []
    const previous = {}
    const id = random(32)
    records = records.map(record => {
      const id = record.id ? sha256(record.id) : random(32)
      if (local.record[id]) {
        throw new ConflictError()
      }
      local.record[id] = true
      const data = record.data && record.data.length > 0 ? record.data : undefined
      const hash = (() => {
        if (data) {
          if (!record.hash) {
            return sha256(record.data)
          } else {
            const hash = sha256(record.data)
            if (record.hash.toLowerCase() === hash) {
              return hash
            } else {
              throw new HashMismatchError(record.hash, hash)
            }
          }
        } else if (record.hash) {
          if (record.hash.toString().match(/^[0-9a-fA-F]{64}$/)) {
            return record.hash.toLowerCase()
          } else {
            throw new HashFormatError(record.hash)
          }
        } else {
          return undefined
        }
      })()
      if (!data && (!hash || record.store)) {
        throw new MissingDataError()
      }
      let signature = false
      if (record.signature || record.address) {
        try {
          signature = recover(Buffer.from(hash, 'hex'), record.signature) === (record.address || '').toLowerCase()
        } catch (e) {
          // nothing to do
        }
        if (!signature) {
          throw new InvalidSignatureError(record.signature, record.address, hash)
        }
      }
      watched.push(format(tmpRecordKeyFormat, id))
      if (record.chains) {
        watched.push(...record.chains.map(chain => format(tmpChainKeyFormat, chain)))
        for (const chain of record.chains) {
          local.chain[chain] = true
        }
      }
      if (record.previous) {
        for (const id of record.previous) {
          previous[id] = null
        }
      }
      return {
        id,
        hash,
        data,
        address: signature ? record.address : undefined,
        signature: signature ? record.signature : undefined,
        store: record.store,
        chains: record.chains,
        previous: record.previous
      }
    })
    const timestamp = await (async () => {
      const operations = [
        ['time'],
        ['mset', watched.reduce((r, key) => {
          r.push(key, id)
          return r
        }, [])]
      ]
      let index = operations.length - 1
      const chains = Object.keys(local.chain)
      if (chains.length > 0) {
        operations.push(['hmget', chainsHashKey, ...chains])
      }
      records.forEach(record => operations.push(['hexists', recordsHashKey, record.id]))
      const previousIds = Object.keys(previous)
      for (const id of previousIds) {
        operations.push(['hexists', recordsHashKey, id])
      }
      const results = await execOperations(redis, operations)
      tmpKeys = watched
      const time = results[0]
      if (chains.length > 0) {
        const chainIds = results[++index]
        for (let i = 0; i < chains.length; i++) {
          local.chain[chains[i]] = chainIds[i]
        }
      }
      records.forEach(record => {
        if (results[++index] === 1) {
          throw new RecordAlreadyExistsError(record.id)
        }
      })
      local.record = {}
      for (const id of previousIds) {
        if (results[++index] === 1) {
          local.record[id] = true
        } else {
          throw new RecordNotFoundError(id)
        }
      }
      for (const record of records) {
        if (record.previous) {
          for (const id of record.previous) {
            if (local.record[id]) {
              local.record[record.id] = true
            } else {
              throw new RecordNotFoundError(id)
            }
          }
        }
      }
      return timeToTimestamp(time)
    })()
    await redis.watch(...watched)
    if ((await redis.mget(...watched)).some(value => value !== id)) {
      throw new ConflictError()
    }
    const operations = [['del'].concat(watched)]
    let result = []
    for (let i = 0; i < records.length; i++) {
      const record = {
        provable: null,
        timestamp,
        seed: random(32),
        hash: records[i].hash,
        chains: {}
      }
      record.provable = {
        id: records[i].id,
        seed: obfuscate(record.seed, record.seed),
        hash: obfuscate(record.seed, record.hash),
        chains: {},
        previous: {}
      }
      if (records[i].signature) {
        record.address = records[i].address
        record.signature = records[i].signature
        record.provable.address = obfuscate(record.seed, record.address)
        record.provable.signature = obfuscate(record.seed, record.signature)
      }
      if (records[i].store === true) {
        operations.push(['hset', recordsDataHashKey, records[i].id, records[i].data])
        record.data = {
          bytes: records[i].data.length
        }
      }
      if (records[i].chains) {
        for (const chain of records[i].chains) {
          const last = local.chain[chain]
          local.chain[chain] = records[i].id
          record.chains[chain] = last
          if (last) {
            record.provable.previous[last] = true
          }
        }
        record.chains = sortObject(record.chains)
        Object.entries(record.chains).reduce((r, [k, v]) => {
          r[obfuscate(record.seed, k)] = v
          return r
        }, record.provable.chains)
      }
      if (records[i].previous) {
        for (const id of records[i].previous) {
          record.provable.previous[id] = true
        }
      }
      record.provable.previous = Object.keys(record.provable.previous).sort()
      operations.push(
        ['xadd', recordsStream, '*', '', records[i].id],
        getSetRecordOperation(records[i].id, record)
      )
      result.push(record)
    }
    Object.entries(local.chain).forEach(([chain, id]) => {
      operations.push(['hset', chainsHashKey, chain, id])
    })
    if (preExec) {
      result = await preExec(redis, operations, result)
    }
    await execOperations(redis, operations)
    tmpKeys = null
    return result
  } finally {
    if (tmpKeys) {
      await redis.del(...tmpKeys)
    }
    redis.disconnect()
  }
}

const deleteRecord = async (redis, id, preExec) => {
  const record = await getRecord(redis, id)
  if (!record || !record.data) {
    return null
  }
  let result = {
    bytes: record.data.bytes
  }
  delete record.data
  const operations = [
    getSetRecordOperation(id, record),
    ['hdel', recordsDataHashKey, id]
  ]
  if (preExec) {
    result = await preExec(redis, operations, result)
  }
  await execOperations(redis, operations)
  return result
}

const deleteChain = async (redis, chain, preExec) => {
  const id = (await getLastRecordIds(redis, chain))[0]
  if (!id) {
    return null
  }
  let result = {
    id
  }
  const operations = [['hdel', chainsHashKey, chain]]
  if (preExec) {
    result = await preExec(redis, operations, result)
  }
  await execOperations(redis, operations)
  return result
}

module.exports = {
  getRecord,
  getRecords,
  getLastRecordIds,
  createRecords,
  deleteRecord,
  deleteChain
}
