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

class HashMismatchedDataError extends PrecedenceError {
  constructor (provided, computed) {
    super('CORE.HashMismatchedDataError', `Provided SHA-256 hexadecimal string "${provided}" mismatches "${computed}"`)
  }
}

class InvalidSignatureError extends PrecedenceError {
  constructor (signature, address, data) {
    super('CORE.InvalidSignatureError', 'Invalid signature', { signature, address, data })
  }
}

module.exports = {
  PrecedenceError,
  ConflictError,
  RecordAlreadyExistsError,
  RecordNotFoundError,
  HashMismatchedDataError,
  InvalidSignatureError
}
