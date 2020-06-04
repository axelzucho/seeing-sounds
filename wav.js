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
  repeat = 1;
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
    this.getFrequencies();
    // this.toIntArray();
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

  // Merges 8 bit values into 32 bit array
  toIntArray() {
    for (var i = 0; i < this.data.length - 3; i += 4) {
      var result = (this.data[i + 3] << 24
        | this.data[i + 2] << 16
        | this.data[i + 1] << 8
        | this.data[i]);
      this.audioData.push(result);
    }
  }


  // Splits 32bit int array into 8bit array
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

  audioFromSamples() {
    var samples = [];
    var chunkSize = 500;

    var max = arrayMax(this.audioData);
    for (var i = 0; i < this.audioData.length; i += chunkSize) {
      var slice = this.audioData.slice(i, i + chunkSize);
      var avg = 0;
      var currMin = max;
      var currMax = 0;
      for (var j = 0; j < slice.length; j++) {
        var curr = slice[j];
        currMin = curr < currMin ? curr : currMin;
        currMax = curr > currMax ? curr : currMax;
        avg += slice[j];
      }
      avg /= chunkSize;

      var amplitudes = new Array(chunkSize).fill(0);
      var phases = new Array(chunkSize).fill(0);
      var avgIndex = Math.floor(avg * (chunkSize - 1) / max);
      var minIndex = Math.floor(currMin * (chunkSize - 1) / max);
      var maxIndex = Math.floor(currMax * (chunkSize - 1) / max);
      // Melody
      amplitudes[avgIndex] = 200 * 2 * Math.PI;
      // Bass
      amplitudes[minIndex] = 1000 * 2 * Math.PI;
      // High notes
      amplitudes[maxIndex] = 200 * 2 * Math.PI;

      var s = this.getWave(amplitudes, phases);
      for (var j = 0; j < s.length; j++) {
        var leftArr = valueToDec(s[j]);
        var rightArr = valueToDec(s[j]);
        samples.push(leftArr[0], leftArr[1], rightArr[0], rightArr[1]);
      }
    }
    samples = Uint8Array.from(samples);
    return samples;
  }

  getFrequencies() {
    const chunkSize = 2048;
    var left = [];
    var right = [];

    for (var i = 0; i < this.data.length; i += 4) {
      left.push(decToValue(this.data.slice(i, i + 2)));
      right.push(decToValue(this.data.slice(i + 2, i + 4)));
    }

    let indices = [];

    for (let i = 0; i < left.length; i+=chunkSize) {
      let slice = left.slice(i, i+chunkSize);
      let maxFreqs = this.getMaxFreq(slice, 1);
      let maxFreq = maxFreqs.map(v => v.amp * v.freq);
      indices.push(...maxFreq);
    }

    const minColor = 0;
    const maxColor = 16777215; // Max RGB value: 0xFFFFFF
    const minFreq = Math.log(5000);
    const maxFreq = Math.log(22000); // Max frequency on this scale
    
    // Apply log to frequencies
    let logVals = indices.map(v => Math.log(v));
    // Normalize to RGB range
    let rgbVals = logVals.map(v => mapVals(v, minFreq, maxFreq, minColor, maxColor));

    this.audioData = rgbVals;
  }

  getMaxFreq(slice, n) {
    const mult = 100;
    let complexSlice = slice.map(x => new ComplexNumber({re:x}));
    let freqs = fastFourierTransform(complexSlice);
    freqs = freqs.slice(1, Math.floor(freqs.length/2));
    let absFreqs = freqs.map(val => val.getRadius());
    let dataIndex = absFreqs.map((v, i) => [v, i]);
    dataIndex.sort(cmp);
    dataIndex = dataIndex.slice(0, n);
    // Frequencies are log scaled
    dataIndex = dataIndex.map(function(v) {
      return {
        amp: v[0],
        freq: v[1] * mult
      }
    });
    return dataIndex;
  }

  getWave(a, p) {
    if (a.length != p.length) {
      throw new Error('Bucket sizes should be equal');
    }
    var freq = [];
    for (var i = 0; i < a.length; i++) {
      var real = a[i] * Math.cos(p[i]);
      var imag = a[i] * Math.sin(p[i]);
      freq.push(new ComplexNumber({ re: real, im: imag }));
    }
    var samples = inverseDiscreteFourierTransform(freq);
    // var freq2 = dft(samples);
    var min = Math.abs(Math.min(...samples))
    var samples = samples.map(x => Math.floor(x + min));
    return samples;
  }

  sineWave(s, a, f) {
    let res = [];
    for (let n = 0; n < s; n++) {
      var t = n / decToValue(this.header.sampleRate);
      res.push(Math.floor(a * (Math.sin(2 * Math.PI * f * t) + 1)));
    }
    return res;
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
      arrayData = this.audioFromSamples();
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

function download(text, name) {
  var a = document.getElementById("getFile");
  var file = new Blob([text]);
  a.href = URL.createObjectURL(file);
  a.style.display = 'block';
  a.download = name;
}

function arrayMax(arr) {
  var max = -Number.MAX_VALUE;
  arr.forEach(function (e) {
    if (max < e) {
      max = e;
    }
  });
  return max;
}

function cmp(a, b) {
  return a[0] > b[0] ? -1 : (a[0] < b[0] ? 1 : 0);
}

// Maps value p in range A-B to range C-D
function mapVals(p, A, B, C, D) {
  return ((p - A) * ((D - C) / (B - A))) + C;
}