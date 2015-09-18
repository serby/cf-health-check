# cf-heath-check

Manage heath checks which determine the overall health of a service's dependencies.

[![dependency status](https://david-dm.org/clocklimited/cf-heath-check.svg)](https://david-dm.org/clocklimited/cf-heath-check)

## Installation

```
npm install --save cf-heath-check
```

## Usage

Register a async function that performs a check.

```js

var healthCheck = new HealthCheck()

healthCheck.register('critical'
  , { name: 'Database', description: 'Active connection to database', fn: checkConnection })

function checkConnection(cb) {
  serviceLocator.serviceDatabase.stats(function (err, stats) {
    cb(err, stats.ok === 1 ? 'OK' : 'Error')
  })
}

healthCheck.run(function (err, results) {
  // Process results
})

```

## Credits
[Paul Serby](https://github.com/clocklimited/)

## License

ISC