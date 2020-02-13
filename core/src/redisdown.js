const { AbstractLevelDOWN } = require('abstract-leveldown')
const { inherits } = require('util')

function Redisdown (redis, key, prefix, operation) {
  AbstractLevelDOWN.call(this)
  this.redis = redis
  this.key = key
  this.prefix = Buffer.from(prefix.toString(), 'utf8')
  this.operations = [operation]
  return this
}

inherits(Redisdown, AbstractLevelDOWN)

const toField = (prefix, key) => {
  return prefix ? Buffer.concat([prefix, key], prefix.length + key.length) : key
}

Redisdown.prototype._put = function (key, value, options, callback) {
  let error
  this.redis.multi(this.operations.concat([['hset', this.key, toField(this.prefix, key), value]])).exec().catch(e => {
    error = e
  }).finally(() => {
    process.nextTick(callback, error)
  })
}

Redisdown.prototype._get = function (key, options, callback) {
  this.redis.hgetBuffer(this.key, toField(this.prefix, key)).then(result => {
    process.nextTick(callback, null, result)
  })
}

Redisdown.prototype._batch = function (ops, options, callback) {
  let error
  this.redis.multi(this.operations.concat([['hset', this.key, ...ops.reduce((r, op) => {
    if (op.type !== 'put') throw new Error(`batch operation ${op.type} not implemented`)
    return r.concat(toField(this.prefix, op.key), op.value)
  }, [])]])).exec().catch(e => {
    error = e
  }).finally(() => {
    process.nextTick(callback, error)
  })
}

module.exports = (redis, key, prefix, operation) => new Redisdown(redis, key, prefix, operation)
module.exports.delete = async (redis, key) => {
  await redis.del(key)
}
