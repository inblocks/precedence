#!/usr/bin/env node

const cli = require('../../common/src/')

const defaults = {
  api: 'http://localhost:9000'
}

const exec = async (method, url, params, data, headers) => {
  let code = 0
  try {
    process.stdout.write(`${JSON.stringify((await await require('axios').request({
      headers: Object.assign({
        'user-agent': `precedence/${require('../package.json').version}`,
        'precedence-key': process.env.PRECEDENCE_KEY || null
      }, headers || {}),
      baseURL: process.env.PRECEDENCE_API || defaults.api,
      paramsSerializer: (params) => Object.entries(params).map(([k, v]) => {
        if (Array.isArray(v)) {
          return v.map(v => `${k}=${v}`)
        } else {
          return v != null && [`${k}=${v}`]
        }
      }).reduce((r, a) => r.concat(a), []).join('&'),
      method,
      url,
      params,
      data
    })).data, null, 2)}\n`)
    code = 0
  } catch (e) {
    if (e.response) {
      process.stdout.write(`${JSON.stringify(e.response.data, null, 2)}\n`)
    } else {
      console.error(`ERROR: ${e.message}`)
      code = 1
    }
  }
  return code
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
        name: 'PRECEDENCE_API',
        description: `Set the API base URL (default: "${defaults.api}")`
      }]
    })
    return sections
  },
  _parameters: { COMMAND: false },
  _commands: {
    blocks: {
      _parameters: { COMMAND: false },
      _commands: {
        create: {
          _description: 'Create a block with all the records that are not part of any block yet.',
          _options: [{
            name: 'no-empty',
            type: Boolean,
            description: `To prevent the creation of empty blocks`
          }, {
            name: 'max',
            type: Number,
            description: 'Set the maximum number of records of this block'
          }],
          _exec: (command, definitions, args, options) => exec('POST', '/blocks', {
            empty: !options['no-empty'],
            max: options.max
          })
        },
        get: {
          _description: `Get a block by its index (number) or its root hash (SHA-256 hexadecimal string).
If you do not provide any argument, you will get the last block.`,
          _parameters: { 'INDEX|ROOT': false },
          _exec: (command, definitions, args) => exec('GET', `/blocks${args ? `/${args[0]}` : ''}`)
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
          _description: 'Delete the chain and optionally recursively the data of all the records that it refers to.',
          _parameters: { NAME: true },
          _options: [
            {
              name: 'data',
              type: Boolean,
              description: 'Delete recursively the data of all the records referred by the chain.'
            }
          ],
          _exec: (command, definitions, args, options) => exec('DELETE', `/chains/${args[0]}`, options)
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

You can explicitely set the previous record(s) of the record you are creating (by using their identifiers).`,
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
            lazyMultiple: true
          }, {
            name: 'id',
            type: String,
            description: 'Set your unique identifier'
          }, {
            name: 'file',
            type: Boolean,
            description: 'Use the data contained in the file named DATA'
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
            let buffer
            if (args && options.file) {
              buffer = require('fs').readFileSync(args[0])
            } else if (args) {
              buffer = Buffer.from(args[0], 'utf-8')
            } else if (!process.stdin.isTTY) {
              buffer = await new Promise(resolve => {
                const chuncks = []
                process.stdin.on('data', chunck => chuncks.push(chunck))
                process.stdin.on('end', () => {
                  resolve(Buffer.concat(chuncks))
                })
              })
            } else {
              return cli.errorUsage(command, definitions, 'DATA is not defined and stdin is empty')
            }
            delete options.file
            return exec('POST', '/records', options, buffer, { 'content-type': 'application/octet-stream' })
          }
        },
        get: {
          _description: 'Get a record by its identifier.',
          _parameters: { ID: true },
          _exec: (command, definitions, args) => exec('GET', `/records/${args[0]}`)
        },
        delete: {
          _description: 'Delete the data of a record.',
          _parameters: { ID: true },
          _exec: (command, definitions, args) => exec('DELETE', `/records/${args[0]}`)
        }
      }
    }
  }
}).then(code => process.exit)
