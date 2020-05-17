class Ppm {
    decArray = [];
    header = {
        "format": "",
        "width": -1,
        "height": -1,
        "max_val": -1,
    };
    pixels = [];
    index = 0;

    constructor(array) {
        this.decArray = array;
        this.extractHeader();
        this.pixels = this.decArray.slice(this.index, this.decArray.length);
        console.log(this.pixels);
    }

    extractHeader() {
        this.header.format = this.getNextWord();
        this.header.width = parseInt(this.getNextWord());
        this.header.height = parseInt(this.getNextWord());
        this.header.max_val = parseInt(this.getNextWord());
        this.checkHeader();
        console.log(this.header);
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
}

$(function () {
    document.querySelector('input').addEventListener('change', function () {

        var reader = new FileReader();
        reader.onload = function () {
            var arrayBuffer = this.result,
                decArray = new Uint8Array(arrayBuffer);
            ppm = new Ppm(decArray);
        };
        reader.readAsArrayBuffer(this.files[0]);

    }, false);
});
