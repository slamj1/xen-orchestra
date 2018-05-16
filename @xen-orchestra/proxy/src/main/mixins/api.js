import { format, parse, MethodNotFound } from 'json-rpc-protocol'
import Koa from 'koa'
import Router from 'koa-router'
import koaBody from 'koa-bodyparser'

export default class Api {
  constructor (app, { httpServer }) {
    this.app = app
    const koa = new Koa()
    const router = new Router({ prefix: '/api' })

    koa.on('error', err => {
      console.log('server error', err)
    })
    app.on('start', async function startApi () {
      httpServer.on('request', koa.callback())
    })
    koa.use(router.routes()).use(router.allowedMethods())
    router.post('/', koaBody(), async ctx => {
      let body
      try {
        body = parse(ctx.request.body)
      } catch (error) {
        ctx.body = format.error(null, error)
        return
      }

      try {
        ctx.body = format.response(
          body.id,
          await this._call(body.method, body.params)
        )
      } catch (error) {
        ctx.body = format.error(body.id, error)
      }
    })
  }

  _call (method, params) {
    console.log(`[CALL] ${method}(${JSON.stringify(params)})`)
    if (this.app[method] === undefined) {
      const error = new MethodNotFound(method)
      throw error
    }
    return this.app[method].call(this, params)
  }
}
