const fs = require('fs')
const ws = require('ws')
const path = require('path')
const express = require('express')
const server = new ws.WebSocketServer({ path: '/music', port: 8080 })
const WaveFile = require('wavefile').WaveFile
const WavDecoder = require('wav-decoder')
const CustomWaveDecoder = require('./build/custom-wave-decoder').default
const PATH_TO_FILE = '/assets/sample4.wav'
const decoder = new CustomWaveDecoder()
server.on('connection', async (wsConn, req) => {
    console.log('connection open')
    const music = fs.createReadStream(__dirname + PATH_TO_FILE)
    // 1st option stream music into duplex
    // const duplex = ws.createWebSocketStream(wsConn);
    // music.pipe(duplex);

    // wavdecoder read as one file
    // const readFile = (path) => {
    //   return new Promise((res,rej)=>{
    //     fs.readFile(__dirname+ path, (err, data) => {
    //       if(err)
    //         return rej(err)
    //       res(data)
    //     })

    //   })
    // }
    // try {
    //   console.log('decoding')
    //   const buffer = await readFile(PATH_TO_FILE)
    //   console.log('buffer complete')
    //   const decoded = await WavDecoder.decode(buffer)
    //   console.log(decoded)
    //   wsConn.send(decoded.channelData[0])
    // } catch (error) {
    //   console.error(error.message)
    // }

    // 2nd option on every chunk of data send the data
    music.on('data', async (chunk) => {
        console.log('is chunk type Buffer ', chunk instanceof Buffer)
        // const arraybufferBuffer = Uint8Array.from(chunk).buffer
        // try {
        //     const decodeChunk = await decoder.decodeChunk(arraybufferBuffer)
        //     console.log(decodeChunk)
        //     wsConn.send(decodeChunk)
        // } catch (error) {
        //     console.log(error.message)
        // }
        // // wavfile
        // const wav = new WaveFile()
        // // Read a wav file from a buffer
        // buffer = wav.fromBuffer(chunk)
        // console.log('wave buffer', buffer)

        // // wav-decoder chunk does not work
        // try {
        //   const decodedChunk = await WavDecoder.decode(chunk)
        //   console.log(decodedChunk.sampleRate);
        //   console.log(decodedChunk.channelData[0]); // Float32Array
        //   console.log(decodedChunk.channelData[1]); // Float32Array
        // } catch (error) {
        //   console.error(error.message)
        // }

        // console.log('length', chunk.length)
        wsConn.send(chunk)
    })
    // 3rd option send music by interval
    // const id = setInterval(() => {
    //   const buffer = music.read(100000);
    //   console.log(buffer);
    //   if (buffer === null) {
    //     clearInterval(id);

    //   }else{
    //     wsConn.send(buffer);
    //   }
    // }, 1000);
    music.on('ready', () => console.log('ready'))
    music.on('end', () => console.log('stream ended'))
    music.on('close', () => {
        console.log('stream close')
    })
    wsConn.on('error', (err) => {
        console.log(error)
    })
    wsConn.on('close', () => {
        console.log('client disconnected')
    })
})

server.on('close', (code, reason) => {
    console.log('connection close', code, reason)
})
const app = express()
app.use(express.static(path.join(__dirname, 'public')))

app.listen(3001, () => {
    console.log('server started')
})
