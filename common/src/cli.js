const errorUsage = (command, definitions, message) => printUsage(1, command, definitions, sections => {
  sections.push({
    raw: true,
    content: `{red ERROR: ${message}}`
  })
})

const unknownCommand = (command, definitions, subCommand) => errorUsage(command, definitions, `unknown command "${subCommand}"`)

const unexpectedArguments = (command, definitions, args) => errorUsage(command, definitions, `unexpected argument${args.length > 1 ? 's' : ''} "${args.join('", "')}"`)

const unknownOption = (command, definitions, option) => errorUsage(command, definitions, `unknown option "${option}"`)

const missingArguments = (command, definitions, expected, provided) => {
  const missing = expected - provided
  const part = expected === 1 ? 1 : `${missing}${provided > 0 ? ' more' : ''}`
  const s = missing > 1 ? 's' : ''
  return errorUsage(command, definitions, `"${command}" require ${part} argument${s}`)
}

const getUsage = (command, definitions) => {
  let usage = command || ''
  usage += (usage.length === 0 ? '' : ' ') +
    Object.entries(definitions._parameters || {}).map(([parameter, required]) => {
      return required ? `<${parameter}>` : `[${parameter}]`
    }).join(' ')
  if (definitions._options && definitions._options.length > 0) {
    usage += (usage.endsWith(' ') ? '' : ' ') + '[OPTIONS]'
  }
  return usage
}

const printUsage = (code, command, definitions, modifier) => {
  const sections = [{
    raw: true,
    content: `{bold.underline Usage}{bold :}   {bold ${getUsage(command, definitions)}}`
  }]
  if (definitions._description) {
    sections.push({
      raw: true,
      content: definitions._description
    })
  }
  if (definitions._options) {
    sections.push({
      header: 'Options',
      optionList: definitions._options
    })
  }
  if (definitions._commands) {
    sections.push({
      header: 'Commands',
      content: {
        data: Object.entries(definitions._commands).map(([command, definitions]) => {
          if (definitions._commands) {
            return Object.entries(definitions._commands).map(([subCommand, definitions], index) => {
              return {
                command: index === 0 && command,
                usage: getUsage(subCommand, definitions),
                summary: definitions.summary
              }
            })
          } else {
            return [{
              command,
              usage: getUsage(null, definitions),
              summary: definitions.summary
            }]
          }
        }).reduce((r, a) => r.concat(a), []),
        options: {}
      }
    }, {
      raw: true,
      content: `Run '${command} help COMMAND' for more information on a command.`
    })
  }
  if (modifier) {
    modifier(sections)
  }
  if (definitions._help) {
    definitions._help(sections)
  }
  console.log(require('command-line-usage')(sections))
  return code
}

const run = async (argv, command, definitions) => {
  const arity = Object.entries(definitions._parameters || {}).reduce((r, [k, v]) => {
    if (v) {
      r.min++
    }
    r.max++
    return r
  }, { min: 0, max: 0 })
  const options = []
  options.push({
    name: '*',
    type: String,
    multiple: true,
    defaultOption: true
  })
  if (definitions._options) {
    options.push(...definitions._options)
  }
  const result = require('command-line-args')(options, { argv, stopAtFirstUnknown: true })
  const subCommand = definitions._commands && result['*'] && result['*'][0]
  const subDefinitions = subCommand && definitions._commands[subCommand]
  if (subCommand === 'help') {
    if (result['*'].length > 1) {
      const subCommand = result['*'][1]
      const subDefinitions = subCommand && definitions._commands && definitions._commands[subCommand]
      if (subDefinitions) {
        return printUsage(0, `${command} ${subCommand}`, subDefinitions)
      }
      return unknownCommand(command, definitions, subCommand)
    }
    return printUsage(0, command, definitions)
  }
  if (subDefinitions) {
    return run(argv.slice(1), `${command} ${subCommand}`, subDefinitions)
  }
  if (subCommand) {
    return unknownCommand(command, definitions, subCommand)
  }
  const argumentsCount = (result['*'] || []).length
  if (argumentsCount < arity.min) {
    return missingArguments(command, definitions, arity.min, argumentsCount)
  }
  if (argumentsCount > arity.max) {
    return unexpectedArguments(command, definitions, result['*'].slice(argumentsCount - arity.min - 1))
  }
  if (result._unknown) {
    if (result._unknown.includes('--help')) {
      return printUsage(0, command, definitions)
    }
    return unknownOption(command, definitions, result._unknown[0])
  }
  if (definitions._exec) {
    const args = result['*']
    delete result['*']
    return definitions._exec(command, definitions, args, result)
  }
  return printUsage(1, command, definitions)
}

process.on('SIGINT', () => {
  process.exit(0)
})

module.exports = {
  errorUsage,
  run: async (program, definitions) => {
    try {
      const code = await run(process.argv.slice(2), program, definitions)
      // console.log('code', code)
      process.exit(code)
    } catch (e) {
      console.error(e)
      process.exit(1)
    }
  }
}
