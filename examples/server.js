// Peiling Jiang
// NYU ITP/IMA 2020

// Create server
const port = process.env.PORT || 8000
const express = require('express')
const app = express()
const server = require('node:http')
  .createServer(app)
  .listen(port, () => {
    console.log('Server listening at port: ', port)
  })

// Take argv and process into address
const myArgs = process.argv.slice(2)
app.use(express.static(myArgs[0]))
