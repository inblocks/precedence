const util = require('util')

const { RecordAlreadyExistsError, RecordNotFoundError } = require('./errors')
const { random, sortObject, sha256 } = require('./utils')
const { getNewRedisClient, getTime, execOperations } = require('./redis')

const recordStream = 'record.stream'
const chainKeyFormat = 'chain.%s'
const recordInfoKeyFormat = 'record.info.%s'
const recordDataKeyFormat = 'record.data.%s'

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
    const timestamp = await getTime(redis)
    const operations = []
    const local = { chain: {}, record: {} }
    const results = []
    for (const record of records) {
      const id = record.id ? sha256(record.id) : random(32)
      const key = util.format(recordInfoKeyFormat, id)
      await redis.watch(key)
      if (await redis.exists(key)) {
        throw new RecordAlreadyExistsError(id)
      }
      const seed = random(32)
      const recordInfo = {
        provable: { seed: sha256(seed), id },
        seed,
        hash: null,
        timestamp
      }
      if (record.store === true) {
        operations.push(['set', util.format(recordDataKeyFormat, id), record.data])
        recordInfo.data = record.data.length
      }
      recordInfo.provable.data = sha256(`${seed} ${sha256(record.data)}`)
      const chains = {}
      const previous = {}
      if (record.chains) {
        for (const chain of record.chains) {
          await redis.watch(chain)
          const last = local.chain[chain] ? local.chain[chain].id : await getLastRecordId(redis, chain)
          local.chain[chain] = id
          chains[chain] = last
          if (last) {
            previous[last] = true
          }
        }
      }
      recordInfo.chains = sortObject(chains)
      recordInfo.provable.chains = Object.entries(recordInfo.chains).reduce((r, [k, v]) => {
        r[sha256(`${seed} ${k}`)] = v
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
      recordInfo.hash = sha256(JSON.stringify(recordInfo.provable))
      const result = recordResponse(recordInfo, record.store === true && record.data)
      operations.push(
        [
          'xadd', recordStream, '*',
          'key', id,
          'value', recordInfo.hash
        ],
        getSetRecordInfoOperation(recordInfo)
      )
      local.record[id] = true
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
  let todo = [id]
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
