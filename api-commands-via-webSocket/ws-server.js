import WebSocket, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 7011 });

// wss.on('connection', function connection(ws) {
//   ws.on('message', function message(data) {
//     console.log('received: %s', data);
//   });

//   ws.send('something');
// });


wss.on('connection', function connection(ws,req) {
  ws.on('message', function message(data, isBinary) {
    wss.clients.forEach(function each(client) {
        console.log(client)
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });
  });
});

wss.on('connection', function connection(ws, req) {
    const ip = req.socket.remoteAddress;
  });