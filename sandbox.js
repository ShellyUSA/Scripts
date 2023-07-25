// copy and paste this code into the BLE_Gateway device
// the array is the target device where its own script will run
// action1/2/3/4 are the corresponding scripts in the target

// Example: 
// When press button 1x the code will call action1 and run the script 1 in each device in the array

// This code requires that each device have the same script in the same position
// This code requires that each script stops itself after execution. 
// Paste the code bellow at the end of the script. Change the ID for the specific script index.

// let timer_handle = null;
// Timer.clear(timer_handle);
// timer_handle = Timer.set(5000,false,function stopScript(){Shelly.call("Script.Stop",{"id":1})},null);




let array = ["192.168.20.184","192.168.20.9","192.168.20.140","192.168.20.89","192.168.20.114","192.168.20.55","192.168.20.27","192.168.20.200","192.168.20.25","192.168.20.208","192.168.20.194","192.168.20.242","192.168.20.21","192.168.20.37","192.168.20.68","192.168.20.81","192.168.20.120","192.168.20.218","192.168.20.193","192.168.20.135","192.168.20.141","192.168.20.143","192.168.20.197","192.168.20.220","192.168.20.131","192.168.20.164","192.168.20.138","192.168.20.29","192.168.20.88","192.168.20.132","192.168.20.136","192.168.20.201","192.168.20.24","192.168.20.26","192.168.20.57","192.168.20.102","192.168.20.152","192.168.20.28","192.168.20.23","192.168.20.186","192.168.20.63","192.168.20.137","192.168.20.145","192.168.20.167","192.168.20.245","192.168.20.133","192.168.20.8","192.168.20.44"];

// to run scripts that are in another device: In the CONFIG section, comment the line action: executeInsideAction 

// to run scripts that are in the same device: In the CONFIG section, comment the line action: executeOutsideAction and the variables bellow

let outsideAction1 = "/rpc/Script.Start?id=1";
let outsideAction2 = "/rpc/Script.Start?id=2";
let outsideAction3 = "/rpc/Script.Start?id=3";
let outsideAction4 = "/rpc/Script.Start?id=4";



let timer_handle = null;
let index = 0;
Timer.clear(timer_handle);

function executeOutsideAction(action){
  print("Calling ip: "+array[index]);
  Shelly.call(
    "HTTP.GET", 
    { url: "http://" + array[index] + action }, 
    function (res, error_code, error_msg, self){
      print(index,array.length);
      if(error_code !== 0){
        print(JSON.stringify(res));
        print(JSON.stringify(error_code));
        print(JSON.stringify(error_msg));
      } else {
        print('Command executed for ip: '+array[index]);
      }
      if (index < array.length) {
        index++;
        turnOn();   // recursive call
      } else {
        print("Auto-stop script in 5 seconds");
        timer_handle = Timer.set(5000,false,function stopScript(){Shelly.call("Script.Stop",{"id":1})},null);
        print('End of script');      
      }
    }, 
    this
  );
}

function executeInsideAction(action){
  print("Calling ip: "+array[index]);
  Shelly.call(
    ("Script.Start",{"id":action})
  );
}


let CONFIG = {
// shelly_blu_name_prefix: "SBBT",
// shelly_blu_address: "bc:02:6e:c3:c8:b9",
    actions: [
        {
            cond: {
                // addr: shelly_blu_address,
                Button: 1,
            },
            action: executeOutsideAction(outsideAction1),
            action: executeInsideAction(1),
        },
        {
            cond: {
            // addr: shelly_blu_address,
            Button: 2,
            },
            action: executeOutsideAction(outsideAction2),
            action: executeInsideAction(2),
        },
        {
            cond: {
            // addr: shelly_blu_address,
            Button: 3,
            },
            action: executeOutsideAction(outsideAction3),
            action: executeInsideAction(3),
        },
        {
            cond: {
            // addr: shelly_blu_address,
            Button: 4,
            },
            action: executeOutsideAction(outsideAction4),
            action: executeInsideAction(4),
        },    
    ],
};

// END OF CHANGE
  
  let ALLTERCO_MFD_ID_STR = "0ba9";
  let BTHOME_SVC_ID_STR = "fcd2";
  
  let SCAN_DURATION = BLE.Scanner.INFINITE_SCAN;
  let ACTIVE_SCAN =
    typeof CONFIG.shelly_blu_name_prefix !== "undefined" &&
    CONFIG.shelly_blu_name_prefix !== null;
  
  let uint8 = 0;
  let int8 = 1;
  let uint16 = 2;
  let int16 = 3;
  let uint24 = 4;
  let int24 = 5;
  
  function getByteSize(type) {
    if (type === uint8 || type === int8) return 1;
    if (type === uint16 || type === int16) return 2;
    if (type === uint24 || type === int24) return 3;
    //impossible as advertisements are much smaller;
    return 255;
  }
  
  let BTH = [];
  BTH[0x00] = { n: "pid", t: uint8 };
  BTH[0x01] = { n: "Battery", t: uint8, u: "%" };
  BTH[0x05] = { n: "Illuminance", t: uint24, f: 0.01 };
  BTH[0x1a] = { n: "Door", t: uint8 };
  BTH[0x20] = { n: "Moisture", t: uint8 };
  BTH[0x2d] = { n: "Window", t: uint8 };
  BTH[0x3a] = { n: "Button", t: uint8 };
  BTH[0x3f] = { n: "Rotation", t: int16, f: 0.1 };
  
  let BTHomeDecoder = {
    utoi: function (num, bitsz) {
      let mask = 1 << (bitsz - 1);
      return num & mask ? num - (1 << bitsz) : num;
    },
    getUInt8: function (buffer) {
      return buffer.at(0);
    },
    getInt8: function (buffer) {
      return this.utoi(this.getUInt8(buffer), 8);
    },
    getUInt16LE: function (buffer) {
      return 0xffff & ((buffer.at(1) << 8) | buffer.at(0));
    },
    getInt16LE: function (buffer) {
      return this.utoi(this.getUInt16LE(buffer), 16);
    },
    getUInt24LE: function (buffer) {
      return (
        0x00ffffff & ((buffer.at(2) << 16) | (buffer.at(1) << 8) | buffer.at(0))
      );
    },
    getInt24LE: function (buffer) {
      return this.utoi(this.getUInt24LE(buffer), 24);
    },
    getBufValue: function (type, buffer) {
      if (buffer.length < getByteSize(type)) return null;
      let res = null;
      if (type === uint8) res = this.getUInt8(buffer);
      if (type === int8) res = this.getInt8(buffer);
      if (type === uint16) res = this.getUInt16LE(buffer);
      if (type === int16) res = this.getInt16LE(buffer);
      if (type === uint24) res = this.getUInt24LE(buffer);
      if (type === int24) res = this.getInt24LE(buffer);
      return res;
    },
    unpack: function (buffer) {
      // beacons might not provide BTH service data
      if (typeof buffer !== "string" || buffer.length === 0) return null;
      let result = {};
      let _dib = buffer.at(0);
      result["encryption"] = _dib & 0x1 ? true : false;
      result["BTHome_version"] = _dib >> 5;
      if (result["BTHome_version"] !== 2) return null;
      //Can not handle encrypted data
      if (result["encryption"]) return result;
      buffer = buffer.slice(1);
  
      let _bth;
      let _value;
      while (buffer.length > 0) {
        _bth = BTH[buffer.at(0)];
        if (typeof _bth === "undefined") {
          console.log("BTH: unknown type");
          break;
        }
        buffer = buffer.slice(1);
        _value = this.getBufValue(_bth.t, buffer);
        if (_value === null) break;
        if (typeof _bth.f !== "undefined") _value = _value * _bth.f;
        result[_bth.n] = _value;
        buffer = buffer.slice(getByteSize(_bth.t));
      }
      return result;
    },
  };
  
  let ShellyBLUParser = {
    getData: function (res) {
      let result = BTHomeDecoder.unpack(res.service_data[BTHOME_SVC_ID_STR]);
      result.addr = res.addr;
      result.rssi = res.rssi;
      return result;
    },
  };
  
  let last_packet_id = 0x100;
  function scanCB(ev, res) {
    if (ev !== BLE.Scanner.SCAN_RESULT) return;
    // skip if there is no service_data member
    if (
      typeof res.service_data === "undefined" ||
      typeof res.service_data[BTHOME_SVC_ID_STR] === "undefined"
    )
      return;
    // skip if we are looking for name match but don't have active scan as we don't have name
    if (
      typeof CONFIG.shelly_blu_name_prefix !== "undefined" &&
      (typeof res.local_name === "undefined" ||
        res.local_name.indexOf(CONFIG.shelly_blu_name_prefix) !== 0)
    )
      return;
    // skip if we don't have address match
    if (
      typeof CONFIG.shelly_blu_address !== "undefined" &&
      CONFIG.shelly_blu_address !== res.addr
    )
      return;
    let BTHparsed = ShellyBLUParser.getData(res);
    // skip if parsing failed
    if (BTHparsed === null) {
      console.log("Failed to parse BTH data");
      return;
    }
    // skip, we are deduping results
    if (last_packet_id === BTHparsed.pid) return;
    last_packet_id = BTHparsed.pid;
    console.log("Shelly BTH packet: ", JSON.stringify(BTHparsed));
    // execute actions from CONFIG
    let aIdx = null;
    for (aIdx in CONFIG.actions) {
      // skip if no condition defined
      if (typeof CONFIG.actions[aIdx]["cond"] === "undefined") continue;
      let cond = CONFIG.actions[aIdx]["cond"];
      let cIdx = null;
      let run = true;
      for (cIdx in cond) {
        if (typeof BTHparsed[cIdx] === "undefined") run = false;
        if (BTHparsed[cIdx] !== cond[cIdx]) run = false;
      }
      // if all conditions evaluated to true then execute
      if (run) CONFIG.actions[aIdx]["action"](BTHparsed);
    }
  }
  
  // retry several times to start the scanner if script was started before
  // BLE infrastructure was up in the Shelly
  function startBLEScan() {
    let bleScanSuccess = BLE.Scanner.Start({ duration_ms: SCAN_DURATION, active: ACTIVE_SCAN }, scanCB);
    if( bleScanSuccess === false ) {
      Timer.set(1000, false, startBLEScan);
    } else {
      console.log('Success: BLU button scanner running');
    }
  }
  
  //Check for BLE config and print a message if BLE is not enabled on the device
  let BLEConfig = Shelly.getComponentConfig('ble');
  if(BLEConfig.enable === false) {
    console.log('Error: BLE not enabled');
  } else {
    Timer.set(1000, false, startBLEScan);
  }