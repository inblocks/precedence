const {
  ecsign,
  toRpcSig,
  fromRpcSig,
  privateToAddress,
  publicToAddress,
  hashPersonalMessage,
  ecrecover
} = require('ethereumjs-util')

const _privateToAddress = (privateKey) => {
  return '0x' + privateToAddress(Buffer.from(privateKey, 'hex')).toString('hex')
}

const _publicToAddress = (publicKey) => {
  return '0x' + publicToAddress(publicKey).toString('hex')
}

const sign = (data, privateKey) => {
  const vrs = ecsign(hashPersonalMessage(data), Buffer.from(privateKey, 'hex'))
  return toRpcSig(vrs.v, vrs.r, vrs.s)
}

const recover = (data, signature) => {
  const vrs = fromRpcSig(signature)
  return _publicToAddress(ecrecover(hashPersonalMessage(data), vrs.v, vrs.r, vrs.s))
}

module.exports = {
  privateToAddress: _privateToAddress,
  publicToAddress: _publicToAddress,
  sign,
  recover
}
