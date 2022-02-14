const express = require('express')
const axios = require('axios')

const app = express()

app.post('/', express.json(), (req, res) => {
  console.log('body', req.body)
  res.send('ok')
})

app.listen(process.env.PORT || 3000)
