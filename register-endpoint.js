 // this is the report url for the flood
// http://<SHELLY_IP>/script/<script_id>/<endpoint_name>
// <SHELLY_IP> is the IP from the 1PM that will receive the data
// http://192.168.15.121/script/4/floodData


// this code runs in the shelly 1pm at index <script_id> to match the call
// it will receive the data ad PARAM from flood devices

function floodReportSensorValues(req,res){
    console.log(JSON.stringify(req.query))
}
function floodFloodDetected(req,res){
    console.log(JSON.stringify(req.query))
}
function floodFloodGone(req,res){
    console.log(JSON.stringify(req.query))
}

HTTPServer.registerEndpoint('floodData',floodReportSensorValues)
HTTPServer.registerEndpoint('floodDetected',floodFloodDetected)
HTTPServer.registerEndpoint('floodGone',floodFloodGone)

// this code send a message back to the requester
// the caller of this endpoint will receive a BODY as JSON

function floodEndpoint(req,res){
    console.log(JSON.stringify(req.query))
    res.code = 200;
    res.body = 'Hello'
    res.send()
}

HTTPServer.registerEndpoint('floodData',floodEndpoint)
