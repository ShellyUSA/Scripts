let IP = "192.168.1.157";
let DEBUG_LOG = false;

var WebSocketClient = require('websocket').client;

let commandId = 0;
var createCommandPacket = (method, params) => {
    commandId++;

    let command = {"jsonrpc":"2.0", "id": commandId, "src":"wsclient", "method": method};

    if (params) {
        command['params'] = params;
    }

    return command;
};

let _requests = {};
var sendRequest = async (connection, method, params) => {
    let packet = createCommandPacket(method, params);
    return new Promise((res, rej) => {
        _requests[packet.id] = [res, rej];
        if (DEBUG_LOG) {
            console.debug('->', packet);
        }
        connection.send(JSON.stringify(packet));
    });
};

var client = new WebSocketClient();

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', async function(connection) {
    console.log('\nWebSocket Client Connected \n');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        let packet = JSON.parse(message.utf8Data);

        if (DEBUG_LOG) {
            console.debug('<-', packet);
        }

        if (_requests[packet.id]) {
            _requests[packet.id][0](packet);
            delete _requests[packet.id];
        }
    });

    let status = null;
    // requires at least 1 command to be sent to start receiving data.
    await sendRequest(connection, "shelly.getdeviceinfo");

    // Example: Switch.Getstatus
    status = await sendRequest(connection, "switch.getstatus",
        {
            'id': 0
        });

    console.debug("Got switch status of:", status);

    // Example: Switch.set
    await sendRequest(connection, "switch.set",
        {
            'id': 0,
            'on': true
        });

    status = await sendRequest(connection, "switch.getstatus",
        {
            'id': 0
        });

    console.debug("Turned switch on, `output` should be true now:", status);

    // Example: Switch.set
    await sendRequest(connection, "switch.set",
        {
            'id': 0,
            'on': false
        });

    status = await sendRequest(connection, "switch.getstatus",
        {
            'id': 0
        });

    console.debug("Turned switch off, `output` should be false now:", status);

    // Example: Switch.toggle
    await sendRequest(connection, "switch.toggle",
        {
            'id': 0
        });

    status = await sendRequest(connection, "switch.getstatus",
        {
            'id': 0
        });

    console.debug("Toggled switch, `output` should be the opposite of the one before:", status);


    // Example: Shelly.update - Over The Air Update
    status = await sendRequest(connection, "shelly.update",
        { 
            url: "https://www.dsr7.com/files/fw-signed.zip"
        });
        console.debug(status);
    
    status = await sendRequest(connection, "shelly.getdeviceinfo",
        {
            'id': 0
        });   
        console.debug(status);
    console.debug("Firmware updated, `fw_id` should have the new firmware id:", status);
    
});

console.log("Connecting to:", IP);
client.connect('ws://' + IP + '/rpc');
