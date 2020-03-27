const {
  PrecedenceError,
  ConflictError,
  HashFormatError,
  HashMismatchError,
  InvalidSignatureError,
  MissingDataError,
  RecordAlreadyExistsError,
  RecordNotFoundError
} = require('../../core/src/errors')

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

class RecordDataNotFoundError extends PrecedenceError {
  constructor (id) {
    super('API.RecordDataNotFoundError', `Record "${id}" data not found`)
  }
}

class RequestEntityTooLargeError extends PrecedenceError {
  constructor (value) {
    super('API.RequestEntityTooLargeError', 'Request entity too large', { value })
  }
}

class UnsupportedMediaTypeError extends PrecedenceError {
  constructor () {
    super('API.UnsupportedMediaTypeError', 'Unsupported media type')
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
  RecordNotFoundError,

  BlockNotFoundError,
  ChainNotFoundError,
  RecordDataNotFoundError,
  RequestEntityTooLargeError,
  UnsupportedMediaTypeError
}
