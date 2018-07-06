import request from 'http-request-plus'
import { groupBy } from 'lodash'

const makeRequest = (url, method, params) =>
  request(url, {
    body: JSON.stringify({ method, params }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })

class XoServerHooks {
  constructor ({ xo }) {
    this._xo = xo

    // Defined in configure().
    this._conf = null
    this._key = null
    this.handleHook = this.handleHook.bind(this)
  }

  configure (configuration) {
    this._conf = groupBy(configuration, 'method')
  }

  handleHook (method, params) {
    let hooks
    if ((hooks = this._conf[method]) === undefined) {
      return
    }
    return Promise.all(hooks.map(({ url }) => makeRequest(url, method, params)))
  }

  load () {
    this._xo.on('call', this.handleHook)
  }

  unload () {
    this._xo.removeListener('call', this.handleHook)
  }

  test ({ url }) {
    return makeRequest(url, 'vm.start', { id: 'foobar' })
  }
}

export const configurationSchema = ({ xo: { apiMethods } }) => ({
  description: 'Bind XO API calls to HTTP requests.',
  type: 'array',
  items: {
    type: 'object',
    title: 'Hook',
    properties: {
      method: {
        description: 'The method to be bound to',
        enum: Object.keys(apiMethods),
        title: 'Method',
        type: 'string',
      },
      url: {
        description: 'The full URL you wish the request to be sent to',
        title: 'URL',
        type: 'string',
      },
    },
    required: ['method', 'url'],
  },
})

export const testSchema = {
  type: 'object',
  description:
    'The test will simulate a hook to vm.start with {"id":"foobar"} as a parameter',
  properties: {
    url: {
      title: 'URL',
      type: 'string',
      description: 'The URL the test request will be sent to',
    },
  },
}

export default opts => new XoServerHooks(opts)
