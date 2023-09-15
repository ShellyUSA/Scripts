// let shellyData = {"deviceTime":'000',"equipTime":'000'};

// function getTime(req, res){
//   Shelly.call(
//       "Shelly.GetStatus", 
//       { }, 
//       function (response, error_code, error_msg){
//           //print(response.sys.uptime)
//           print(response["switch:0"])
          
//           shellyData = {
//               "deviceTime":JSON.stringify(response.sys.uptime),
//               "equipmTime":JSON.stringify(response["switch:0"].aenergy.minute_ts)
//           };
          
//           if(error_code !== 0){
//               print(JSON.stringify(response));
//               print(JSON.stringify(error_code));
//               print(JSON.stringify(error_msg));
//           } else {
//             res.code = 200;
//             res.body = JSON.stringify(shellyData);
//           }
//           res.send()
//       },
//       null
//   );
// }

// HTTPServer.registerEndpoint('hourmeter',getTime)

let shellyData = {"deviceTime":'000',"equipTime":'000'};
let startTime = 0;
let stopTime = 0;
let URL_RECEIVING_DATA = '192.168.15.123' // ip or address endpoint that will receive the data

function getTime(req, res){
  Shelly.call(
      "Shelly.GetStatus", 
      { }, 
      function (response, error_code, error_msg){
          //print(response.sys.uptime)
          print(response["switch:0"])
          if(startTime === 0 && response["switch:0"].output){
              startTime = response["switch:0"].minute_ts
          }
          if(startTime !== 0 && !response["switch:0"].output){
              stopTime = response.sys.uptime
          }
          
          shellyData = {
              "startTime":JSON.stringify(startTime),
              "stopTime":JSON.stringify(stopTime)
          };
          
          if(error_code !== 0){
              print(JSON.stringify(response));
              print(JSON.stringify(error_code));
              print(JSON.stringify(error_msg));
          } else {
            res.code = 200;
            res.body = JSON.stringify(shellyData);
          }
          if(stopTime !== 0){
            res.send();
            sendData()
          } else
            print(startTime);
      },
      null
  );
}



function sendData (){
  
    let TARGET_URI = "http://"+URL_RECEIVING_DATA;
    
    print(TARGET_URI);
    Shelly.call(
        "HTTP.REQUEST", 
        { 
            method: "POST",
            url: TARGET_URI,
            body: {
                shellyData
            },
        },
        function (res, error_code, error_msg, self){
          if(error_code !== 0){
            print(JSON.stringify(res));
            print(JSON.stringify(error_code));
            print(JSON.stringify(error_msg));
          }
        }, 
        this
      );
  }


// create a timer to send the result to an endpoint every minute.
const waitForXSeconds = 60;

function timerCode() {
    getTime()
};

timerCode()
Timer.set(1000 * waitForXSeconds, true, timerCode);


HTTPServer.registerEndpoint('hourmeter',getTime)