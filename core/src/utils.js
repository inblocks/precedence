const {randomBytes, createHash} = require('crypto')

const {ecsign, keccak256, toRpcSig, fromRpcSig, publicToAddress, ecrecover} = require('ethereumjs-util')

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

const sign = (data, privateKey) => {
  const vrs = ecsign(keccak256(data), Buffer.from(privateKey, 'hex'))
  return toRpcSig(vrs.v, vrs.r, vrs.s)
}

const recover = (data, signature) => {
  const vrs = fromRpcSig(signature)
  return '0x' + publicToAddress(ecrecover(keccak256(data), vrs.v, vrs.r, vrs.s)).toString('hex')
}

module.exports = {
  random,
  sha256,
  sortObject,
  sign,
  recover
}
