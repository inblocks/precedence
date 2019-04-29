const util = require('util')

const {IdAlreadyExistsError, NotFoundError} = require('./errors')
const {random, sortObject, sha256} = require('./utils')
const {getNewRedisClient, getTime, execOperations} = require('./redis')

const recordStream = 'record.stream'
const chainKeyFormat = 'chain.%s'
const recordInfoKeyFormat = 'record.info.%s'
const recordDataKeyFormat = 'record.data.%s'
const recordNextKeyFormat = 'record.next.%s'

const recordResponse = (recordInfo, data, next) => {
  return Object.assign({}, recordInfo, {
    next: next && next.sort() || [],
    data: data && data.toString('base64')
  })
}

const getRecordInfoOrNull = async (redis, id) => {
  const result = await redis.get(util.format(recordInfoKeyFormat, id))
  return result && JSON.parse(result)
}

const getRecordInfo = async (redis, id) => {
  const result = await getRecordInfoOrNull(redis, id)
  if (result) {
    return result
  } else {
    throw new NotFoundError('record', id)
  }
}

const getSetRecordInfoOperation = (recordInfo) => {
  return ['set', util.format(recordInfoKeyFormat, recordInfo.provable.id), JSON.stringify(recordInfo)]
}

const getRecord = async (redis, id) => {
  const recordInfo = await getRecordInfo(redis, id)
  let data
  if (recordInfo.deleted === true) {
    delete recordInfo.chains
  } else {
    data = await redis.getBuffer(util.format(recordDataKeyFormat, recordInfo.provable.id)) || undefined
  }
  return recordResponse(recordInfo, data, await redis.smembers(util.format(recordNextKeyFormat, id)))
}

const getLastRecordIdOrNull = async (redis, chain) => {
  return await redis.get(util.format(chainKeyFormat, chain))
}

const getLastRecordId = async (redis, chain) => {
  const id = await getLastRecordIdOrNull(redis, chain)
  if (id) {
    return id
  } else {
    throw new NotFoundError('chain', chain)
  }
}

const createRecords = async (redis, records, preExec) => {
  redis = getNewRedisClient(redis)
  try {
    const timestamp = await getTime(redis)
    const operations = []
    const local = {chain: {}, record: {}, next: {}}
    const results = []
    for (const record of records) {
      const id = record.id && sha256(record.id) || random(32)
      const key = util.format(recordInfoKeyFormat, id)
      redis.watch(key)
      if (await redis.exists(key)) {
        throw new IdAlreadyExistsError(id)
      }
      const recordInfo = {
        provable: {id},
        seed: random(32),
        hash: null,
        timestamp
      }
      if (record.data) {
        operations.push(['set', util.format(recordDataKeyFormat, id), record.data])
      }
      recordInfo.provable.data = sha256(`${recordInfo.seed} ${record.hash}`)
      const chains = {}
      const previous = {}
      for (const chain of record.chains) {
        await redis.watch([chain])
        const last = local.chain[chain] && local.chain[chain].id || await getLastRecordIdOrNull(redis, chain)
        local.chain[chain] = id
        chains[chain] = last
        if (last) {
          previous[last] = true
        }
      }
      recordInfo.chains = sortObject(chains)
      recordInfo.provable.chains = Object.entries(recordInfo.chains).reduce((r, [k, v]) => {
        r[sha256(`${recordInfo.seed} ${k}`)] = v
        return r
      }, {})
      for (const id of record.previous) {
        if (!local.record[id] && (await getRecordInfoOrNull(redis, id)) === null) {
          throw new NotFoundError('record', id)
        }
        local.record[id] = true
        previous[id] = true
      }
      recordInfo.provable.previous = Object.keys(previous).sort()
      recordInfo.provable.previous.forEach(next => {
        operations.push(['sadd', util.format(recordNextKeyFormat, next), id])
        if (!local.next[id]) {
          local.next[next] = [id]
        } else {
          local.next[next].push(id)
        }
      })
      recordInfo.hash = sha256(JSON.stringify(recordInfo.provable))
      const result = recordResponse(recordInfo, record.data, local.next[id])
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
    results.forEach(result => {
      result.next = local.next[result.id] || []
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

const deleteRecord = async (redis, id, recursive = false) => {
  const record = await getRecordInfo(redis, id)
  const result = {
    deleted: record.deleted ? 0 : 1
  }
  delete record.chains
  record.deleted = true
  await execOperations(redis, [
    getSetRecordInfoOperation(record),
    ['del', util.format(recordDataKeyFormat, record.provable.id)]
  ])
  if (recursive !== true) {
    return result
  }
  let todo = record.provable.previous
  while (todo.length > 0) {
    for (const id of todo.splice(0, todo.length)) {
      const record = await getRecordInfo(redis, id)
      result.deleted += record.deleted ? 0 : 1
      delete record.chains
      record.deleted = true
      await execOperations(redis, [
        getSetRecordInfoOperation(record),
        ['del', util.format(recordDataKeyFormat, id)]
      ])
      todo = todo.concat(record.provable.previous)
    }
  }
  return result
}

const deleteChain = async (redis, name) => {
  const result = await deleteRecord(redis, await getLastRecordId(redis, name), true)
  await redis.del(util.format(chainKeyFormat, name))
  return result
}

module.exports = {
  getRecord,
  getLastRecordId,
  createRecords,
  deleteRecord,
  deleteChain
}
