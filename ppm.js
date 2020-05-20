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

    fromFile(array) {
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

    fromInterm(interm) {
        this.header.format = "P6";
        this.header.width = 100;
        this.header.height = 100;
        this.header.max_val = 255;
        this.data = interm.data;
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
        if (this.header.max_val <= 0) {
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
        for (var i = 0; i < slice.length - 2; i += 3) {
            var result = (slice[i + 2] << 16 | slice[i + 1] << 8 | slice[i]);
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

        for (var i = 0; i < this.data.length; i++) {
            var vals = this.getRGBFromInt(this.data[i]);
            rgb.push(vals[0], vals[1], vals[2]);
        }
        rgb = Uint8Array.from(rgb);
        return rgb;
    }

    getOutputHeader() {
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

    adjustRatio (pixelData, desiredLength) {
        var newPixelData = new Uint8Array(desiredLength);

        for(let i = 0; i < pixelData.length; i++) {
            if(i === desiredLength) break;
            newPixelData[i] = pixelData[i];
        }

        for(let i = pixelData.length; i < desiredLength; i++) {
            newPixelData[i] = 0;
        }

        return newPixelData;
    }

    toInterm() {
        var interm = new Intermediate();
        interm.data = this.data;
        interm.rate = 32000;
        return interm;
    }

    toFile(filepath) {
        var arrayData = this.separateRGB();
        var desiredRatio = arrayData.length;
        this.header.width = Math.floor(Math.sqrt(desiredRatio / 3));
        this.header.height = Math.floor(Math.sqrt(desiredRatio / 3));
        var outputHeader = StringToArrayBuffer(this.getOutputHeader());
        if(arrayData.length !== desiredRatio) {
            arrayData = this.adjustRatio(arrayData, desiredRatio);
        }

        var data = new Blob([outputHeader, arrayData]);

        if (filepath !== null) {
            window.URL.revokeObjectURL(filepath);
        }

        filepath = window.URL.createObjectURL(data);

        return filepath;
    }
}