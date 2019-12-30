const { AbstractLevelDOWN } = require('abstract-leveldown')
const { inherits } = require('util')

function Redisdown (redis, location) {
  AbstractLevelDOWN.call(this)
  this.redis = redis
  this.location = location
  return this
}

inherits(Redisdown, AbstractLevelDOWN)

Redisdown.prototype._put = function (key, value, options, callback) {
  this.redis.hset(this.location, key, value).then(() => {
    process.nextTick(callback)
  })
}

Redisdown.prototype._get = function (key, options, callback) {
  this.redis.hgetBuffer(this.location, key).then(result => {
    process.nextTick(callback, null, result)
  })
}

Redisdown.prototype._batch = function (ops, options, callback) {
  this.redis.hset(this.location, ...ops.reduce((r, op) => {
    if (op.type !== 'put') throw new Error(`batch operation ${op.type} not implemented`)
    return r.concat(op.key, op.value)
  }, [])).then(() => {
    process.nextTick(callback)
  })
}

module.exports = (redis, location) => new Redisdown(redis, location)
module.exports.delete = async (redis, location) => {
  await redis.del(location)
}
