/**
 * Created by zh99998 on 2017/2/23.
 */
import * as url from 'url';
import * as pg from 'pg';
import * as WebSocket from 'ws';
import * as https from 'https';
import * as fs from 'fs';

const https_server = https.createServer({
    key: fs.readFileSync('/etc/letsencrypt/live/mycard.moe/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/mycard.moe/fullchain.pem')
}).listen(3100);

const server = new WebSocket.Server({server: <https.Server>https_server});

// server.on('connection', function connection(ws) {
//
//
//     ws.on('message', function incoming(message) {
//         console.log('received: %s', message);
//     });
//
//     ws.send('something');
// });


async function main() {
    let db = new pg.Client(process.env['DATABASE']);
    db.connect();

    db.on('notification', (message) => {
        for (let client of server.clients) {
            let location = url.parse(client.upgradeReq.url, true);
            if (location.query.user_id === message.payload && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({'channel': message.channel}));
            }
        }
    });

    await db.query("LISTEN belongings");

}
main()

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});
