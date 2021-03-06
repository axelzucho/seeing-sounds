let threejsScene = null;

class Intermediate {
  data = [];
  rate = -1;
}

$(function () {
  document.getElementById('audio').addEventListener('change', function () {
    var reader = new FileReader();
    reader.onload = function () {
      var arrayBuffer = this.result,
        decArray = new Uint8Array(arrayBuffer),
        link = document.getElementById("downloadLink"),
        downloadBtn = document.getElementById("download-btn");

      var wav = new Wav;
      wav.fromFile(decArray);

      var interm = wav.toInterm();
      var ppm = new Ppm();
      ppm.fromInterm(interm);

      link.href = ppm.toFile("image.ppm");
      link.download = "image.ppm";
      downloadBtn.style.display = 'block';
      link.style.display = 'block';

      if(threejsScene !== null){
        threejsScene.stop();
      }

      threejsScene = new ThreeJs(wav, ppm, interm);
    };
    reader.readAsArrayBuffer(this.files[0]);

  }, false);

  document.querySelector('#image').addEventListener('change', function () {
    let reader = new FileReader();
    reader.onload = function () {
      let arrayBuffer = this.result,
        decArray = new Uint8Array(arrayBuffer),
        link = document.getElementById("downloadLink"),
          downloadBtn = document.getElementById("download-btn");

      let ppm = new Ppm();
      ppm.fromFile(decArray);
      let interm = ppm.toInterm();
      let wav = new Wav();
      wav.fromInterm(interm);

      link.href = wav.toFile("audio.wav");
      link.download = "audio.wav";
      link.style.display = 'block';
      downloadBtn.style.display = 'block';

      if(threejsScene !== null){
        threejsScene.stop();
      }

      threejsScene = new ThreeJs(wav, ppm, interm);
    };
    console.log(this.files[0]);
    reader.readAsArrayBuffer(this.files[0]);

  }, false);

});

