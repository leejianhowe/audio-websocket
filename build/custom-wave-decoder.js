"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = MohayonaoWavDecoder;

/* MohayonaoWavDecoder
 *
 * Restructured from https://github.com/mohayonao/wav-decoder to allow for
 * recurring calls to decode() for decoding chunks instead of complete
 * files.  ES6 syntax also introduced in some places.
 */
function MohayonaoWavDecoder(opts) {
  this.readerMeta = false;
  this.opts = opts || {};
}

MohayonaoWavDecoder.prototype.decodeChunk = function (arrayBuffer) {
  var _this = this;

  return new Promise(function (resolve) {
    resolve(_this.decodeChunkSync(arrayBuffer));
  });
};

MohayonaoWavDecoder.prototype.decodeChunkSync = function (arrayBuffer) {
  var reader = new MohayonaoReader(new DataView(arrayBuffer)); // first call should parse RIFF meta data and store for subsequent reads

  if (!this.readerMeta) {
    this._init(reader);
  }

  var audioData = this._decodeData(reader);

  if (audioData instanceof Error) {
    throw audioData;
  }

  return audioData;
};

MohayonaoWavDecoder.prototype._init = function (reader) {
  if (reader.string(4) !== 'RIFF') {
    throw new TypeError('Invalid WAV file');
  }

  reader.uint32(); // skip file length

  if (reader.string(4) !== 'WAVE') {
    throw new TypeError('Invalid WAV file');
  }

  var dataFound = false,
      chunkType,
      chunkSize;

  do {
    chunkType = reader.string(4);
    chunkSize = reader.uint32();

    switch (chunkType) {
      case 'fmt ':
        this.readerMeta = this._decodeMetaInfo(reader, chunkSize);

        if (this.readerMeta instanceof Error) {
          throw this.readerMeta;
        }

        break;

      case 'data':
        dataFound = true;
        break;

      default:
        reader.skip(chunkSize);
        break;
    }
  } while (!dataFound);
};

MohayonaoWavDecoder.prototype._decodeMetaInfo = function (reader, chunkSize) {
  var formats = {
    0x0001: 'lpcm',
    0x0003: 'lpcm'
  };
  var formatId = reader.uint16();

  if (!formats.hasOwnProperty(formatId)) {
    return new TypeError('Unsupported format in WAV file: 0x' + formatId.toString(16));
  }

  var meta = {
    formatId: formatId,
    floatingPoint: formatId === 0x0003,
    numberOfChannels: reader.uint16(),
    sampleRate: reader.uint32(),
    byteRate: reader.uint32(),
    blockSize: reader.uint16(),
    bitDepth: reader.uint16()
  };
  reader.skip(chunkSize - 16);
  var decoderOption = meta.floatingPoint ? 'f' : this.opts.symmetric ? 's' : '';
  meta.readerMethodName = 'pcm' + meta.bitDepth + decoderOption;

  if (!reader[meta.readerMethodName]) {
    return new TypeError('Not supported bit depth: ' + meta.bitDepth);
  }

  return meta;
};

MohayonaoWavDecoder.prototype._decodeData = function (reader) {
  var chunkSize = reader.remain();
  var length = Math.floor(chunkSize / this.readerMeta.blockSize);
  var channelData = new Array(this.readerMeta.numberOfChannels);

  for (var ch = 0; ch < this.readerMeta.numberOfChannels; ch++) {
    channelData[ch] = new Float32Array(length);
  }

  var read = reader[this.readerMeta.readerMethodName].bind(reader),
      numChannels = this.readerMeta.numberOfChannels;

  for (var i = 0; i < length; i++) {
    for (var _ch = 0; _ch < numChannels; _ch++) {
      channelData[_ch][i] = read();
    }
  }

  return {
    channelData: channelData,
    length: length,
    numberOfChannels: this.readerMeta.numberOfChannels,
    sampleRate: this.readerMeta.sampleRate
  };
};
/* MohayonaoReader
 *
 * Restructured from https://github.com/mohayonao/wav-decoder createReader()
 * for better performance and less memory when used by multiple instantiations.
 */


function MohayonaoReader(dataView) {
  this.view = dataView;
  this.pos = 0;
}

;
MohayonaoReader.prototype.remain = function () {
  return this.view.byteLength - this.pos;
}, MohayonaoReader.prototype.skip = function (n) {
  this.pos += n;
}, MohayonaoReader.prototype.uint8 = function () {
  var data = this.view.getUint8(this.pos, true);
  this.pos += 1;
  return data;
}, MohayonaoReader.prototype.int16 = function () {
  var data = this.view.getInt16(this.pos, true);
  this.pos += 2;
  return data;
}, MohayonaoReader.prototype.uint16 = function () {
  var data = this.view.getUint16(this.pos, true);
  this.pos += 2;
  return data;
}, MohayonaoReader.prototype.uint32 = function () {
  var data = this.view.getUint32(this.pos, true);
  this.pos += 4;
  return data;
}, MohayonaoReader.prototype.string = function (n) {
  var data = '';

  for (var i = 0; i < n; i++) {
    data += String.fromCharCode(this.uint8());
  }

  return data;
}, MohayonaoReader.prototype.pcm8 = function () {
  var data = this.view.getUint8(this.pos) - 128;
  this.pos += 1;
  return data < 0 ? data / 128 : data / 127;
}, MohayonaoReader.prototype.pcm8s = function () {
  var data = this.view.getUint8(this.pos) - 127.5;
  this.pos += 1;
  return data / 127.5;
}, MohayonaoReader.prototype.pcm16 = function () {
  var data = this.view.getInt16(this.pos, true);
  this.pos += 2;
  return data < 0 ? data / 32768 : data / 32767;
}, MohayonaoReader.prototype.pcm16s = function () {
  var data = this.view.getInt16(this.pos, true);
  this.pos += 2;
  return data / 32768;
}, MohayonaoReader.prototype.pcm24 = function () {
  var x0 = this.view.getUint8(this.pos + 0);
  var x1 = this.view.getUint8(this.pos + 1);
  var x2 = this.view.getUint8(this.pos + 2);
  var xx = x0 + (x1 << 8) + (x2 << 16);
  var data = xx > 0x800000 ? xx - 0x1000000 : xx;
  this.pos += 3;
  return data < 0 ? data / 8388608 : data / 8388607;
}, MohayonaoReader.prototype.pcm24s = function () {
  var x0 = this.view.getUint8(this.pos + 0);
  var x1 = this.view.getUint8(this.pos + 1);
  var x2 = this.view.getUint8(this.pos + 2);
  var xx = x0 + (x1 << 8) + (x2 << 16);
  var data = xx > 0x800000 ? xx - 0x1000000 : xx;
  this.pos += 3;
  return data / 8388608;
}, MohayonaoReader.prototype.pcm32 = function () {
  var data = this.view.getInt32(this.pos, true);
  this.pos += 4;
  return data < 0 ? data / 2147483648 : data / 2147483647;
}, MohayonaoReader.prototype.pcm32s = function () {
  var data = this.view.getInt32(this.pos, true);
  this.pos += 4;
  return data / 2147483648;
}, MohayonaoReader.prototype.pcm32f = function () {
  var data = this.view.getFloat32(this.pos, true);
  this.pos += 4;
  return data;
}, MohayonaoReader.prototype.pcm64f = function () {
  var data = this.view.getFloat64(this.pos, true);
  this.pos += 8;
  return data;
};