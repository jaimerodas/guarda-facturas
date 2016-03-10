var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

app.set('port', (process.env.PORT || 5000));

var crearFolder = function (folder) {
    request({
        method: 'POST',
        uri: 'https://api.dropboxapi.com/2/files/create_folder',
        headers: {
            'Authorization': 'Bearer ' + process.env.GITHUB,
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
