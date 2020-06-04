const http = require('http');
const fs = require('fs');
const ppm = require('ppm-bin');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const sleep = require('sleep');
const FileReader = require('filereader');
var multer  = require('multer')
var bodyParser = require('body-parser');
let binaryFile = require('binary-file')


const express = require('express');
var cors = require('cors');
var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({credentials: true, origin: 'http://localhost:8000'}));
app.use(bodyParser.json());
const hostname = '127.0.0.1';
const port = 3000;


app.listen(port)
console.log(`Listening at http://localhost:${port}`)

app.listen()

/*
'use strict';
app.post('/', function (req, res) {
    res.send('POST request to the homepage')

    const myBinaryFile = new binaryFile(req.body, 'r');
    myBinaryFile.open().then(function () {
        console.log('File opened');
        return myBinaryFile.readUInt32();
    }).then(function (stringLength) {
        return myBinaryFile.readString(stringLength);
    }).then(function (string) {
        console.log(`File read: ${string}`);
        return myBinaryFile.close();
    }).then(function () {
        console.log('File closed');
    }).catch(function (err) {
        console.log(`There was an error: ${err}`);
    });

})
*/

app.use(function(req, res, next) {
    var data = new Buffer('');
    req.on('data', function(chunk) {
        data = Buffer.concat([data, chunk]);
    });
    req.on('end', function() {
        req.rawBody = data;
    });
    console.log(data);
    outputToFile("salo2.ppm",data);

    let res1 = "images/saloPruebaExpress.png"
    ppm.convert("salo2.ppm", res1, ((err) => {
          if (err) console.log(err);
      }));
});


function outputToFile(filename, blob){
    fs.writeFileSync(filename, blob);
    console.log("blob: "+ blob );
    return true;
}

