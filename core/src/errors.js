class PrecedenceError extends Error {
  constructor (type, message, data) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.type = type
    this.data = data
  }
}

class ConflictError extends PrecedenceError {
  constructor () {
    super('CORE.Conflict', 'Conflict')
  }
}

class RecordAlreadyExistsError extends PrecedenceError {
  constructor (id) {
    super('CORE.RecordAlreadyExistsError', `Record "${id}" already exists`)
  }
}

class RecordNotFoundError extends PrecedenceError {
  constructor (id) {
    super('CORE.RecordNotFoundError', `Record "${id}" not found`)
  }
}

module.exports = {
  PrecedenceError,
  ConflictError,
  RecordAlreadyExistsError,
  RecordNotFoundError
}
