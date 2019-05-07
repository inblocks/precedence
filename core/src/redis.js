const ConcurrentError = require('./errors').ConcurrentError

module.exports.getNextStreamId = id => {
  if (id) {
    const split = id.split('-')
    return `${split[0]}-${split.length > 1 ? (Number(split[1]) + 1) : 0}`
  }
  return '0-1'
}

module.exports.objectify = array => {
  if (array === null) {
    return array
  }
  const o = {}
  for (let i = 0; i < array.length; i += 2) {
    o[array[i]] = array[i + 1]
  }
  return o
}

module.exports.getNewRedisClient = (redis, override) => redis.duplicate(override || { readOnly: false })

module.exports.getTime = (redis) => {
  return redis.time().then(result => Number(`${result[0]}${Math.round(result[1] / 1000)}`))
}

module.exports.execOperations = async (redis, operations) => {
  const results = await redis.multi(operations).exec()
  if (results === null) {
    throw new ConcurrentError()
  }
  return results.map(result => {
    if (result[0] !== null) {
      throw new Error(results)
    }
    return result[1]
  })
}
