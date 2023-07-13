// WebSocket server
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 7777 });

wss.on('connection', ws => {

  ws.on('message', message => {
    console.log('Received from client: %s', message);
    // from here the message can be save to a database or file
  });

});
