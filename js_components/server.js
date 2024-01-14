module.exports = function (){

const express = require('express')
const fs = require('fs')
const path = require('path')
const os = require('os')
const bodyParser = require('body-parser')
const rangeParser = require('range-parser')
const { fetchPodcastList, fetchEpisodeList, audioDir } = require('./fileHandling.js')
const app = express()
const port = 3000

app.use(bodyParser.text())

const publicPath = path.join(__dirname.split('js_components').join(''), 'public')
app.use(express.static(publicPath))

app.get('/', (req, res) => {
    res.sendFile(publicPath + '/html/index.html')
})

app.get('/podcast-list', (req, res) => {
    let list = fetchPodcastList()
    res.send(JSON.stringify(list))
})

app.post('/episode-list', (req, res) => {
    const podcast = req.body
    let list = fetchEpisodeList(podcast)
    res.send(JSON.stringify(list))
})

app.post('/thumbnail', (req, res) => {
    const podcast = req.body
    let thumb = audioDir + podcast + '/' + 'thumb.jpg'
    res.sendFile(thumb)
})

let filePathGlobal = ''
let stream;

app.post('/send-podcast', (req, res) => {
    filePathGlobal = audioDir + req.body
    const responseData = {
        data: filePathGlobal
      }
    res.json(responseData)
    // fs.exists(filePath, (exists) => {
    //     if (exists) {
    //         res.setHeader('Content-Type', 'audio/mpeg')
    //         fs.createReadStream(filePath).pipe(res)
    //     } else {
    //         res.status(404).send('file not found')
    //     }
    // })
})

app.get('/fetch-podcast', (req, res) => {
    const filePath = filePathGlobal
    // console.log('file path: ' + filePath)
    const range = req.headers.range;
    const audioSize = fs.statSync(filePath).size

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  
    if (range) {
      const parts = rangeParser(audioSize, range)
  
      if (parts) {
        const start = parts[0].start
        const end = parts[0].end

        stream = fs.createReadStream(filePath, { start, end })
        res.status(206).set({
          'Content-Type': 'audio/mpeg',
          'Content-Length': end - start + 1,
          'Content-Range': `bytes ${start}-${end}/${audioSize}`,
        })
  
        stream.pipe(res)
      } else {
        res.status(416).send('Range Not Satisfiable')
      }
    } else {
      stream = fs.createReadStream(filePath)
      res.status(200).set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioSize,
      })
  
      stream.pipe(res)
    }
})

app.get('/close-stream', (req, res) => {
    if(stream != undefined){
        stream.destroy()
        stream = undefined
        console.log('stream ended')
        res.send('stream closed')
    }
})

app.listen(port, () => {
  const networkConnections = os.networkInterfaces()['Wi-Fi']
  networkConnections.forEach(connection => {
      if(connection.family == 'IPv4'){
          console.log()
          console.log('http://' + connection.address + ':' + port)
          console.log()
      }
  })
})

}