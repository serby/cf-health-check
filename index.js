module.exports = HeathCheck

var async = require('async')
  , extend = require('lodash.assign')

function noop () {
}

function HeathCheck (options) {
  this.checks = []
  this.options = extend({ timeout: 10000 }, options)
}

HeathCheck.prototype.register = function (type, check) {
  type = type.toLowerCase()
  if (type === 'total') throw new Error('‘total’ is a reserved type')

  function checkWrapper (cb) {
    var start = Date.now()
      , timeout

    if (typeof check.cleanFn !== 'function') check.cleanFn = noop

    function buildResult (error, status) {
      var result = { type: type, name: check.name, description: check.description, status: 'Error' }
      if (error) {
        result.error = error.message
      } else {
        result.status = status
      }
      result.time = Date.now() - start
      return result
    }

    timeout = setTimeout(function () {
      timeout = null
      check.cleanFn()
      cb(null, buildResult(null, 'Timed Out'))
    }, this.options.timeout)

    check.fn(function (error, status) {
      if (timeout) {
        clearTimeout(timeout)
        check.cleanFn()
        cb(null, buildResult(error, status))
      }
    })
  }

  this.checks.push(checkWrapper.bind(this))
}

HeathCheck.prototype.run = function (cb) {
  async.parallel(this.checks, function (impossibleErr, results) {

    var returnResults = { results: {}, summary: { total: { fail: 0, pass: 0, count: 0 } } }
    results.forEach(function (result) {
      var type = result.type
      ; delete result.type

      if (returnResults.summary[type] === undefined) {
        returnResults.summary[type] = { fail: 0, pass: 0, count: 0 }
      }

      if (result.error === undefined) {
        returnResults.summary[type].pass += 1
        returnResults.summary.total.pass += 1
      } else {
        returnResults.summary[type].fail += 1
        returnResults.summary.total.fail += 1
      }

      returnResults.summary[type].count += 1
      returnResults.summary.total.count += 1

      if (returnResults.results[type] === undefined) {
        returnResults.results[type] = []
      }

      returnResults.results[type].push(result)

    })
    cb(null, returnResults)
  })
}
