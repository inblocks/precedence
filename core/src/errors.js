class PrecedenceError extends Error {
  constructor (code, status, message, data) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.code = code
    this.status = status || 500
    this.data = data
  }
}

class ConcurrentError extends PrecedenceError {
  constructor () {
    super(1002, 409)
  }
}

class BlockNotFoundError extends PrecedenceError {
  constructor (id) {
    super(1003, 404, `Block "${id}" not found`, {id})
  }
}

class ChainNotFoundError extends PrecedenceError {
  constructor (id) {
    super(1004, 404, `Chain "${id}" not found`, {id})
  }
}

class RecordNotFoundError extends PrecedenceError {
  constructor (id) {
    super(1005, 404, `Record "${id}" not found`, {id})
  }
}

class RecordAlreadyExistsError extends PrecedenceError {
  constructor (id) {
    super(1006, 409, `Record "${id}" already exists`, {id})
  }
}

module.exports = {
  PrecedenceError,
  ConcurrentError,
  BlockNotFoundError,
  ChainNotFoundError,
  RecordNotFoundError,
  RecordAlreadyExistsError,
}
