// Peiling Jiang
// NYU ITP/IMA 2020

// Create server
let port = process.env.PORT || 8000
let express = require('express')
let app = express()
let server = require('http')
  .createServer(app)
  .listen(port, function () {
    console.log('Server listening at port: ', port)
  })

// Take argv and process into address
var myArgs = process.argv.slice(2)
app.use(express.static(myArgs[0]))
