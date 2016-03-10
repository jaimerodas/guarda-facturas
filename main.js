var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var parseString = require('xml2js').parseString;

var app = express();

var config = require('./config.json');

app.set('port', (config.port || 5000));

var defineFolder = function(date) {
    var mes = date.getMonth() + 1;
    mes = mes[1] ? mes : '0' + mes;
    return '/' + date.getFullYear() + '-' + mes;
};

var definePath = function(date, rfc, extension, folder) {
    return folder + '/' + Math.round(date.getTime()/1000, 0) + '-' + rfc + '.' + extension;
};

var crearFolder = function (folder) {
    request({
        method: 'POST',
        uri: 'https://api.dropboxapi.com/2/files/create_folder',
        headers: {
            'Authorization': 'Bearer ' + config.github_key,
            'Content-type': 'application/json'
        },
        body: JSON.stringify({path: folder})
    }, function (e, r, b) {
        console.log(b);
    });
};

var crearArchivo = function (bin, path) {
    request({
        method: 'POST',
        uri: 'https://content.dropboxapi.com/2/files/upload',
        headers: {
            'Authorization': 'Bearer ' + config.github_key,
            'Dropbox-API-Arg': JSON.stringify({
                path: path,
                autorename: true
            }),
            'Content-type': 'application/octet-stream'
        },
        body: bin
    }, function (e, r, b) {
        console.log(b);
    });
};

app.use(bodyParser.json({limit: '10mb'}));

app.post('/recibe', function (req, res) {
    // console.log(req.body);

    if (req.body.Attachments.length > 0) {
        var fecha, rfc, folder,
        save = [];

        req.body.Attachments.forEach(function(att){
            var file, text;

            if (att.ContentType == 'text/xml') {
                file = new Buffer(att.Content, 'base64');
                text = file.toString();

                save.push({
                    extension: 'xml',
                    bin: file
                });

                parseString(text, function (err, result) {
                    fecha = new Date(result['cfdi:Comprobante'].$.fecha);
                    rfc = result['cfdi:Comprobante']['cfdi:Emisor'][0].$.rfc;
                });
            }

            if (att.ContentType == 'application/pdf') {
                file = new Buffer(att.Content, 'base64');

                save.push({
                    extension: 'pdf',
                    bin: file
                });
            }
        });

        if (fecha && rfc) {
            folder = defineFolder(fecha);
            crearFolder(folder);

            save.forEach(function(a){
                var path = definePath(fecha, rfc, a.extension, folder);
                crearArchivo(a.bin, path);
            });
        }
    }

    res.status(200).end();
});

app.listen(app.get('port'), function () {
    console.log('Iniciando en puerto ' + app.get('port'));
});
