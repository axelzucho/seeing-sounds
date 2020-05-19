class Intermediate {
  data = [];
  rate = -1;
}

$(function () {
  document.querySelector('#audio').addEventListener('change', function () {
    var reader = new FileReader();
    reader.onload = function () {
      var arrayBuffer = this.result,
        decArray = new Uint8Array(arrayBuffer),
        link = document.getElementById("downloadLink");

      var wav = new Wav;
      wav.fromFile(decArray);

      var interm = wav.toInterm();
      var wav2 = new Wav;
      wav2.fromInterm(interm);

      link.href = wav2.toFile("audio.wav");
      link.download = "audio.wav";
      link.style.display = 'block';
    }
    reader.readAsArrayBuffer(this.files[0]);

  }, false);

  document.querySelector('#image').addEventListener('change', function () {
    var reader = new FileReader();
    reader.onload = function () {
      var arrayBuffer = this.result,
        decArray = new Uint8Array(arrayBuffer),
        ppm = new Ppm(decArray),
        link = document.getElementById("downloadLink");

      ppm.rawbytes = this.result;
      link.href = ppm.outputToURL("image.ppm");
      link.download = "image.ppm";
      link.style.display = 'block';
    };
    reader.readAsArrayBuffer(this.files[0]);

  }, false);

});

