var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var parseString = require('xml2js').parseString;

var app = express();

var path,
save = [],
config = require('./config.json');

function definePath(fecha, rfc) {
    var mes = fecha.getMonth() + 1;
    if (mes.toString().length == 1) {
        mes = "0" + mes;
    }
    return '/' + fecha.getFullYear() + '-' + mes + '/' + Math.round(fecha.getTime()/1000, 0) + '-' + rfc + '.';
}

function createFile(file, index, array) {
    request({
        method: 'POST',
        uri: 'https://content.dropboxapi.com/2/files/upload',
        headers: {
            'Authorization': 'Bearer ' + config.dropbox_key,
            'Dropbox-API-Arg': JSON.stringify({
                path: path + file.extension,
                autorename: true
            }),
            'Content-type': 'application/octet-stream'
        },
        body: file.bin
    }, function (e, r, b) {
        if (e) {
            console.log(e,b);
        } else {
            b = JSON.parse(b);
            console.log("Creamos el archivo: " + b.path_display);
        }
    });
}

function processFile(content, extension) {
    var file, text;

    file = new Buffer(content, 'base64');
    text = file.toString();

    save.push({
        extension: extension,
        bin: file
    });

    if (extension == 'xml') {
        parseString(text, function (err, result) {
            var fecha, rfc;

            fecha = new Date(result['cfdi:Comprobante'].$.fecha);
            rfc = result['cfdi:Comprobante']['cfdi:Emisor'][0].$.rfc;
            path = definePath(fecha, rfc);

            console.log("Encontré el RFC: " + rfc);
        });
    }
}

function getExtension(ct) {
    switch (ct) {
        case 'text/xml':
        case 'application/xml':
            return 'xml';
        case 'application/pdf':
            return 'pdf';
        default:
            return false;
    }
}

app.set('port', (config.port || 5000));

app.use(bodyParser.json({limit: '10mb'}));

app.post('/recibe', function (req, res) {
    console.log("Recibimos nuevo correo");

    if (req.body.Attachments.length > 0) {
        console.log("El correo tiene archivos adjuntos");

        req.body.Attachments.forEach(function(att){
            console.log("Hay un: " + att.ContentType);
            var ext = getExtension(att.ContentType);
            if (ext) {
                processFile(att.Content, ext);
            }
        });

        if (path) {
            save.forEach(createFile);
        } else {
            console.log("No pudimos parsear ningún xml");
            console.log(req.body.Attachments);
        }
    }

    res.status(200).end();
});

app.listen(app.get('port'), function () {
    console.log('Iniciando en puerto ' + app.get('port'));
});
