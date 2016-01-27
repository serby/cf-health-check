var HealthCheck = require('..')
  , assert = require('assert-diff')
  , mockdate = require('mockdate')

function makeCheck (output) {
  return function check (cb) {
    cb(null, output)
  }
}

function errorFn (cb) {
  cb(new Error('Oops'))
}

describe('health-check', function () {

  it('should expected output for no checks', function (done) {

    var healthCheck = new HealthCheck()

    mockdate.set(Date.now())
    healthCheck.run(function (ignoreErr, results) {
      assert.deepEqual(results
        , { summary: { total: { fail: 0, pass: 0, count: 0 } }
          , results: { }
          })
      mockdate.reset()
      done()
    })

  })

  it('should execute all the checks', function (done) {

    var healthCheck = new HealthCheck()

    healthCheck.register('critical'
      , { name: 'test', description: 'my test', fn: makeCheck('OK') })

    healthCheck.register('critical'
      , { name: 'database speed', description: 'speed test', fn: makeCheck('100ms') })
    mockdate.set(Date.now())
    healthCheck.run(function (ignoreErr, results) {
      assert.deepEqual(results
        , { summary: { critical: { fail: 0, pass: 2, count: 2 }, total: { fail: 0, pass: 2, count: 2 } }
          , results:
            { critical:
              [ { name: 'test', description: 'my test', status: 'OK', time: 0 }
              , { name: 'database speed', description: 'speed test', status: '100ms', time: 0 } ]
            }
          })
      mockdate.reset()
      done()
    })

  })

  it('should not allow `total` as a check type', function () {

    var healthCheck = new HealthCheck()

    assert.throws(function () {
      healthCheck.register('total'
        , { name: 'test', description: 'my test', fn: makeCheck('OK') })
    }, /‘total’ is a reserved type/)

  })

  it('should complete all checks even if one errors', function (done) {

    var healthCheck = new HealthCheck()

    healthCheck.register('critical', { name: 'test', description: 'my test', fn: errorFn })
    healthCheck.register('critical',
      { name: 'database speed', description: 'speed test', fn: makeCheck('100ms') })

    mockdate.set(Date.now())
    healthCheck.run(function (ignoreErr, results) {
      assert.deepEqual(results
        , { summary: { critical: { fail: 1, pass: 1, count: 2 }, total: { fail: 1, pass: 1, count: 2 } }
          , results:
            { critical:
              [ { name: 'test', description: 'my test', status: 'Error', error: 'Oops', time: 0 }
              , { name: 'database speed', description: 'speed test', status: '100ms', time: 0 } ]
            }
          })
      mockdate.reset()
      done()
    })

  })

  it('should group types', function (done) {

    var healthCheck = new HealthCheck()

    healthCheck.register('critical', { name: 'critical test', description: '', fn: makeCheck('OK') })
    healthCheck.register('warning', { name: 'warning test', description: '', fn: errorFn })

    mockdate.set(Date.now())
    healthCheck.run(function (ignoreErr, results) {
      assert.deepEqual(results
        , { summary:
            { critical: { fail: 0, pass: 1, count: 1 }
            , warning: { fail: 1, pass: 0, count: 1 }, total: { fail: 1, pass: 1, count: 2 } }
          , results:
            { critical: [ { name: 'critical test', description: '', status: 'OK', time: 0 } ]
            , warning: [ { name: 'warning test', description: '', status: 'Error', error: 'Oops', time: 0 } ]
            }
          })
      mockdate.reset()
      done()
    })

  })

  it('should correctly return time', function (done) {

    var healthCheck = new HealthCheck()
      , now = Date.now()

    function check (cb) {
      mockdate.set(now + 999)
      cb(null, 'OK')
    }

    mockdate.set(now)
    healthCheck.register('critical', { name: 'critical test', description: '', fn: check })

    healthCheck.run(function (ignoreErr, results) {
      assert.deepEqual(results
        , { summary: { critical: { fail: 0, pass: 1, count: 1 }, total: { fail: 0, pass: 1, count: 1 } }
          , results:
            { critical: [ { name: 'critical test', description: '', status: 'OK', time: 999 } ]
            }
          })
      mockdate.reset()
      done()
    })

  })

  it('should set status to timeout if time is exceeded', function (done) {

    var healthCheck = new HealthCheck({ timeout: 200 })
      , now = Date.now()

    mockdate.set(now)

    function check (cb) {
      mockdate.set(now + 200)
      setTimeout(cb, 1000)
    }

    healthCheck.register('critical', { name: 'critical test', description: '', fn: check })

    healthCheck.run(function (ignoreErr, results) {
      assert.deepEqual(results
        , { summary: { critical: { fail: 1, pass: 0, count: 1 }, total: { fail: 1, pass: 0, count: 1 } }
          , results:
            { critical: [ { name: 'critical test', description: '', error: 'Check Timed Out', status: 'Error', time: 200 } ]
            }
          })
      mockdate.reset()
      done()
    })

  })

  it('should run `cleanFn` after check', function (done) {

    var healthCheck = new HealthCheck({ timeout: 200 })
      , order = []

    function check (cb) {
      order.push('check')
      cb()
    }

    function cleanFn () {
      order.push('clean')
    }

    healthCheck.register('critical', { name: 'critical test', description: '', fn: check, cleanFn: cleanFn })

    healthCheck.run(function () {
      assert.deepEqual(order, [ 'check', 'clean' ])
      done()
    })

  })

  it('should run `cleanFn` after timeout occurred', function (done) {

    var healthCheck = new HealthCheck({ timeout: 200 })
      , order = []

    function check () {
      order.push('check')
    }

    function cleanFn () {
      order.push('clean')
    }

    healthCheck.register('critical', { name: 'critical test', description: '', fn: check, cleanFn: cleanFn })

    healthCheck.run(function () {
      assert.deepEqual(order, [ 'check', 'clean' ])
      done()
    })

  })
})
