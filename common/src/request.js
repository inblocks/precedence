const { request } = require('axios')
const debug = require('debug')('precedence:common:request')

const { privateToAddress, sign } = require('./signature')
const { sha256 } = require('./utils')

const paramsSerializer = (params) => Object.entries(params).map(([k, v]) => {
  if (Array.isArray(v)) {
    return v.map(v => `${k}=${v}`)
  } else {
    return v != null && [`${k}=${v}`]
  }
}).reduce((r, a) => r.concat(a), []).join('&')

module.exports = _package => (method, url, params = null, data = Buffer.from([]), headers = null, timeout = 10000) => {
  if (!Buffer.isBuffer(data)) {
    throw new Error('data must be a buffer')
  }
  headers = Object.assign({
    'content-type': 'application/json; charset=utf-8',
    'user-agent': `${_package.name} v${_package.version}`
  }, headers || {})
  if (process.env.PRECEDENCE_PRIVATE_KEY) {
    headers['precedence-address'] = privateToAddress(process.env.PRECEDENCE_PRIVATE_KEY)
    headers['precedence-signature'] = sign(Buffer.from(sha256(data), 'hex'), process.env.PRECEDENCE_PRIVATE_KEY)
  }
  const config = {
    method,
    url: `${url}${params ? `?${paramsSerializer(params)}` : ''}`,
    headers,
    timeout,
    data,
    maxContentLength: Infinity
  }
  if (debug.enabled) {
    debug(`${method} ${config.url} ${JSON.stringify(headers)} ${data ? data.length : null}`)
  }

  return request(config)
}
