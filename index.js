const express = require('express')
const axios = require('axios')
const { Parser } = require('binary-parser')

const app = express()
const xiaomiMijiaParser = new Parser()
  .endianess('little')
  .buffer('mac', { length: 6 })
  .int16('temperature')
  .int16('humidity')
  .int16('batteryVoltage')
  .uint8('batteryLevel')
  .uint8('counter')
  .uint8('flags')

app.post('/', express.json(), (req, res) => {
  const { data } = req.body
  const buff = Buffer.from(data, 'hex')
  const parsed = xiaomiMijiaParser.parse(buff)
  parsed.temperature = parsed.temperature / 100
  parsed.humidity = parsed.humidity / 100
  parsed.batteryVoltage = parsed.batteryVoltage / 1000
  console.log('Received', parsed)
  res.send('ok')
})

app.listen(process.env.PORT || 3000)
