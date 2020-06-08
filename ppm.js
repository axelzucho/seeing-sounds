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
        this.header.width = -1;
        this.header.height = -1;
        this.header.max_val = 255;
        this.data = interm.data;
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
            var result = this.getIntFromRGB(slice[i], slice[i + 1], slice[i + 2]);
            this.data.push(result);
        }
    }

    getIntFromRGB(r, g, b) {
        return (b << 16 | g << 8 | r);
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

    getChunkIndex(i, width, height, chunkWidth, chunkHeight) {
        let col = Math.floor((i % width) / chunkWidth);
        let maxChunk = Math.floor(width / chunkWidth);
        if (col >= maxChunk) {
            return -1;
        }
        let row = Math.floor(i / (chunkHeight * height));
        if (row >= maxChunk) {
            return -1;
        }
        row = row * Math.floor(width / chunkHeight);
        return col + row;
    }

    getPixel(x, y) {
        let index = x * 3 + (y * this.header.width * 3);
        return [this.decArray[index], this.decArray[index+1], this.decArray[index+2]];
    }

    chunkify(newWidth, newHeight) {
        const chunkWidth = Math.floor(this.header.width / newWidth);
        const chunkHeight = Math.floor(this.header.height / newHeight);
        // const width = Math.sqrt(this.data.length);
        const chunkSize = chunkWidth * chunkHeight;
        const newLength = Math.floor(this.data.length / chunkSize);
        let newData = Array(newLength).fill().map(() => Array(3).fill(0));
        for (let i = 0; i < this.data.length; i++) {
            let index = this.getChunkIndex(i, this.header.width, this.header.height, chunkWidth, chunkHeight);
            if (index == -1) { continue; } // Overflow
            let rgb = this.getRGBFromInt(this.data[i]);
            if (index >= newData.length) {
                continue;
            }
            rgb = Uint8Array.from(rgb);
            newData[index][0] += rgb[0] / chunkSize; // R
            newData[index][1] += rgb[1] / chunkSize; // G
            newData[index][2] += rgb[2] / chunkSize; // B
        }
        let res = newData.map(pix => this.getIntFromRGB(pix[0], pix[1], pix[2]));

        // Create new ppm object from result
        let newppm = new Ppm();
        newppm.data = res;
        newppm.decArray = newppm.separateRGB();
        newppm.header.format = "P6";
        newppm.header.width = Math.floor(this.header.width / chunkWidth);
        newppm.header.height = Math.floor(this.header.height / chunkWidth);
        newppm.header.max_val = 255;

        return newppm;
    }

    toLines(data) {
        let newData = [];
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data.length; j++) {
                newData.push(data[i]);
            }
        }
        return newData;
    }

    toInterm() {
        var interm = new Intermediate();
        let rate = 32000;
        interm.data = this.data;
        interm.rate = rate;
        return interm;
    }

    toBlob() {
        var arrayData = this.separateRGB();
        var desiredRatio = arrayData.length;
        if (this.header.width == -1) {
            this.header.width = Math.floor(Math.sqrt(desiredRatio / 3));
        }
        if (this.header.height == -1) {
            this.header.height = Math.floor(Math.sqrt(desiredRatio / 3));
        }
        var outputHeader = StringToArrayBuffer(this.getOutputHeader());
        if(arrayData.length !== desiredRatio) {
            arrayData = this.adjustRatio(arrayData, desiredRatio);
        }

        return new Blob([outputHeader, arrayData]);
    }

    toFile(filepath) {
        let blob = this.toBlob();
        if (filepath !== null) {
            window.URL.revokeObjectURL(filepath);
        }

        filepath = window.URL.createObjectURL(blob);

        return filepath;
    }

}
