const { ecsign, keccak256, toRpcSig, fromRpcSig, privateToAddress, publicToAddress, ecrecover } = require('ethereumjs-util')

const _privateToAddress = (privateKey) => {
  return '0x' + privateToAddress(Buffer.from(privateKey, 'hex')).toString('hex')
}

const _publicToAddress = (publicKey) => {
  return '0x' + publicToAddress(publicKey).toString('hex')
}

const sign = (data, privateKey) => {
  const vrs = ecsign(keccak256(data), Buffer.from(privateKey, 'hex'))
  return toRpcSig(vrs.v, vrs.r, vrs.s)
}

const recover = (data, signature) => {
  const vrs = fromRpcSig(signature)
  return _publicToAddress(ecrecover(keccak256(data), vrs.v, vrs.r, vrs.s))
}

module.exports = {
  privateToAddress: _privateToAddress,
  publicToAddress: _publicToAddress,
  sign,
  recover
}
