const createError = require('http-errors')

const PrecedenceError = require('../../core/src/errors').PrecedenceError

const api = fn => async (req, res) => {
  const result = {
    took: undefined,
    status: undefined,
    error: undefined,
    message: undefined,
    data: undefined
  }
  try {
    result.data = await fn(req, res)
    result.status = res.statusCode || 200
  } catch (e) {
    let error
    if (e.statusCode) {
      error = e
    } else if (e instanceof PrecedenceError) {
      error = createError(e.status, e.message && e.message.length > 0 && e.message, {
        code: e.code,
        data: e.data
      })
    } else {
      console.error(e)
      error = createError(500)
    }
    result.status = error.statusCode
    result.error = error.code || 1001
    result.message = error.message
    result.data = error.data
  } finally {
    if (!res.headersSent) {
      res.status(res.statusCode)
      result.took = (Date.now() - req._startTime) || 1
      res.set('Content-Type', 'application/json; charset=utf-8')
      res.send(req.query.pretty === 'true' ? `${JSON.stringify(result, null, 2)}\n` : result)
    }
  }
}

module.exports = {
  api,
  createError
}
