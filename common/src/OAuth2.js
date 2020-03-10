const fs = require('fs')
const path = require('path')

const { sha256 } = require('./utils')

const root = path.resolve(require('os').homedir(), '.precedence', 'oauth2')

let token = null

class OAuth2 {
  static async auth (conf) {
    const params = new URLSearchParams()
    ;['grant_type', 'audience', 'client_id', 'client_secret', 'username', 'password'].forEach(key => {
      if (conf[key]) params.append(key, conf[key])
    })
    const file = path.resolve(root, sha256(params.toString()))
    let exp = await fs.promises.access(file, fs.constants.F_OK).then(() => {
      return fs.promises.readFile(file, 'utf8').then(data => {
        const exp = OAuth2.parseTokenPayload(data).exp * 1000
        if (exp - Date.now() > 1000) {
          token = data
          return exp
        }
      })
    }).catch(e => {
      if (e.code !== 'ENOENT') throw e
      return fs.promises.mkdir(root, { recursive: true }).then(() => {
        return null
      })
    })
    if (!token) {
      token = await require('axios').post(conf.url, params).then(async response => {
        return response.data.access_token
      }).then(token => {
        return fs.promises.writeFile(file, token, { encoding: 'utf8' }).then(() => {
          return token
        })
      }).catch(e => {
        console.error(e.message)
        process.exit(1)
      })
      exp = OAuth2.parseTokenPayload(token).exp * 1000
    }
    const timeout = Math.min(1000 * 60 * 60, (exp - Date.now()) / 2)
    setTimeout(OAuth2.auth, timeout, conf)
  }

  static async logout (id) {
    if (id == null) {
      return (await OAuth2.list()).map(id => {
        OAuth2.logout(id)
        return id
      })
    } else {
      await fs.promises.unlink(path.resolve(root, id))
      return [id]
    }
  }

  static async list () {
    return fs.promises.readdir(root).catch(e => {
      if (e.code === 'ENOENT') return []
      throw e
    })
  }

  static getToken (id) {
    return id ? fs.promises.readFile(path.resolve(root, id), 'utf8') : token
  }

  static parseTokenPayload (token) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'))
  }

}

module.exports = OAuth2
