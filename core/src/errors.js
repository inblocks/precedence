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
    super(2, 409)
  }
}

class IdAlreadyExistsError extends PrecedenceError {
  constructor (id) {
    super(3, 409, `Id "${id}" already exists`, {id})
  }
}

class NotFoundError extends PrecedenceError {
  constructor (type, id) {
    super(4, 404, `${type.charAt(0).toUpperCase()}${type.slice(1)} "${id}" not found`, {type, id})
  }
}

module.exports = {
  PrecedenceError,
  ConcurrentError,
  IdAlreadyExistsError,
  NotFoundError,
}
