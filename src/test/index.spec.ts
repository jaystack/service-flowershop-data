import 'mocha'
import * as assert from 'assert'

import System from '../asset/index'

describe('System', () => {
  it('starts', (done) => {
    System.then(resources => {
      assert.ok(resources)
      done()
    }).catch(err => done(err))
  })
})