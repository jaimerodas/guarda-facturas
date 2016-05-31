var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var parseString = require('xml2js').parseString;

var path,
    app = express(),
    save = [],
    config = require('./config.json');

function createFile(f) {
    request({
        method: 'POST',
        uri: 'https://content.dropboxapi.com/2/files/upload',
        headers: {
            'Authorization': 'Bearer ' + config.dropbox_key,
            'Dropbox-API-Arg': JSON.stringify({
                path: path + f.ext,
                autorename: true
            }),
            'Content-type': 'application/octet-stream'
        },
        body: f.bin
    }, function (e, r, b) {
        if (e) {
            console.log(e, b);
        } else {
            console.log("Creamos el archivo: " + JSON.parse(b).path_display);
        }
    });
}

function processXML(f) {
    parseString(f.toString(), function (e, r) {
        var fecha = new Date(r['cfdi:Comprobante'].$.fecha),
            rfc = r['cfdi:Comprobante']['cfdi:Emisor'][0].$.rfc;

        if (!rfc || !fecha) {
            return false;
        }

        var mes = fecha.getMonth() + 1;

        if (mes.toString().length == 1) {
            mes = "0" + mes;
        }

        path = '/' + fecha.getFullYear() + '-' + mes + '/' + Math.round(fecha.getTime()/1000, 0) + '-' + rfc + '.';
    });
}

function processFile(f) {
    var ext,
        file = new Buffer(f.Content, 'base64');

    switch (f.ContentType) {
        case 'text/xml':
        case 'application/xml':
            processXML(file);
            ext = 'xml';
            break;
        case 'application/pdf':
            ext = 'pdf';
            break;
        default:
            return false;
    }

    save.push({ext: ext, bin: file});
}

app.set('port', (config.port || 5000));

app.use(bodyParser.json({limit: '10mb'}));

app.post('/recibe', function (req, res) {
    console.log("Recibimos nuevo correo");

    if (req.body.Attachments.length > 0) {
        console.log("El correo tiene archivos adjuntos");

        req.body.Attachments.forEach(processFile);

        if (path) {
            save.forEach(createFile);
        } else {
            console.log("No pudimos parsear xmls", req.body.Attachments);
        }
    }

    // Garbage collecteamos para que al siguiente correo no se cague todo
    path = false;
    save = [];
    res.status(200).end();
});

app.listen(app.get('port'), function () {
    console.log('Iniciando en puerto ' + app.get('port'));
});
