var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

var config = require('./config.json');

app.set('port', (config.port || 5000));

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

app.use(bodyParser.json());

app.post('/recibe', function (req, res) {
    fecha = new Date(req.body.Date);
    mes = fecha.getMonth() + 1;

    if (mes.toString().length == 1) {
        mes = '0' + mes;
    }

    folder = '/' + fecha.getFullYear() + '-' + mes;

    // Creamos el folder
    crearFolder(folder);

    res.status(200).end();
});

app.listen(app.get('port'), function () {
    console.log('Iniciando en puerto ' + app.get('port'));
});
