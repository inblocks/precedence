const PrecedenceError = require('../../core/src/errors').PrecedenceError

class UnsupportedMediaTypeError extends PrecedenceError {
  constructor (type) {
    super('API_1', 415, 'Unsupported media type', {
      type
    })
  }
}

class RequestEntityTooLarge extends PrecedenceError {
  constructor (limit) {
    super('API_2', 413, 'Request entity too large', {
      limit
    })
  }
}

class MismatchError extends PrecedenceError {
  constructor (provided, computed) {
    super('API_3', 400, `Provided SHA-256 hexadecimal string "${provided}" mismatches "${computed}"`, {
      data: {
        provided,
        computed
      }
    })
  }
}

module.exports = {
  UnsupportedMediaTypeError,
  RequestEntityTooLarge,
  MismatchError
}
