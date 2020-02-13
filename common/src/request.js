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

module.exports = async config => {
  if (config.data != null && !Buffer.isBuffer(config.data)) {
    throw new Error('data must be a buffer')
  }
  config.headers = config.headers || {}
  config.maxContentLength = config.maxContentLength || Infinity
  config.timeout = config.timeout || 0
  config.responseType = config.responseType || 'json'
  if (config.queryParams) {
    config.url = `${config.url}${paramsSerializer(config.queryParams)}`
    delete config.queryParams
  }
  if (process.env.PRECEDENCE_PRIVATE_KEY) {
    config.headers['precedence-address'] = privateToAddress(process.env.PRECEDENCE_PRIVATE_KEY)
    config.headers['precedence-signature'] = sign(Buffer.from(sha256(config.data), 'hex'), process.env.PRECEDENCE_PRIVATE_KEY)
  }
  if (debug.enabled) {
    debug(`${config.method} ${config.url} ${JSON.stringify(config.headers)} ${config.data ? config.data.length : null} ${timeout}`)
  }
  return axios.request(config).then(response => {
    return response
  })
}
