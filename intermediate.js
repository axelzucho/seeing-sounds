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
        link = document.getElementById("downloadLink");

      var ppm = new Ppm();
      ppm.fromFile(decArray);
      var interm = ppm.toInterm();
      var ppm2 = new Ppm();
      ppm2.fromIntermediate(interm, ppm.header.width, 1000);

      link.href = ppm2.toFile("image.ppm");
      link.download = "image.ppm";
      link.style.display = 'block';
    };
    reader.readAsArrayBuffer(this.files[0]);

  }, false);

});

