const http = require('http');
const fs = require('fs');
const ppm = require('ppm-bin');
const express = require('express');
const cors = require('cors');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const sleep = require('sleep');
const FileReader = require('filereader');
var app = express();

const hostname = '127.0.0.1';
const port = 3000;

/*app.get('/products/:id', cors(), function (req, res, next) {
    res.json({msg: 'This is CORS-enabled for a Single Route'})
});

app.listen(port, function () {
    console.log('CORS-enabled web server listening on port 80')
});*/

async function outputToFile(filename, blob){
    await fs.writeFile(filename, blob, function (err) {
        if (err) return console.log(err);
    });
    return true;
}

const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
        console.log('POST');
        var body = '';
        req.on('data', function(data) {
            body += data;
        });
        req.on('end', function() {
            let inputFile = "/home/axelzucho/Documents/input.ppm";
            //let input2 = "/home/axelzucho/Documents/seeing-sounds/images/stop_1.ppm";
            console.log('Body received');
            outputToFile(inputFile, body).then(result => {
                var res1 = "outputoriginal.png";
                ppm.convert(inputFile, res1, ((err) => {
                    if (err) console.log(err);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/plain');
                    res.setHeader("Access-Control-Allow-Origin", "*");
                    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                    res.end(res1);
                    console.log("ENDED");
                }));
            });
        });
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});