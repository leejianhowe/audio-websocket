import MohayonaoWavDecoder from './custom-wave-decoder.js'
const decoder =  new MohayonaoWavDecoder()
const connectButton = document.getElementById('connect')
const playButton = document.getElementById('play')
const stopButton = document.getElementById('stop')
const resumeButton = document.getElementById('resume')
connectButton.onclick = handleClick
playButton.onclick = play
stopButton.onclick = stop
resumeButton.onclick = resume
const audioContext = new AudioContext({ sampleRate: 32000 })
const gainNode = audioContext.createGain()
const tempStorage = []
let nextStartTime = 0
let source
let isPaused = false
function handleClick() {
    connectServer()
}
function play(res) {
    source = audioContext.createBufferSource()
    const audioBuffer = audioContext.createBuffer(res.numberOfChannels, res.length, res.sampleRate)
    audioBuffer.copyToChannel(res.channelData[0],0)
    source.buffer = audioBuffer
    source.connect(gainNode)
    gainNode.connect(audioContext.destination)
    if (nextStartTime === 0) {
        nextStartTime =
            audioContext.currentTime + res.length / res.sampleRate / 2
    }
    source.start(nextStartTime)
    nextStartTime += res.length / res.sampleRate
}
function stop() {
    nextStartTime = audioContext.currentTime
    console.log('nextStartTime', nextStartTime)
    isPaused = true
    audioContext.suspend()
}
function resume() {
    console.log(audioContext.currentTime)
    console.log(audioContext.sampleRate)
    isPaused = false
    audioContext.resume()
}
function increaseVol() {
    gainNode.gain.value = gainNode.gain.value += 1
}
function decreaseVol() {
    gainNode.gain.value = gainNode.gain.value -= 1
}
function connectServer() {
    const ws = new WebSocket('ws://localhost:8080/music')
    // ws.binaryType = 'arraybuffer'
    ws.onopen = (ev) => {
        console.log(ev)
    }
    ws.onmessage = async (ev) => {
        let buffer
        if (ev.data instanceof ArrayBuffer) {
            console.log("ArrayBuffer")
            buffer = ev.data
        } else {
            console.log("Blob")
            buffer = await ev.data.arrayBuffer();
        }
        try {
            const decodeChunk = await decoder.decodeChunk(buffer)
            console.log(decodeChunk)
            play(decodeChunk)
        } catch (error) {
            console.log(error.message)
        }

        // Check some of the file properties
        // const wav = new wavefile.WaveFile()
        // const converted = wav.fromBuffer(buffer);
        // console.log(buffer)
        // console.log(wav.container)
        // console.log(wav.chunkSize)
        // console.log(wav.fmt.chunkId)
        // audioContext.decodeAudioData(
        //     buffer,
        //     (res) => {
        //         // console.log(res)
        //         tempStorage.push(res)
        //         play(res)
        //     },
        //     (e) => {
        //         console.log('error', e)
        //     }
        // )
    }
    ws.onclose = (ev) => {
        console.log('closed', ev)
    }
}
