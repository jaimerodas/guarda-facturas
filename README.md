# Guarda Facturas
Como soy bien inútil para guardar mis documentos y poder hacer mis declaraciones como el SAT manda, hice esto. Es una aplicación que usa [Postmark](https://postmarkapp.com) y [Dropbox](https://dropbox.com) para almacenar mis CFDI's. Está hecha en NodeJS, porque, ps hay que aprovechar y aprender algo nuevo.

## Cómo funciona
Hay una casilla de correo que da Postmark para poder procesar inbound emails, y es a donde forwardeo los correos que me llegan con CFDI's. Postmark lo procesa, y hace un callback a un server. Esta aplicación espera un POST en `/recibe` y cuando cae algo hace lo siguiente:

1. Revisa que lo que llegó sea válido.
2. Se asegura de que haya attachments en el correo
3. Uno de esos attachments tiene que ser un XML (y que sea un CFDI válido)
4. Leemos el XML y sacamos la fecha de emisión y el RFC del emisor
5. Guardamos el XML y el PDF (si existe) en Dropbox, dentro de una carpeta de app así `/YYYY-MM/TIMESTAMP-RFC.extension`, por ejemplo: `/2016-01/17342342-ROMJ880810CMA.pdf`

Esto me deja ya bien fácil sacar mis facturas del mes para pasárselas al contador.

## Requisitos
- Buscamos un request HTTP POST [igualito a lo que especifica Postmark](http://developer.postmarkapp.com/developer-process-parse.html)
- Un Dropbox Access Token, para el que se deben meter [aquí](https://www.dropbox.com/developers/apps) y hacer su propio app. Chance después mando el mío a producción
- La aplicación busca un archivo `config.json` en el directorio principal con los siguientes parámetros:

```JSON
{
    "dropbox_key": "DROPBOX_ACCESS_TOKEN",
    "port": 80
}
```

y ya!

## Yo qué hice
Yo monté esto en un Droplet de [Digital Ocean](https://www.digitalocean.com) que me cuesta 5 USD al mes, y los primeros 1000 correos que me procese Postmark son gratis, así que sale re barato. Yo uso [PM2](http://pm2.keymetrics.io) para correr mi node en producción, pero no es obligatorio.
