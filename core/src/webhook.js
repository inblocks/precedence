const { objectify } = require('./redis')
const { random } = require('./utils')

const count = 10
const webhookStream = 'webhook.stream'

module.exports = (redisReadOnly, urls) => {
  const redis = require('./redis').getNewRedisClient(redisReadOnly)
  const exponentialBackoff = urls.reduce((r, url) => {
    r[url] = null
    return r
  }, {})

  setTimeout(async function go () {
    try {
      const blacklist = {}
      let results
      do {
        results = await redis.xrange(webhookStream, 0, '+', 'COUNT', count)
        for (const result of results) {
          const streamId = result[0]
          const timestamp = streamId.split('-')[0]
          const object = objectify(result[1])
          if (blacklist[object.url]) {
            continue
          }
          const log = `${timestamp} ${JSON.stringify(object)}`
          const eb = exponentialBackoff[object.url]
          if (eb === undefined) {
            console.log(`WEBHOOK WARNING "ignored" ${log}`)
            await redis.xdel(webhookStream, streamId)
            continue
          } else if (eb && (eb.timestamp + eb.value) > Date.now()) {
            continue
          }
          delete blacklist[object.url]
          try {
            const response = await require('axios').request({
              timeout: 10000,
              headers: {
                'user-agent': `precedence/${require('../package.json').version}`
              },
              url: object.url,
              data: {
                timestamp,
                id: object.id,
                type: object.type,
                data: JSON.parse(object.data)
              }
            })
            const message = `"${response.status} ${response.statusText}" ${log}`
            if (response.status === 200) {
              console.log(`WEBHOOK INFO ${message}`)
              await redis.xdel(webhookStream, streamId)
              exponentialBackoff[object.url] = null
              continue
            } else {
              console.log(`WEBHOOK WARNING ${message}`)
            }
          } catch (e) {
            console.log(`WEBHOOK WARNING ${JSON.stringify(`error: ${e.message}`)} ${log}`)
          }
          blacklist[object.url] = true
          if (eb === null) {
            exponentialBackoff[object.url] = {
              timestamp: Date.now(),
              value: 1
            }
          } else {
            eb.value = Math.min(1000 * 60 * 60 * 24, eb.value * 2)
            eb.timestamp = Date.now()
          }
        }
      } while (results.length === count)
    } catch (e) {
      console.log(`WARNING - ${new Date().toISOString()} - WEBHOOK - ${e.message}`)
    }
    setTimeout(go, 1000)
  }, 1000)

  return {
    add: async (type, data) => {
      const id = random(32)
      for (const url of urls) {
        await redis.xadd(webhookStream, '*',
          'url', url,
          'id', id,
          'type', type,
          'data', JSON.stringify(data)
        )
      }
    }
  }
}
