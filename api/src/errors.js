const PrecedenceError = require('../../core/src/errors').PrecedenceError

class MismatchError extends PrecedenceError {
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
  MismatchError
}
