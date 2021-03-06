#!/usr/bin/env node

const createError = require('http-errors')

const { sign } = require('../../common/src/signature')
const { sha256 } = require('../../common/src/utils')

const {
  PrecedenceError,
  RecordNotFoundError,
  BlockNotFoundError,
  ChainNotFoundError,
  RecordDataNotFoundError,
  RequestEntityTooLargeError,
  UnsupportedMediaTypeError
} = require('./errors')

const defaults = {
  namespace: 'precedence',
  redis: 'localhost:6379',
  limit: 500000000,
  port: 9000
}

// APPEND ONLY!
const error = {
  UNKNOWN: [500, 1],
  'CORE.ConflictError': [409, 2],
  'CORE.RecordAlreadyExistsError': [409, 3],
  'CORE.RecordNotFoundError': [404, 4],
  'API.RecordDataNotFoundError': [404, 5],
  'API.BlockNotFoundError': [404, 6],
  'API.ChainNotFoundError': [404, 7],
  'API.UnsupportedMediaTypeError': [415, 8],
  'API.RequestEntityTooLargeError': [413, 9],
  'CORE.HashMismatchError': [400, 11],
  'CORE.InvalidSignatureError': [400, 12],
  'CORE.MissingDataError': [400, 13],
  'CORE.HashFormatError': [400, 14]
}

const api = fn => async (req, res) => {
  const result = {
    took: undefined,
    status: undefined,
    error: undefined,
    message: undefined,
    data: undefined
  }
  try {
    result.data = await fn(req, res)
    result.status = res.statusCode || 200
  } catch (e) {
    result.status = error.UNKNOWN[0]
    result.error = error.UNKNOWN[1]
    if (e instanceof PrecedenceError) {
      result.status = error[e.type][0]
      result.error = error[e.type][1]
      result.message = e.message
      result.data = e.data
    } else if (e.statusCode) { // http-errors
      result.status = e.statusCode
      result.message = e.message
    } else {
      console.error(e)
    }
  } finally {
    if (!res.headersSent) {
      res.status(result.status)
      if (Buffer.isBuffer(result.data)) {
        res.set('content-type', 'application/octet-stream')
        res.send(result.data)
      } else {
        res.set('content-type', 'application/json; charset=utf-8')
        result.took = (Date.now() - req._startTime) || 1
        res.send(req.query.pretty === 'true' ? `${JSON.stringify(result, null, 2)}\n` : result)
      }
    }
  }
}

const log = (string) => console.log(`LOG    - ${new Date().toISOString()} - ${string}`)

const getNodeAddress = () => {
  if (!process.env.PRECEDENCE_PRIVATE_KEY) return null
  try {
    return require('../../common/src/signature').privateToAddress(process.env.PRECEDENCE_PRIVATE_KEY)
  } catch (e) {
    console.error('ERROR: PRECEDENCE_PRIVATE_KEY must match [0-9a-zA-Z]{64}')
    process.exit(1)
  }
}

let server

require('../../common/src/cli').run('precedence-api', {
  _help: sections => {
    sections.splice(0, 0, {
      content: [
        'Welcome in the {bold.italic precedence} REST API.',
        'Visit "https://github.com/inblocks/precedence" to know more about {bold.italic precedence}.'
      ]
    }, {
      header: 'Environment variables',
      content: [{
        name: 'PRECEDENCE_PRIVATE_KEY',
        description: `Set the ECDSA private key to sign
        - webhooks
        - records, if not already done by the client`
      }]
    })
    return sections
  },
  _options: [{
    name: 'block-cron',
    type: String,
    description: 'Set the cron to automatically and periodically create a new block\n(example: "* * * * *" to create a block every minute)'
  }, {
    name: 'block-empty',
    type: Boolean,
    description: 'To allow the creation of empty blocks'
  }, {
    name: 'block-max',
    type: Number,
    description: 'Set the maximum number of records that can be used to create a block'
  }, {
    name: 'limit',
    type: Number,
    description: 'Set the maximum bytes size of the data that can be received during record creation'
  }, {
    name: 'namespace',
    type: String,
    description: `Set the namespace to run several isolated precedence instances over the same storage system (default: ${defaults.namespace})`,
    defaultValue: defaults.namespace
  }, {
    name: 'port',
    type: Number,
    description: `Set the API port to use (default: ${defaults.port})`,
    defaultValue: defaults.port
  }, {
    name: 'redis',
    type: String,
    description: `Set the Redis uri (default: ${defaults.redis})`,
    defaultValue: defaults.redis
  }, {
    name: 'webhook',
    type: String,
    description: 'Set a webhook (block creation)',
    lazyMultiple: true
  }],
  _exec: (command, definitions, args, options) => {
    const nodeAddress = getNodeAddress()
    log(`node address: ${nodeAddress}`)
    log(JSON.stringify(options, null, 2))

    const precedence = require('../../core/src')((() => {
      const Redis = require('ioredis')
      const redisHostPort = (options.redis || defaults.redis).split(':')
      return new Redis({
        keyPrefix: `${options.namespace || defaults.namespace}.`,
        host: redisHostPort[0],
        port: redisHostPort[1],
        maxRetriesPerRequest: null
      })
    })(), {
      webhooks: options.webhook
    })

    const getBlock = () => api(async req => {
      const result = await precedence.getBlock(req.params.id, req.query.records === 'true')
      if (!result) {
        if (!req.params.id) {
          return null
        } else {
          throw new BlockNotFoundError(req.params.id)
        }
      }
      return result
    })

    const app = require('express')()

    app.use(require('morgan')('ACCESS - :date[iso] - :remote-addr ":method :url" :status :res[content-length] ":user-agent"'))

    app.get('/records/:id', api(async (req, res) => {
      const data = req.query.data === 'true'
      const result = await precedence.getRecord(req.params.id, data)
      if (!result) throw data ? new RecordDataNotFoundError(req.params.id) : new RecordNotFoundError(req.params.id)
      if (data) {
        res.set('content-type', 'application/octet-stream')
        res.send(result)
      } else {
        return result
      }
    }))
    app.post('/records', require('body-parser').raw({
      type: () => true,
      limit: options.limit || defaults.limit,
      verify: (req, res, buf) => {
        if (buf.length > 0) {
          const type = req.headers['content-type'] && req.headers['content-type'].toLowerCase()
          if (!type || type !== 'application/octet-stream') {
            throw new UnsupportedMediaTypeError()
          }
        }
        req.data = buf
      }
    }), api(async (req, res) => {
      const data = req.data || Buffer.from([])
      const record = {
        id: req.query.id,
        hash: req.query.hash,
        data,
        chains: Array.isArray(req.query.chain) ? req.query.chain : (req.query.chain && [req.query.chain]),
        previous: Array.isArray(req.query.previous) ? req.query.previous : (req.query.previous && [req.query.previous]),
        store: req.query.store === 'true'
      }
      if (req.headers['precedence-address'] || req.headers['precedence-signature']) {
        record.address = req.headers['precedence-address']
        record.signature = req.headers['precedence-signature']
      } else if (process.env.PRECEDENCE_PRIVATE_KEY) {
        record.address = nodeAddress
        record.signature = sign(Buffer.from(req.query.hash || sha256(data), 'hex'), process.env.PRECEDENCE_PRIVATE_KEY)
      }
      return precedence.createRecords([record]).then(result => {
        res.status(201)
        return result[0]
      })
    }))
    app.delete('/records/:id', api(async req => {
      const result = await precedence.deleteRecord(req.params.id)
      if (!result) {
        throw new RecordDataNotFoundError(req.params.id)
      }
      return result
    }))

    app.get('/chains/:chain', api(async req => {
      const result = await precedence.getLastRecord(req.params.chain)
      if (!result) {
        throw new ChainNotFoundError(req.params.chain)
      }
      return result
    }))
    app.delete('/chains/:chain', api(async req => {
      const result = await precedence.deleteChain(req.params.chain)
      if (!result) {
        throw new ChainNotFoundError(req.params.chain)
      }
      return result
    }))

    app.get('/blocks', getBlock()) // get pending block
    app.get('/blocks/:id', getBlock()) // get a block by its root/index
    app.post('/blocks', api((req, res) => {
      const empty = req.query.empty === 'true'
      const max = req.query.max ? Number(req.query.max) : undefined
      return precedence.createBlock(empty, max).then(result => {
        res.status(result ? 201 : 200)
        return result
      })
    }))

    app.all('*', api(() => Promise.reject(createError(418))))

    // DON'T REMOVE USELESS "next" PARAMETER -> IT IS USEFUL TO CATCH ERRORS :-)
    app.use((error, req, res, next) => api(() => {
      if (error.type === 'entity.too.large') { // body-parser
        return Promise.reject(new RequestEntityTooLargeError(options.limit || defaults.limit))
      }
      return Promise.reject(error)
    })(req, res))

    server = require('http').createServer(app)
      .listen(options.port || defaults.port, '0.0.0.0', () => {
        log(`listen on 0.0.0.0:${options.port || defaults.port}`)
        if (options['block-cron']) {
          const CronJob = require('cron').CronJob
          let isRunning = false
          let restart = true
          new CronJob({
            cronTime: options['block-cron'],
            onTick: async function run () {
              if (isRunning) {
                restart = true
                return
              }
              isRunning = true
              let count = -1
              do {
                const block = await precedence.createBlock(count === -1 ? options['block-empty'] : false, options['block-max'])
                log(`block: ${JSON.stringify(block)}`)
                if (!block) {
                  break
                }
                count = block.count
              } while (options['block-max'] && count === options['block-max'])
              isRunning = false
              if (restart) {
                restart = false
                run().finally()
              }
            }
          }).start()
        }
      })
      .on('error', (e) => {
        console.error(e)
        process.exit(1)
      })
    return new Promise(() => null)
  }
}, () => new Promise(resolve => {
  server.close(() => {
    resolve(0)
  })
}))
