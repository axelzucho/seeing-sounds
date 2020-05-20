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
      var ppm = new Ppm();
      ppm.fromInterm(interm);

      link.href = ppm.toFile("image.ppm");
      link.download = "image.ppm";
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
      // var wav= new Wav();
      // wav.fromInterm(interm);

      // link.href = wav.toFile("audio.wav");
      // link.download = "audio.wav";
      var ppm2 = new Ppm();
      ppm2.fromInterm(interm);

      link.href = ppm2.toFile("image.ppm");
      link.download = "image.ppm";
      link.style.display = 'block';
      link.style.display = 'block';
    };
    reader.readAsArrayBuffer(this.files[0]);

  }, false);

});

