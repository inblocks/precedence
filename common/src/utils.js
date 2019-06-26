const { randomBytes, createHash } = require('crypto')

const random = size => {
  return randomBytes(size).toString('hex')
}

const sha256 = value => {
  return createHash('sha256').update(value).digest('hex')
}

const sortObject = object => Object.keys(object).sort().reduce((r, k) => {
  r[k] = object[k]
  return r
}, {})

module.exports = {
  random,
  sha256,
  sortObject
}
