class PrecedenceError extends Error {
  constructor (code, status, message, data) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.code = code
    this.status = status
    this.data = data
  }
}

class ConcurrentError extends PrecedenceError {
  constructor () {
    super('CORE_1', 409)
  }
}

class BlockNotFoundError extends PrecedenceError {
  constructor (id) {
    super('CORE_2', 404, `Block "${id}" not found`, { id })
  }
}

class ChainNotFoundError extends PrecedenceError {
  constructor (id) {
    super('CORE_3', 404, `Chain "${id}" not found`, { id })
  }
}

class RecordNotFoundError extends PrecedenceError {
  constructor (id) {
    super('CORE_4', 404, `Record "${id}" not found`, { id })
  }
}

class RecordAlreadyExistsError extends PrecedenceError {
  constructor (id) {
    super('CORE_5', 409, `Record "${id}" already exists`, { id })
  }
}

module.exports = {
  PrecedenceError,
  ConcurrentError,
  BlockNotFoundError,
  ChainNotFoundError,
  RecordNotFoundError,
  RecordAlreadyExistsError
}
