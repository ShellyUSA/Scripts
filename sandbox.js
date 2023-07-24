let arr = ["192.168.0.176","192.168.0.155","192.168.0.133"];
let timer_handle = null;

//turn lamp on
function turnOn(){
    Timer.clear(timer_handle);
    for(let i=0; i < arr.length; i++){
        print(arr[i]);
        Shelly.call(
          "HTTP.GET", 
          { url: "http://"+arr[i]+"/rpc/Switch.Set?id=0&on=true" }, 
          function (res, error_code, error_msg, ud){
            if(error_code !== 0){
              print(arr[i]);
              print(JSON.stringify(res));
              print(JSON.stringify(error_code));
              print(JSON.stringify(error_msg));
            }
          }, 
          null
        );
    }
    print("Auto-stop script in 5 seconds");
    timer_handle = Timer.set(5000,false,function stopScript(){Shelly.call("Script.Stop",{"id":1})},null);
    print('End of script');
}
print("Start script");
turnOn();



let arr = ["192.168.0.176","192.168.0.155","192.168.0.133"];
let timer_handle = null;

function turnOff(){
    Timer.clear(timer_handle);
    for(let i=0; i < arr.length; i++){
        print(arr[i]);
        Shelly.call(
          "HTTP.GET", 
          { url: "http://"+arr[i]+"/rpc/Switch.Set?id=0&on=false" }, 
          function (res, error_code, error_msg, ud){
            if(error_code !== 0){
              print(arr[i]);
              print(JSON.stringify(res));
              print(JSON.stringify(error_code));
              print(JSON.stringify(error_msg));
            }
          }, 
          null
        );
    }
    print("Auto-stop script in 5 seconds");
    timer_handle = Timer.set(5000,false,function stopScript(){Shelly.call("Script.Stop",{"id":2})},null);
    print('End of script');
}
print("Start script");
turnOff();


////// CALL 4 EACH TIME 
// WE CAN'T HANDLE MORE THAN 5 CALLS AT SAME TIME
// WE NEED TO WAIT THE RETURN SO THE CALL ENDS

let arr = ["192.168.20.184","192.168.20.9","192.168.20.140","192.168.20.89","192.168.20.114","192.168.20.55","192.168.20.27","192.168.20.200","192.168.20.25","192.168.20.208","192.168.20.194","192.168.20.242","192.168.20.21","192.168.20.37","192.168.20.68","192.168.20.81","192.168.20.120","192.168.20.218","192.168.20.193","192.168.20.135","192.168.20.141","192.168.20.143","192.168.20.197","192.168.20.220","192.168.20.131","192.168.20.164","192.168.20.138","192.168.20.29","192.168.20.88","192.168.20.132","192.168.20.136","192.168.20.201","192.168.20.24","192.168.20.26","192.168.20.57","192.168.20.102","192.168.20.152","192.168.20.28","192.168.20.23","192.168.20.186","192.168.20.63","192.168.20.137","192.168.20.145","192.168.20.167","192.168.20.245","192.168.20.133","192.168.20.8","192.168.20.44"];
let timer_handle, timer_rpc = null;
let delay = 30000;
Timer.clear(timer_handle, timer_rpc);

//turn lamp on
function turnOn(ip){
  print("Calling ip: "+ip);
  Shelly.call(
    "HTTP.GET", 
    { url: "http://"+ip+"/settings/light/0?brightness=15" }, 
    function (res, error_code, error_msg, ip){
      if(error_code !== 0){
        print(ip);
        print(JSON.stringify(res));
        print(JSON.stringify(error_code));
        print(JSON.stringify(error_msg));
      } else {
        print('Command executed for ip: '+ip);
      }
    }, 
    null
  );
}

function loopArr(){
  print(arr.length);
  if (arr.length > 4){
    for(let i=0; i < 4; i++){
      turnOn(arr[i]);
    }
    arr.splice(0,4);
  } else {
    for(let i=0; i < arr.length; i++){
      turnOn(arr[i]);
    }
    arr.splice(0,arr.length);    
  }
}
  if (arr.length < 1) {
    Timer.clear(timer_rpc);
    print("Auto-stop script in 5 seconds");
    timer_handle = Timer.set(5000,false,function stopScript(){Shelly.call("Script.Stop",{"id":1})},null);
    print('End of script');
  }


timer_rpc = Timer.set(delay,true,loopArr,null);



