# cf-health-check

Manage health checks which determine the overall health of a service's dependencies.

[![build status](https://api.travis-ci.org/clocklimited/cf-heath-check.svg)](http://travis-ci.org/clocklimited/cf-heath-check) [![Dependences](https://david-dm.org/clocklimited/cf-heath-check.svg)](https://david-dm.org/clocklimited/cf-heath-check/) [![Join the chat at https://gitter.im/clocklimited/cf-heath-check](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/clocklimited/cf-heath-check?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Installation

```
npm install --save cf-health-check
```

## Usage

Register an async function that performs something you want to check.

```js

var healthCheck = new HealthCheck({ timeout: 5000 })

function checkConnection(cb) {
  serviceLocator.serviceDatabase.stats(function (err, stats) {
    cb(err, stats.ok === 1 ? 'OK' : 'Error')
  })
}

// Optional
function cleanFn() {
  // do something to clean up check.
}

healthCheck.register('critical'
  , { name: 'Database', description: 'Active connection to database', fn: checkConnection, cleanFn: cleanFn })


healthCheck.run(function (err, results) {
  // Process results
})
```

## Options

* timeout - Length of time each check is allowed before returning 'Timed out' status. (Default 10s)

## Credits
[Paul Serby](https://github.com/clocklimited/)

## License

ISC
