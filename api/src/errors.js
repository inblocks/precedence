const PrecedenceError = require('../../core/src/errors').PrecedenceError

class ApiError extends PrecedenceError {
  constructor (code, status, message, data) {
    super(code, status, message, data)
  }
}

class MismatchError extends ApiError {
  constructor (provided, computed) {
    super(2002, 400, `Provided SHA-256 hexadecimal string "${provided}" mismatches "${computed}"`, {
      data: {
        provided,
        computed
      }
    })
  }
}

module.exports = {
  ApiError,
  MismatchError
}
