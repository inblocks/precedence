const {
  PrecedenceError,
  ConflictError,
  RecordAlreadyExistsError,
  RecordNotFoundError
} = require('../../core/src/errors')

class RecordDataNotFoundError extends PrecedenceError {
  constructor (id) {
    super('API.RecordDataNotFoundError', `Record "${id}" data not found`)
  }
}

class BlockNotFoundError extends PrecedenceError {
  constructor (id) {
    super('API.BlockNotFoundError', `Block "${id}" not found`)
  }
}

class ChainNotFoundError extends PrecedenceError {
  constructor (id) {
    super('API.ChainNotFoundError', `Chain "${id}" not found`)
  }
}

class UnsupportedMediaTypeError extends PrecedenceError {
  constructor () {
    super('API.UnsupportedMediaTypeError', 'Unsupported media type')
  }
}

class RequestEntityTooLargeError extends PrecedenceError {
  constructor (value) {
    super('API.RequestEntityTooLargeError', 'Request entity too large', { value })
  }
}

class MismatchError extends PrecedenceError {
  constructor (provided, computed) {
    super('API.MismatchError', `Provided SHA-256 hexadecimal string "${provided}" mismatches "${computed}"`)
  }
}

module.exports = {
  PrecedenceError,
  ConflictError,
  RecordAlreadyExistsError,
  RecordNotFoundError,
  RecordDataNotFoundError,
  BlockNotFoundError,
  ChainNotFoundError,
  UnsupportedMediaTypeError,
  RequestEntityTooLargeError,
  MismatchError
}
