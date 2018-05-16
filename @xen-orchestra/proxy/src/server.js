#!/usr/bin/env node

const APP_NAME = 'xo-proxy'

// -------------------------------------------------------------------

{
  const {
    catchGlobalErrors,
    configure,
  } = require('@xen-orchestra/log/configure')

  configure(require('@xen-orchestra/log/transports/console').default())

  catchGlobalErrors(require('@xen-orchestra/log').default('main'))
}

const { fatal, info, warn } = require('@xen-orchestra/log').default(
  'main:bootstrap'
)

// -------------------------------------------------------------------

const main = async args => {
  info('starting')

  const config = await require('app-conf').load(APP_NAME, {
    appDir: `${__dirname}/..`,
    ignoreUnknownFormats: true,
  })

  let httpServer = new (require('http-server-plus'))()

  const readFile = require('promise-toolbox/promisify')(require('fs').readFile)
  await require('@xen-orchestra/async-map').default(
    config.http.listen,
    async ({ cert, key, ...opts }) => {
      if (cert !== undefined && key !== undefined) {
        ;[opts.cert, opts.key] = await Promise.all([
          readFile(cert),
          readFile(key),
        ])
      }

      try {
        const niceAddress = await httpServer.listen(opts)
        info(`Web server listening on ${niceAddress}`)
      } catch (error) {
        if (error.niceAddress !== undefined) {
          warn(`Web server could not listen on ${error.niceAddress}`)

          const { code } = error
          if (code === 'EACCES') {
            warn('  Access denied.')
            warn('  Ports < 1024 are often reserved to privileges users.')
          } else if (code === 'EADDRINUSE') {
            warn('  Address already in use.')
          }
        } else {
          warn('Web server could not listen', error)
        }
      }
    }
  )

  try {
    const { group, user } = config
    group != null && process.setgid(group)
    user != null && process.setuid(user)
  } catch (error) {
    warn('failed to change group/user', error)
  }

  require('julien-f-source-map-support/register')

  httpServer = require('stoppable')(httpServer)

  const App = require('./main').default
  const app = new App({
    appName: APP_NAME,
    config,
    httpServer,
    safeMode: require('lodash/includes')(args, '--safe-mode'),
  })
  app.on('stop', () =>
    require('promise-toolbox/fromCallback')(cb => httpServer.stop(cb))
  )
  await app.start()

  // Gracefully shutdown on signals.
  //
  // TODO: implements a timeout? (or maybe it is the services launcher
  // responsibility?)
  require('lodash/forEach')(['SIGINT', 'SIGTERM'], signal => {
    let alreadyCalled = false

    process.on(signal, () => {
      if (alreadyCalled) {
        warn('forced exit')
        process.exit(1)
      }
      alreadyCalled = true

      info(`${signal} caught, closing…`)
      app.stop()
    })
  })

  return require('promise-toolbox/fromEvent')(app, 'stopped')
}
main(process.argv.slice(2)).then(
  () => {
    info('bye :-)')

    process.exit(0)
  },
  error => {
    fatal('exception in main', error)

    process.exit(1)
  }
)
