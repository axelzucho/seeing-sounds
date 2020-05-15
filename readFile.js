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
  constructor(arr) {
    this.arr = arr;
    this.offset = 0;
  }
  addHeader() {
    this.riff = this.getSlice(0, 4, 0);
    this.chunkSize = this.getSlice(4, 8, 0);
    this.wave = this.getSlice(8, 12, 0);
    this.offset = this.skipJunk(12);
    this.fmt = this.getSlice(12, 16);
    this.subchunk1Size = this.getSlice(16, 20);
    this.audioFormat = this.getSlice(20, 22);
    this.numChannels = this.getSlice(22, 24);
    this.sampleRate = this.getSlice(24, 28);
    this.byteRate = this.getSlice(28, 32);
    this.blockAlign = this.getSlice(32, 34);
    this.bitsPerSample = this.getSlice(34, 36);
  }

  addData() {
    this.data = this.getSlice(36, 40);
    this.subchunk2Size = this.getSlice(40, 44);
    this.audioData = this.getSlice(44, this.arr.length);
  }

  getSlice(start, end) {
    return this.arr.slice(start + this.offset, end + this.offset);
  }

  printHeader() {
    console.log("Chunk size: " + hexToDec(this.chunkSize));
    console.log("Subchunk1 size: " + hexToDec(this.subchunk1Size));
    console.log("Audio format: " + hexToDec(this.audioFormat));
    console.log("Number of channels: " + hexToDec(this.numChannels));
    console.log("Sample rate: " + hexToDec(this.sampleRate));
    console.log("Byte rate: " + hexToDec(this.byteRate));
    console.log("Block align: " + hexToDec(this.blockAlign));
    console.log("Bits per sample : " + hexToDec(this.bitsPerSample));
  }

  skipJunk(index) {
    var junk = this.arr.slice(index, index+5);
    if (compareArrays(junk, ["4a", "55", "4e", "4b", "1c"])) {
      var res = junk.length;
      for(var i = index + res; i < this.arr.length; i++ && res++) {
        if (this.arr[i] != "00") {
          return res;
        }
      }
    } else {
      return 0;
    }
  }

  checkMetaData() {
    if (!compareArrays(this.riff, ["52", "49", "46", "46"])) {
      throw new Error('RIFF data does not match ' + this.riff.join(' '));
    }
    if (!compareArrays(this.wave, ["57", "41", "56", "45"])) {
      throw new Error('WAVE data does not match ' + this.wave.join(' '));
    }
    if (!compareArrays(this.fmt, ["66", "6d", "74", "20"])) {
      throw new Error('fmt data does not match ' + this.fmt.join(' '));
    }
    if (!compareArrays(this.audioFormat, ["01", "00"])) {
      throw new Error('audio format does not match ' + this.audioFormat.join(' '));
    }
    if (!compareArrays(this.data, ["64", "61", "74", "61"])) {
      throw new Error('data does not match ' + this.data.join(' '));
    }
  }
}

function hexToDec(arr) {
  if (arr.length > 4) {
    throw new Error("Cannot convert number larger than 4 bytes");
  }
  return parseInt(arr.reverse().join(''), 16);
}

function compareArrays(arr1, arr2) {
  if (arr1.length != arr2.length) {
    return false;
  }
  for (var i = 0; i < arr1.length; i++) {
    if (arr1[i].localeCompare(arr2[i]) != 0) {
      return false;
    }
  }
  return true;
}

$(function() {

  document.querySelector('input').addEventListener('change', function() {

    var reader = new FileReader();
    reader.onload = function() {
      var arrayBuffer = this.result,
        hexArray = buf2hex(arrayBuffer),
        decArray = new Uint8Array(arrayBuffer),
        binaryString = String.fromCharCode.apply(null, decArray);
      console.log(binaryString);
      console.log(hexArray);
      var wav = new Wav(hexArray);
      wav.addHeader();
      wav.addData();
      wav.checkMetaData();
      wav.printHeader();
    }
    reader.readAsArrayBuffer(this.files[0]);

  }, false);

});

function buf2hex(buffer) { // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2));
}