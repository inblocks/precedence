const {
  PrecedenceError,
  ConflictError,
  RecordAlreadyExistsError,
  RecordNotFoundError
} = require('../../core/src/errors')

class RecordDataNotFoundError extends PrecedenceError {
  constructor (id) {
    super('API.RecordDataNotFoundError', `Record "${id}" data not found`, id)
  }
}

class BlockNotFoundError extends PrecedenceError {
  constructor (id) {
    super('API.BlockNotFoundError', `Block "${id}" not found`, id)
  }
}

class ChainNotFoundError extends PrecedenceError {
  constructor (id) {
    super('API.ChainNotFoundError', `Chain "${id}" not found`, id)
  }
}

class UnsupportedMediaTypeError extends PrecedenceError {
  constructor (type) {
    super('API.UnsupportedMediaTypeError', 'Unsupported media type', type)
  }
}

class RequestEntityTooLargeError extends PrecedenceError {
  constructor (limit) {
    super('API.RequestEntityTooLargeError', 'Request entity too large', limit)
  }
}

class MismatchError extends PrecedenceError {
  constructor (provided, computed) {
    super('API.MismatchError', `Provided SHA-256 hexadecimal string "${provided}" mismatches "${computed}"`, {
      provided,
      computed
    })
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
