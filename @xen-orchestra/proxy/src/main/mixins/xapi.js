import { Xapi as XapiBase } from 'xen-api'

const XAPIS = {}

export default class Xapi {
  async getXapi ({ url, user, password, allowUnauthorized = false }) {
    const id = Math.random()
      .toString(36)
      .slice(2)
    XAPIS[id] = new XapiBase({
      allowUnauthorized,
      auth: {
        user,
        password,
      },
      url,
    })
    try {
      await XAPIS[id].connect()
    } catch (error) {
      console.error(error)
    }
    return id
  }

  getObjects ({ xapiId }) {
    console.log('xapiId', xapiId)
    try {
      console.log('XAPIS[xapiId].objects.all', XAPIS[xapiId].objects.all)
    } catch (e) {
      console.log('ERROR', e)
    }
    return XAPIS[xapiId].objects.all
  }
}
