const express = require('express')
const axios = require('axios')
const { Parser } = require('binary-parser')

const stats = []
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
  const buf = Buffer.from(data, 'hex')
  const parsed = xiaomiMijiaParser.parse(buf)
  const temperature = parsed.temperature / 100
  const humidity = parsed.humidity / 100
  const batteryVoltage = parsed.batteryVoltage / 1000
  const address = parsed.mac.toString('hex')

  const tags = [`address=${address}`]
  stats.push({
    name: 'temperature',
    value: temperature,
    tags
  })
  stats.push({
    name: 'humidity',
    value: humidity,
    tags
  })
  stats.push({
    name: 'batteryVoltage',
    value: batteryVoltage,
    tags
  })
  stats.push({
    name: 'batteryLevel',
    value: parsed.batteryLevel,
    tags
  })

  res.send('ok')
})

app.listen(process.env.PORT || 3000)
setTimeout(sendToGrafana, 10 * 1000)

async function sendToGrafana () {
  const time = Math.floor(Date.now() / 1000)
  const hasStatsToSend = !!stats.length
  if (!hasStatsToSend) return setTimeout(sendToGrafana, 10 * 1000)
  stats.forEach(stat => {
    stat.interval = 10
    stat.time = stat.time || time
  })

  try {
    const { data } = await axios.post('https://graphite-prod-01-eu-west-0.grafana.net/graphite/metrics', stats, {
      timeout: 30 * 1000,
      headers: {
        Authorization: `Bearer ${process.env.GRAFANA_API_KEY}`
      }
    })
    stats.splice(0)
  } catch (err) {
    console.error(err)
  }

  setTimeout(sendToGrafana, 10 * 1000)
}
