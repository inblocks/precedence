#!/usr/bin/env node

const cli = require('../../common/src/')

const defaults = {
  api: 'http://localhost:9000'
}

const exec = async (method, url, params, data, headers) => {
  let code
  try {
    const result = await require('axios').request({
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
    })
    process.stdout.write(`${JSON.stringify(result.data, null, 2)}\n`)
    code = 0
  } catch (e) {
    if (e.response) {
      process.stdout.write(`${JSON.stringify(e.response.data, null, 2)}\n`)
    } else {
      console.error(e)
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
        description: `Set API base URL (default: "${defaults.api}")`
      }]
    })
    return sections
  },
  _parameters: {COMMAND: false},
  _commands: {
    blocks: {
      _parameters: {COMMAND: false},
      _commands: {
        create: {
          summary: 'Create blocks',
          _description: 'Create a block containing records that are not yet blocked.',
          _options: [{
            name: 'no-empty',
            type: Boolean,
            description: `Don't create the block if it doesn't contain any record`,
          }, {
            name: 'max',
            type: Number,
            description: 'Set maximum of records in the block',
          }],
          _exec: (command, definitions, args, options) => exec('POST', '/blocks', {
            empty: !options['no-empty'],
            max: options.max
          })
        },
        get: {
          summary: 'Get blocks',
          _description: `Get a block by its index (number) or its root hash (SHA-256 hexadecimal string).
If you do not provide any argument, you get the last block.`,
          _parameters: {'INDEX|ROOT': false},
          _exec: (command, definitions, args) => exec('GET', `/blocks${args && `/${args[0]}` || ''}`)
        },
      }
    },
    chains: {
      _parameters: {COMMAND: false},
      _commands: {
        get: {
          summary: 'Get records by chains',
          _description: 'Get the last record of a chain.',
          _parameters: {NAME: true},
          _exec: (command, definitions, args) => exec('GET', `/chains/${args[0]}`)
        },
        delete: {
          summary: 'Delete chains',
          _description: 'Delete the last record of the chain and recursively all of its previous.',
          _parameters: {NAME: true},
          _exec: (command, definitions, args) => exec('DELETE', `/chains/${args[0]}`)
        }
      }
    },
    records: {
      _parameters: {COMMAND: false},
      _commands: {
        create: {
          summary: 'Create records',
          _description: `Create a new record with given DATA.
DATA can be optionally a file or read from the standard input (stdin).
You can optionally specify the id to be sure to don't re-create a same record (idempotent).
You can optionally specify the SHA-256 hexadecimal string and {bold.italic precedence} will create the record only if the data matches.
You can optionally specify chain names to implicitly consider the last record identifier of each chain as a previous without having to specify them explicitly with the previous option.
You can optionally specify previous existing record identifiers.`,
          _parameters: {DATA: false},
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
            description: 'Set DATA SHA-256 hexadecimal string',
            lazyMultiple: true
          }, {
            name: 'id',
            type: String,
            description: 'Set id'
          }, {
            name: 'file',
            type: Boolean,
            description: 'Consider DATA as a file name'
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
            return exec('POST', '/records', options, buffer, {'content-type': 'application/octet-stream'})
          }
        },
        get: {
          summary: 'Get records',
          _description: 'Get a record by its identifier.',
          _parameters: {ID: true},
          _exec: (command, definitions, args) => exec('GET', `/records/${args[0]}`)
        },
        delete: {
          summary: 'Delete records data',
          _description: 'Delete a record (data, chains).',
          _parameters: {ID: true},
          _options: [
            {
              alias: 'r',
              name: 'recursive',
              type: Boolean,
              description: 'Delete recursively all of its previous too',
            }
          ],
          _exec: (command, definitions, args, options) => exec('DELETE', `/records/${args[0]}`, options)
        }
      }
    }
  }
})
