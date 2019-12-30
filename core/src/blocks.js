const util = require('util')

const LevelUp = require('levelup')
const Trie = require('merkle-patricia-tree')

const { random } = require('../../common/src/utils')

const { ConcurrentError } = require('./errors')
const { getNextStreamId, objectify, execOperations } = require('./redis')
const RedisDown = require('./redisdown')

const recordStream = 'record.stream'
const blockStream = 'block.stream'
const blockPendingStream = 'block.pending.stream'
const blockLedgerIdByIndexKeyFormat = 'block.index.%s'
const blockLedgerIdByRootKeyFormat = 'block.root.%s'

const previousKey = 'previous'
const seedKey = 'seed'

const blockResponse = (block) => {
  return block && {
    root: block.root,
    index: block.index,
    timestamp: block.timestamp,
    count: block.count,
    previous: block.previous,
    records: block.records
  }
}

const parseBlockFromStream = (result) => {
  const block = result && JSON.parse(result[1][1])
  if (block) {
    block.timestamp = Number(block.timestamp)
  }
  return block
}

const getBlockInfo = async (redis, streamId) => parseBlockFromStream((await redis.xrevrange(blockStream, streamId, '-', 'COUNT', 1))[0])

const getLastBlockInfo = async (redis) => {
  return getBlockInfo(redis, '+')
}

const getNextBlockInfo = async (redis, timestamp) => parseBlockFromStream((await redis.xrange(blockStream, timestamp, '+', 'COUNT', 1))[0])

const getLastTodoStreamId = async (redis) => {
  const result = (await redis.xrevrange(recordStream, '+', '-', 'COUNT', 1))[0]
  return result ? result[0] : null
}

const getNewBlock = async (redis) => {
  const previousBlock = await getLastBlockInfo(redis)
  let index = 0
  let previous = null
  let streamId = null
  if (previousBlock) {
    index = previousBlock.index + 1
    previous = previousBlock.root
    streamId = previousBlock.streamId
  }
  const location = `${index}.${random(8)}`
  const blockPendingStreamId = await redis.xadd(blockPendingStream, '*', 'index', index, 'location', location)
  return {
    index,
    streamId,
    location,
    blockPendingStreamId,
    previous,
    timestamp: Number(blockPendingStreamId.split('-')[0]),
    trie: new Trie(LevelUp(RedisDown(redis, location))),
    count: 0
  }
}

const cleanBlocks = (redis) => {
  return new Promise((resolve, reject) => {
    setTimeout(async function clean () {
      try {
        const results = await redis.xrange(blockPendingStream, '0', '+', 'COUNT', '1')
        if (results.length === 0) {
          return resolve()
        }
        const blockPendingStreamId = results[0][0]
        const block = objectify(results[0][1])
        const blockLedgerStreamId = await redis.get(util.format(blockLedgerIdByIndexKeyFormat, block.index))
        if (blockLedgerStreamId === null) {
          return resolve()
        }
        const persistedBlock = await getBlockInfo(redis, blockLedgerStreamId)
        if (persistedBlock.location !== block.location) {
          await RedisDown.delete(redis, block.location)
        }
        await redis.xdel(blockPendingStream, blockPendingStreamId)
        setTimeout(clean, 0)
      } catch (e) {
        reject(e)
      }
    }, 0)
  })
}

const getProof = async (trie, key) => {
  return new Promise((resolve, reject) => {
    trie.get(key, (e) => {
      try {
        if (e) {
          return reject(e)
        }
        Trie.prove(trie, key, (e, prove) => {
          try {
            if (e) {
              return reject(e)
            }
            resolve(prove.map(o => o.toString('hex')))
          } catch (e) {
            reject(e)
          }
        })
      } catch (e) {
        reject(e)
      }
    })
  })
}

const getBlock = async (redis, id = null, records = false) => {
  let block = null
  if (id != null) {
    let blockLedgerStreamId
    if (id.toString().match(/^[a-z0-9]{64}$/)) {
      blockLedgerStreamId = await redis.get(util.format(blockLedgerIdByRootKeyFormat, id))
    } else {
      blockLedgerStreamId = await redis.get(util.format(blockLedgerIdByIndexKeyFormat, id))
    }
    if (!blockLedgerStreamId) {
      return null
    }
    block = await getBlockInfo(redis, blockLedgerStreamId)
    if (records) {
      const start = block.index ? (await getBlock(redis, block.index - 1)).timestamp : '-'
      const end = block.timestamp ? block.timestamp : '+'
      block.records = (await redis.xrange(recordStream, start, end)).map(o => o[1][1])
    }
  } else {
    const last = await getLastBlockInfo(redis)
    const start = last ? last.timestamp : '-'
    const res = (await redis.xrange(recordStream, start, '+')).map(o => o[1][1])
    block = {
      count: res.length,
      previous: last ? blockResponse(last) : null,
      records: records ? res : undefined
    }
  }
  return blockResponse(block)
}

const createBlock = async (redis, empty, max) => {
  await cleanBlocks(redis)
  const end = await getLastTodoStreamId(redis)
  if (end === null && !empty) {
    return null
  }
  redis = redis.duplicate()
  try {
    await redis.watch(blockStream)
    const block = await getNewBlock(redis)
    end !== null && max !== 0 && await new Promise((resolve, reject) => {
      setTimeout(async function run () {
        try {
          const countArgs = max >= 0 ? ['COUNT', Math.min(max - block.count, 1000)] : []
          const results = await redis.xrange(recordStream, getNextStreamId(block.streamId), end, ...countArgs)
          for (const result of results) {
            const streamId = result[0]
            const object = objectify(result[1])
            await new Promise((resolve, reject) => {
              block.trie.put(Buffer.from(object.key, 'hex'), Buffer.from(object.value, 'hex'), e => {
                try {
                  if (e) {
                    return reject(e)
                  }
                  resolve()
                } catch (e) {
                  reject(e)
                }
              })
            })
            block.count++
            block.streamId = streamId
          }
          const lastBlock = await getLastBlockInfo(redis)
          if (lastBlock && lastBlock.index >= block.index) {
            reject(new ConcurrentError())
            return
          }
          const endReached = (end !== '+') && (end <= block.streamId)
          const maxReached = (max >= 0) && (max - block.count <= 0)
          if (endReached || maxReached) {
            resolve()
          } else {
            setTimeout(run, results.length > 0 ? 0 : 1000)
          }
        } catch (e) {
          reject(e)
        }
      }, 0)
    })
    if (block.count === 0 && !empty) {
      return null
    }
    let streamId = block.streamId
    let key = previousKey
    let value = block.previous
    if (block.count === 0) {
      streamId = getNextStreamId(block.streamId)
    }
    if (block.index === 0) {
      key = seedKey
      value = random(32)
    }
    await new Promise((resolve, reject) => {
      block.trie.put(key, Buffer.from(value, 'hex'), e => {
        try {
          if (e) {
            return reject(e)
          }
          resolve()
        } catch (e) {
          reject(e)
        }
      })
    })
    const root = block.trie.root.toString('hex')
    const result = {
      streamId,
      index: block.index,
      location: block.location,
      timestamp: block.timestamp,
      count: block.count,
      root: root,
      previous: block.index === 0 ? null : {
        root: block.previous,
        proof: await getProof(block.trie, previousKey)
      }
    }
    await execOperations(redis, [
      ['xadd', blockStream, streamId, 'block', JSON.stringify(result)],
      ['set', util.format(blockLedgerIdByRootKeyFormat, root), streamId],
      ['set', util.format(blockLedgerIdByIndexKeyFormat, block.index), streamId],
      ['xdel', blockPendingStream, block.blockPendingStreamId]
    ])
    return blockResponse(result)
  } finally {
    redis.disconnect()
  }
}

module.exports = {
  getProof: async (redis, timestamp, key) => {
    const block = await getNextBlockInfo(redis, timestamp)
    if (!block) {
      return null
    }
    return {
      root: block.root,
      proof: await getProof(new Trie(LevelUp(RedisDown(redis, block.location)), Buffer.from(block.root, 'hex')), key)
    }
  },
  getBlock,
  createBlock
}
