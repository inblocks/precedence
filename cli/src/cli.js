#!/usr/bin/env node

const cli = require('../../common/src/cli')
const { getToken, list, logout, parseTokenPayload } = require('../../common/src/OAuth2')
const request = require('../../common/src/request')(require('../package.json'))

const defaults = {
  api: 'http://localhost:9000'
}

const checkPrivateKey = (command, definitions) => {
  if (!process.env.PRECEDENCE_PRIVATE_KEY) {
    return cli.errorUsage(command, definitions, 'PRECEDENCE_PRIVATE_KEY environment variable must be defined')
  }
}

const out = (value, stringify) => new Promise((resolve, reject) => {
  process.stdout.write(stringify ? `${JSON.stringify(value, null, 2)}\n` : value, error => {
    if (error) {
      reject(error)
    } else {
      resolve(0)
    }
  })
})

const exec = async (method, url, queryParams, data = Buffer.alloc(0), headers) => {
  if (Object.keys(process.env).some(e => e.startsWith('PRECEDENCE_OAUTH2_'))) {
    await require('../../common/src/OAuth2').auth({
      grant_type: 'client_credentials',
      url: process.env.PRECEDENCE_OAUTH2_URL,
      audience: process.env.PRECEDENCE_OAUTH2_AUDIENCE,
      client_id: process.env.PRECEDENCE_OAUTH2_CLIENT_ID,
      client_secret: process.env.PRECEDENCE_OAUTH2_CLIENT_SECRET
    })
  }
  const token = getToken()
  if (token) {
    headers = headers || {}
    headers.authorization = `Bearer ${token}`
  }
  let response
  try {
    response = (await request({
      method,
      url: `${process.env.PRECEDENCE_API || defaults.api}${url}`,
      queryParams,
      data,
      headers,
      responseType: 'arraybuffer'
    }))
  } catch (e) {
    if (e.response) {
      response = e.response
    } else {
      console.error(e.message)
      return 1
    }
  }
  const isJson = response.headers['content-type'].startsWith('application/json')
  return out(isJson ? JSON.parse(response.data) : response.data, isJson)
}

cli.run('precedence', {
  _help: sections => {
    sections.splice(0, 0, {
      content: [
        'Welcome in the {bold.italic precedence} command line interface.',
        'Visit "https://github.com/inblocks/precedence" to know more about {bold.italic precedence}.'
      ]
    }, {
      header: 'Environment variables',
      content: [{
        name: 'PRECEDENCE_PRIVATE_KEY',
        description: 'Set the ECDSA private key to sign records'
      }, {
        name: 'PRECEDENCE_API',
        description: `Set the API base URL (default: "${defaults.api}")`
      }, {
        name: 'PRECEDENCE_OAUTH2_URL',
        description: 'Set the OAuth2 URL'
      }, {
        name: 'PRECEDENCE_OAUTH2_AUDIENCE',
        description: 'Set the OAuth2 audience'
      }, {
        name: 'PRECEDENCE_OAUTH2_CLIENT_ID',
        description: 'Set the OAuth2 client id'
      }, {
        name: 'PRECEDENCE_OAUTH2_CLIENT_SECRET',
        description: 'Set the OAuth2 client secret'
      }]
    })
    return sections
  },
  _parameters: { COMMAND: false },
  _commands: {
    auth: {
      _parameters: { COMMAND: false },
      _commands: {
        list: {
          _description: 'List identities.',
          _exec: async () => out(await Promise.all((await list()).map(async id => {
            return {
              id,
              payload: parseTokenPayload(await getToken(id))
            }
          })), true)
        },
        logout: {
          _description: 'Remove an identity ("ALL" to remove all identities).',
          _parameters: { ID: true },
          _exec: async (command, definition, args) => out(await logout(args[0] === 'ALL' ? null : args[0]), true)
        }
      }
    },
    utils: {
      _parameters: { COMMAND: false },
      _commands: {
        'gen-key-pair': {
          _parameters: { SECRET: false },
          _description: 'Generate an ECDSA key pair (randomized if SECRET is not defined).',
          _exec: (command, definitions, args) => {
            const key = args ? require('../../common/src/utils').sha256(args[0]) : require('../../common/src/utils').random(32)
            return out({
              PRIVATE_KEY: key,
              address: require('../../common/src/signature').privateToAddress(key)
            }, true)
          }
        },
        'private-key-to-address': {
          _description: 'Extract address from ECDSA private key.',
          _exec: (command, definitions, args) => {
            checkPrivateKey(command, definitions)
            return out({ address: require('../../common/src/signature').privateToAddress(process.env.PRECEDENCE_PRIVATE_KEY) }, true)
          }
        },
        sign: {
          _description: 'Sign the SHA-256 of DATA (utf8 string).',
          _parameters: { DATA: true },
          _options: [
            {
              name: 'file',
              type: Boolean,
              description: 'Use the data contained in the file DATA'
            },
            {
              name: 'hex',
              type: Boolean,
              description: 'Sign directly DATA (hexadecimal string)'
            }
          ],
          _exec: async (command, definitions, args, options) => {
            checkPrivateKey(command, definitions)
            if (options.file && options.hex) {
              return cli.errorUsage(command, definitions, 'file and hex options are exclusives')
            }
            let data = args[0]
            console.log(args[0])
            if (options.file) {
              const hash = require('crypto').createHash('sha256')
              data = await new Promise((resolve, reject) => {
                require('fs').createReadStream(data).on('error', e => {
                  reject(e)
                }).on('data', data => {
                  hash.update(data)
                }).on('end', () => {
                  resolve(hash.digest('hex'))
                })
              })
            } else if (options.hex) {
              if (!/^[0-9a-fA-F]{64}$/.test(data)) {
                return cli.errorUsage(command, definitions, 'DATA must match ^[0-9a-fA-F]\\{64\\}$')
              }
            } else {
              data = require('../../common/src/utils').sha256(data)
            }
            return out({
              data,
              address: require('../../common/src/signature').privateToAddress(process.env.PRECEDENCE_PRIVATE_KEY),
              signature: require('../../common/src/signature').sign(Buffer.from(data, 'hex'), process.env.PRECEDENCE_PRIVATE_KEY)
            }, true)
          }
        }
      }
    },
    blocks: {
      _parameters: { COMMAND: false },
      _commands: {
        create: {
          _description: 'Create a block with all the records that are not part of any block yet.',
          _options: [{
            name: 'empty',
            type: Boolean,
            description: 'To allow the creation of an empty block'
          }, {
            name: 'max',
            type: Number,
            description: 'Set the maximum number of records'
          }],
          _exec: (command, definitions, args, options) => exec('POST', '/blocks', options)
        },
        get: {
          _description: `Get a block by its index (number) or its root hash (SHA-256 hexadecimal string).
If you do not provide any argument, you will get the pending block.`,
          _parameters: { 'INDEX|ROOT': false },
          _options: [{
            name: 'records',
            type: Boolean,
            description: 'To retrieve the record identifiers, ordered by their timestamp'
          }],
          _exec: (command, definitions, args, options) => exec('GET', `/blocks${args ? `/${args[0]}` : ''}`, options)
        }
      }
    },
    chains: {
      _parameters: { COMMAND: false },
      _commands: {
        get: {
          _description: 'Get the last record of a chain.',
          _parameters: { NAME: true },
          _exec: (command, definitions, args) => exec('GET', `/chains/${args[0]}`)
        },
        delete: {
          _description: 'Delete the chain.',
          _parameters: { NAME: true },
          _exec: (command, definitions, args) => exec('DELETE', `/chains/${args[0]}`)
        }
      }
    },
    records: {
      _parameters: { COMMAND: false },
      _commands: {
        create: {
          _description: `Create a new record with given DATA.
DATA can be optionally a file or read from the standard input (stdin).

You can specify an identifier to make sure that an already existing record is not created again (idempotent). If you provide an identifier, the record identifier wil be the SHA-256 hexadecimal string of it.

You can specify the SHA-256 hexadecimal string to make sure that {bold.italic precedence} will only create the record if the hash computed from the received data matches this parameter.

You can specify chain names to implicitly consider the last record identifier of each chain as a previous record without having to specify them explicitly using the previous parameter.

You can explicitly set the previous record(s) of the record you are creating (by using their identifier).`,
          _parameters: { DATA: false },
          _options: [{
            alias: 'c',
            name: 'chain',
            type: String,
            description: 'Set a chain name',
            lazyMultiple: true
          }, {
            alias: 'h',
            name: 'hash',
            type: String,
            description: 'Set the DATA SHA-256 hexadecimal string',
            lazyMultiple: false
          }, {
            name: 'id',
            type: String,
            description: 'Set your unique identifier'
          }, {
            name: 'file',
            type: Boolean,
            description: 'Use the data contained in the file DATA'
          }, {
            alias: 'p',
            name: 'previous',
            type: String,
            description: 'Set a previous record identifier',
            lazyMultiple: true
          }, {
            name: 'store',
            type: Boolean,
            description: 'Enable data storage',
            lazyMultiple: true
          }],
          _exec: async (command, definitions, args, options) => {
            let data
            if (args && options.file) {
              data = require('fs').readFileSync(args[0])
            } else if (args) {
              data = Buffer.from(args[0], 'utf-8')
            } else if (!process.stdin.isTTY) {
              data = await new Promise(resolve => {
                const chunks = []
                process.stdin.on('data', chunk => chunks.push(chunk))
                process.stdin.on('end', () => {
                  resolve(Buffer.concat(chunks))
                })
              })
            }
            delete options.file
            return exec('POST', '/records', options, data, { 'content-type': 'application/octet-stream' })
          }
        },
        get: {
          _description: 'Get a record by its identifier.',
          _parameters: { ID: true },
          _options: [
            {
              name: 'data',
              type: Boolean,
              description: 'Get the original data'
            }
          ],
          _exec: (command, definitions, args, options) => exec('GET', `/records/${args[0]}`, options)
        },
        delete: {
          _description: 'Delete the data of a record.',
          _parameters: { ID: true },
          _exec: (command, definitions, args) => exec('DELETE', `/records/${args[0]}`)
        }
      }
    }
  }
}).finally()
