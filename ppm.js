class Ppm {
    decArray = [];
    header = {
        "format": "",
        "width": -1,
        "height": -1,
        "max_val": -1,
    };
    data = [];
    index = 0;

    constructor(array) {
        this.decArray = array;
        this.extractHeader();
        this.toIntArray(this.decArray.slice(this.index, this.decArray.length));
    }

    extractHeader() {
        this.header.format = this.getNextWord();
        this.header.width = parseInt(this.getNextWord());
        this.header.height = parseInt(this.getNextWord());
        this.header.max_val = parseInt(this.getNextWord());
        this.checkHeader();
    }

    checkHeader() {
        if (this.header.format !== "P6") {
            throw "Not in PPM format; should be P6, but it is: " + this.header.format;
        }
        if (this.header.width <= 0 || this.header.height <= 0) {
            throw "Expected positive dimentions, but got: " + this.header.width.toString() +
                " x " + this.header.height.toString();
        }
        if (this.header.max_val <= 0){
            throw "Expected positive maximum value for pixels, instead got: " + this.header.max_val;
        }
    }

    getStringSlice(length) {
        var slice = this.decArray.slice(this.index, this.index + length);
        this.index += length;
        return String.fromCharCode.apply(null, slice);
    }

    getNextWord() {
        var result = "";
        var singleChar = "";
        do {
            singleChar = this.getStringSlice(1);
            result += singleChar;
        } while (singleChar !== " " && singleChar !== "\n");
        // Getting rid of the last character.
        result = result.substr(0, result.length - 1);
        return result;
    }

    toIntArray(slice) {
        for(var i = 0; i < slice.length - 2; i+=3){
            var result = (slice[i+2] << 16 | slice[i+1] << 8 | slice[i]);
            this.data.push(result);
        }
    }

    getRGBFromInt(pix) {
        var result = [];
        var base = 255;
        result.push(pix & base);
        result.push((pix & (base << 8)) >> 8);
        result.push((pix & (base << 16)) >> 16);
        return result;
    }

    separateRGB() {
        var rgb = [];

        for(var i = 0; i < this.data.length; i++){
            var vals = this.getRGBFromInt(this.data[i]);
            rgb.push(vals[0], vals[1], vals[2]);
        }
        rgb = Uint8Array.from(rgb);
        return rgb;
    }

    getOutputHeader(){
        var result = "";
        result += this.header.format;
        result += "\n";
        result += this.header.width.toString();
        result += " ";
        result += this.header.height.toString();
        result += "\n";
        result += this.header.max_val;
        result += "\n";

        return result;
    }

    outputToURL(filepath) {
        var outputHeader = StringToArrayBuffer(this.getOutputHeader());
        var arrayData = this.separateRGB();

        var data = new Blob([outputHeader, arrayData]);

        if (filepath !== null) {
            window.URL.revokeObjectURL(filepath);
        }

        filepath = window.URL.createObjectURL(data);

        return filepath;
    }
}

$(function () {
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
