const debug = require('debug')('precedence:common:request')

const { privateToAddress, sign } = require('./signature')
const { sha256 } = require('./utils')

const paramsSerializer = (params) => {
  const query = params ? Object.entries(params).map(([k, v]) => {
    if (Array.isArray(v)) {
      return v.map(v => `${k}=${v}`)
    } else {
      return v != null && [`${k}=${v}`]
    }
  }).reduce((r, a) => r.concat(a), []).join('&') : null
  return query ? `?${query}` : ''
}

const axios = (() => {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'user-agent': (() => {
      const _package = require('../package.json')
      return `${_package.name} v${_package.version}`
    })()
  }
  return (require('axios')).create({
    headers
  })
})()

module.exports = async (method, url, queryParams = null, data = Buffer.from([]), headers = {}, timeout) => {
  if (!Buffer.isBuffer(data)) {
    throw new Error('data must be a buffer')
  }
  if (process.env.PRECEDENCE_PRIVATE_KEY) {
    headers['precedence-address'] = privateToAddress(process.env.PRECEDENCE_PRIVATE_KEY)
    headers['precedence-signature'] = sign(Buffer.from(sha256(data), 'hex'), process.env.PRECEDENCE_PRIVATE_KEY)
  }
  const config = {
    method,
    url: `${url}${paramsSerializer(queryParams)}`,
    headers,
    timeout: timeout || 0,
    data,
    maxContentLength: Infinity
  }
  if (debug.enabled) {
    debug(`${method} ${config.url} ${JSON.stringify(headers)} ${data ? data.length : null} ${timeout}`)
  }
  return axios.request(config).then(response => {
    return response
  })
}
