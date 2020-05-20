// Indexes are inclusive
// Header format:
// 0-11 chunk descriptor
//    0-3: "RIFF"
//    5-7: chunk size
//    8-11: "WAVE"
// 
// 12-(subchunk1size + 19) fmt subchunk
//    12-15: "fmt "
//    16-19: subchunk1size (probably 16)
//    20-21: audioformat (if 1 --> PCM --> subchunk1size == 16)
//    22-23: num channels
//    24-27: sample rate (number of samples per second)
//    28-31: byte rate (number of bytes per unit of time)
//    32-33: block align (number of bytes per sample)
//    34-35: bits per sample (per channel?)
//
// 36-(subchunk2size + 44) data subchunk
//    36-39: "data"
//    40-43: subchunk2size
//    44-(subchunk2size + 44): samples
class Wav {
  decArray = [];
  data = []; // Int8 values
  offset = 0;
  audioData = []; // Int32 values
  header = {
    "riff": -1,
    "chunkSize": -1,
    "wave": -1,
    "fmt": -1,
    "subchunk1Size": -1,
    "audioFormat": -1,
    "numChannels": -1,
    "sampleRate": -1,
    "byteRate": -1,
    "blockAlign": -1,
    "bitsPerSample": -1,
    "data": -1,
    "subchunk2Size": -1
  };

  fromFile(arr) {
    this.decArray = arr;
    this.addHeader();
    this.addData();
    this.checkMetaData();
    this.printHeader();
    this.toIntArray();
  }

  fromInterm(interm) {
    this.audioData = interm.data;
    this.header = this.genHeader(interm);
    this.printHeader();
  }

  toInterm() {
    var interm = new Intermediate();
    interm.data = this.audioData;
    interm.rate = decToValue(this.header.byteRate);
    return interm;
  }

  // Assuming:
  // Format: PCM
  // Number of channels: 2
  // Block align: 4 (bytes per sample)
  // Bits per sample: 16 (bits per sample per channel)
  genHeader(interm) {
    var length = interm.data.length * 4;
    var rate = interm.rate;
    var header = {
      "riff": [82, 73, 70, 70],
      "chunkSize": valueToDec(length + 36),
      "wave": [87, 65, 86, 69],
      "fmt": [102, 109, 116, 32],
      "subchunk1Size": [16, 0, 0, 0], // For PCM format
      "audioFormat": [1, 0], // PCM format
      "numChannels": [2, 0],
      "sampleRate": valueToDec(rate / 4),
      "byteRate": valueToDec(rate),
      "blockAlign": [4, 0],
      "bitsPerSample": [16, 0],
      "data": [100, 97, 116, 97],
      "subchunk2Size": valueToDec(length)
    };
    return header;
  }

  addHeader() {
    this.header.riff = this.getSlice(0, 4, 0);
    this.header.chunkSize = this.getSlice(4, 8, 0);
    this.header.wave = this.getSlice(8, 12, 0);
    this.offset = this.skipJunk(12);
    this.header.fmt = this.getSlice(12, 16);
    this.header.subchunk1Size = this.getSlice(16, 20);
    this.header.audioFormat = this.getSlice(20, 22);
    this.header.numChannels = this.getSlice(22, 24);
    this.header.sampleRate = this.getSlice(24, 28);
    this.header.byteRate = this.getSlice(28, 32);
    this.header.blockAlign = this.getSlice(32, 34);
    this.header.bitsPerSample = this.getSlice(34, 36);
  }

  addData() {
    this.offset += this.skipJunk(36);
    this.header.data = this.getSlice(36, 40);
    this.header.subchunk2Size = this.getSlice(40, 44);
    this.data = this.getSlice(44, 44 + decToValue(this.header.subchunk2Size));
    var left = [];
    var right = [];
    for (var i = 0; i < this.data.length; i+=4) {
      left.push(decToValue(this.data.slice(i, i+2)));
      right.push(decToValue(this.data.slice(i+2, i+4)));
    }
  }

  getSlice(start, end) {
    return this.decArray.slice(start + this.offset, end + this.offset);
  }

  printHeader() {
    console.log("Chunk size: " + decToValue(this.header.chunkSize));
    console.log("Subchunk1 size: " + decToValue(this.header.subchunk1Size));
    console.log("Audio format: " + decToValue(this.header.audioFormat));
    console.log("Number of channels: " + decToValue(this.header.numChannels));
    console.log("Sample rate: " + decToValue(this.header.sampleRate));
    console.log("Byte rate: " + decToValue(this.header.byteRate));
    console.log("Block align: " + decToValue(this.header.blockAlign));
    console.log("Bits per sample : " + decToValue(this.header.bitsPerSample));
    console.log("Subchunk2 size: " + decToValue(this.header.subchunk2Size));
  }

  skipJunk(index) {
    var name = this.getSlice(index, index + 4);
    var name = String.fromCharCode.apply(null, name);
    if (name.localeCompare("JUNK") == 0
      || name.localeCompare("FLLR") == 0) {
      var size = this.getSlice(index + 4, index + 8);
      var decSize = decToValue(size);
      return 8 + decSize;
    }
    return 0;
  }

  // Splits 32bit int array into 8bit array
  toIntArray() {
    for (var i = 0; i < this.data.length - 3; i += 4) {
      var result = (this.data[i + 3] << 24
        | this.data[i + 2] << 16
        | this.data[i + 1] << 8
        | this.data[i]);
      this.audioData.push(result);
    }
  }


  getSampleFromInt(sample) {
    var result = [];
    var base = 255;
    result.push(sample & base);
    result.push((sample & (base << 8)) >> 8);
    result.push((sample & (base << 16)) >> 16);
    result.push((sample & (base << 24)) >> 24);
    return result;
  }

  separateSamples() {
    var samples = [];

    for (var i = 0; i < this.audioData.length; i++) {
      var vals = this.getSampleFromInt(this.audioData[i]);
      samples.push(vals[0], vals[1], vals[2], vals[3]);
    }
    samples = Uint8Array.from(samples);
    return samples;
  }

  getOutputHeader() {
    var result = [];
    result.push(...this.header.riff);
    result.push(...this.header.chunkSize);
    result.push(...this.header.wave);
    result.push(...this.header.fmt);
    result.push(...this.header.subchunk1Size);
    result.push(...this.header.audioFormat);
    result.push(...this.header.numChannels);
    result.push(...this.header.sampleRate);
    result.push(...this.header.byteRate);
    result.push(...this.header.blockAlign);
    result.push(...this.header.bitsPerSample);
    result.push(...this.header.data);
    result.push(...this.header.subchunk2Size);
    return Uint8Array.from(result);
  }

  toFile(filepath) {
    var outputHeader = this.getOutputHeader();
    var arrayData = [];
    if (this.data.length == 0) {
      arrayData = this.separateSamples();
    } else {
      arrayData = this.data;
    }

    var data = new Blob([outputHeader, arrayData]);

    if (filepath !== null) {
      window.URL.revokeObjectURL(filepath);
    }

    filepath = window.URL.createObjectURL(data);

    return filepath;
  }

  checkMetaData() {
    var riff = String.fromCharCode.apply(null, this.header.riff);
    if (riff.localeCompare("RIFF") != 0) {
      throw new Error('RIFF data does not match ' + riff);
    }
    var wave = String.fromCharCode.apply(null, this.header.wave);
    if (wave.localeCompare("WAVE") != 0) {
      throw new Error('WAVE data does not match ' + wave);
    }
    var fmt = String.fromCharCode.apply(null, this.header.fmt);
    if (fmt.localeCompare("fmt ") != 0) {
      throw new Error('fmt data does not match ' + fmt);
    }
    if (!compareArrays(this.header.audioFormat, [1, 0])) {
      throw new Error('audio format does not match ' + this.header.audioFormat.join(' '));
    }
    var data = String.fromCharCode.apply(null, this.header.data);
    if (data.localeCompare("data") != 0) {
      throw new Error('data does not match ' + data);
    }
  }
}

function valueToDec(value) {
  var hex = decimalToHex(value, 8);
  var arr = [];
  for (var i = hex.length; i >= 2; i -= 2) {
    var curr = hex.substring(i - 2, i)
    arr.push(parseInt(curr, 16));
  }
  return arr
}

function decimalToHex(d, padding) {
  var hex = Number(d).toString(16);
  padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

  while (hex.length < padding) {
    hex = "0" + hex;
  }

  return hex;
}

// Converts decimal values to Hex, then gets big-endian decimal
// value
function decToValue(arr) {
  if (arr.length > 4) {
    throw new Error("Cannot convert number larger than 4 bytes");
  }
  var hex = dec2hex(arr);
  return parseInt(hex.reverse().join(''), 16);
}

function compareArrays(arr1, arr2) {
  if (arr1.length != arr2.length) {
    return false;
  }
  for (var i = 0; i < arr1.length; i++) {
    if (arr1[i] != arr2[i]) {
      return false;
    }
  }
  return true;
}

function buf2hex(buffer) { // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2));
}

function dec2hex(arr) { // arr is a decimal array
  return Array.prototype.map.call(arr, x => ('00' + x.toString(16)).slice(-2));
}