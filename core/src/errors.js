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
    super('CORE.ConflictError', 'Conflict')
  }
}

class HashFormatError extends PrecedenceError {
  constructor (hash) {
    super('CORE.HashFormatError', `Provided hash "${hash}" mismatches ^[0-9a-fA-F]{64}$`)
  }
}

class HashMismatchError extends PrecedenceError {
  constructor (provided, computed) {
    super('CORE.HashMismatchError', `Provided hash "${provided}" mismatches "${computed}"`)
  }
}

class InvalidSignatureError extends PrecedenceError {
  constructor (signature, address, data) {
    super('CORE.InvalidSignatureError', 'Invalid signature', { signature, address, data })
  }
}

class MissingDataError extends PrecedenceError {
  constructor () {
    super('CORE.MissingDataError', 'Data is missing')
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
  HashFormatError,
  HashMismatchError,
  InvalidSignatureError,
  MissingDataError,
  RecordAlreadyExistsError,
  RecordNotFoundError
}
