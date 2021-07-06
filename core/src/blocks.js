const LevelUp = require('levelup')
const Trie = require('merkle-patricia-tree')

const { random, sha256 } = require('../../common/src/utils')

const { ConflictError } = require('./errors')
const { getTime, getNextStreamId, execOperations } = require('./redis')
const RedisDown = require('./redisdown')
const { getRecord } = require('./records')

const MAX_PENDING_RECORDS = 1000

const recordStream = 'records:x'
const blocksStream = 'blocks:x'
const blocksHashKey = 'blocks:h'
const triesKey = 'tries:h'
const tmpTriesSeedSet = 'tmp.tries.seed:s'

const previousKey = 'previous'
const seedKey = 'seed'

const blockResponse = (block) => {
  return block && {
    index: block.index,
    root: block.root,
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
    block.streamId = result[0]
  }
  return block
}

const getBlockInfo = async (redis, streamId) => {
  return parseBlockFromStream((await redis.xrevrange(blocksStream, streamId, '-', 'COUNT', 1))[0])
}

const getLastBlockInfo = async (redis) => {
  return getBlockInfo(redis, '+')
}

const getNextBlockInfo = async (redis, timestamp) => {
  return parseBlockFromStream((await redis.xrange(blocksStream, timestamp, '+', 'COUNT', 1))[0])
}

const getLastTodoStreamId = async (redis) => {
  const result = (await redis.xrevrange(recordStream, '+', '-', 'COUNT', 1))[0]
  return result ? result[0] : null
}

const getProof = async (trie, key) => {
  return new Promise((resolve, reject) => {
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
  })
}

const getBlock = async (redis, id = null, records = false) => {
  let block = null
  if (id != null) {
    const streamId = await redis.hget(blocksHashKey, id)
    if (!streamId) {
      return null
    }
    block = await getBlockInfo(redis, streamId)
    if (records) {
      const start = block.index ? (await getBlock(redis, block.index - 1)).timestamp : '-'
      const end = block.timestamp ? block.timestamp : '+'
      block.records = (await redis.xrange(recordStream, start, end)).map(o => {
        return o[1][1]
      })
    }
  } else {
    const last = await getLastBlockInfo(redis)
    const to = await getLastTodoStreamId(redis)
    const res = to === null ? [] : await redis.xrange(recordStream, last ? getNextStreamId(last.streamId) : '-', to, 'COUNT', MAX_PENDING_RECORDS)
    let count = res.length
    if (count === MAX_PENDING_RECORDS) {
      let tmp = res
      while (true) {
        tmp = await redis.xrange(recordStream, tmp[MAX_PENDING_RECORDS - 1][0], to, 'COUNT', MAX_PENDING_RECORDS)
        count += tmp.length
        if (tmp.length < MAX_PENDING_RECORDS) {
          break
        }
      }
    }
    block = {
      count,
      previous: last ? blockResponse(last) : null,
      records: records ? res.map(o => o[1][1]) : undefined
    }
  }
  return blockResponse(block)
}

const putInTrie = (trie, key, value) => {
  return new Promise((resolve, reject) => {
    trie.put(key, value, e => {
      try {
        if (e) return reject(e)
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  })
}

const getTrie = (redis, index, root, operation) => {
  return new Trie(LevelUp(RedisDown(redis, triesKey, `${index}.`, operation)), root)
}

const createBlock = async (redis, empty, max, preExec) => {
  const end = await getLastTodoStreamId(redis)
  if (end === null && !empty) {
    return null
  }
  redis = redis.duplicate()
  try {
    const seed = random(32)
    await redis.del(tmpTriesSeedSet)
    let index = 0
    let streamId = null
    let previous = null
    const lastBlock = await getLastBlockInfo(redis)
    if (lastBlock) {
      index = lastBlock.index + 1
      streamId = lastBlock.streamId
      previous = lastBlock.root
    }
    let count = 0
    const trie = getTrie(redis, index, null, ['sadd', tmpTriesSeedSet, seed])
    if (end !== null && max !== 0) {
      await new Promise((resolve, reject) => {
        setTimeout(async function run () {
          try {
            const countArgs = max >= 0 ? ['COUNT', Math.min(max - count, 1000)] : []
            const results = await redis.xrange(recordStream, getNextStreamId(streamId), end, ...countArgs)
            for (const result of results) {
              streamId = result[0]
              const record = await getRecord(redis, result[1][1])
              await putInTrie(trie, Buffer.from(record.provable.id, 'hex'), Buffer.from(sha256(JSON.stringify(record.provable)), 'hex'))
              count++
            }
            const endReached = (end !== '+') && (end <= streamId)
            const maxReached = (max >= 0) && (max - count <= 0)
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
    }
    if (count === 0 && !empty) {
      return null
    }
    await putInTrie(trie, previousKey, previous ? Buffer.from(previous, 'hex') : null)
    await putInTrie(trie, seedKey, Buffer.from(random(32), 'hex'))
    const root = trie.root.toString('hex')
    if (count === 0) {
      streamId = getNextStreamId(streamId)
    }
    const block = {
      index,
      timestamp: await getTime(redis),
      count,
      root,
      previous: previous ? {
        root: previous,
        proof: await getProof(trie, previousKey)
      } : null
    }
    await redis.watch(tmpTriesSeedSet)
    const seeds = await redis.smembers(tmpTriesSeedSet)
    if (seeds.length !== 1 || seeds[0] !== seed) {
      throw new ConflictError()
    }
    let result = blockResponse(block)
    const operations = [
      ['del', tmpTriesSeedSet],
      ['xadd', blocksStream, streamId, '', JSON.stringify(block)],
      ['hmset', blocksHashKey, index, streamId, root, streamId]
    ]
    if (preExec) {
      result = await preExec(redis, operations, result)
    }
    await execOperations(redis, operations)
    return result
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
      index: block.index,
      root: block.root,
      timestamp: block.timestamp,
      proof: await getProof(getTrie(redis, block.index, Buffer.from(block.root, 'hex')), key)
    }
  },
  getBlock,
  createBlock
}
