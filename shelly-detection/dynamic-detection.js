/**
 * This script is deisigned to slowly scan the network for other Shelly devices and
 * let you execute code after every scan. The scan starts back at the first IP when
 * it finishes and calls afterDetection(). The script will try using the device's configuration
 * to get the IP and netmask. If an IP isn't found in that call, the script will then attempt
 * to use the device's status for both wifi and eth. If that doesn't work, the script will use
 * the fallback IP and netmask.
 * 
 * Written by: Smarter Circuits (https://www.youtube.com/@smartercircuits)
 */

let fallbackIP = "192.168.4.0"; // If the device cannot get its IP from the configuration or status call, it will use this network ID.
let fallbackNetmask = "255.255.255.0"; // If the device cannot get its IP from the configuration or status calls, it will use this netmask.
let useKVS = true; // If set true, entries will be made in KVS as {"<IP>": type}.
let useWifi = true; // Whether or not to use the connected wifi network for discovery.

// Whatever you want to do once the device knows about the rest of the devices. Keep in mind this will happen every detection cycle.
function afterDetection() {
  print("Nothing is implemented here yet");
}

// It is not recommended to modify anything below this line unless you know what you're doing.

let DiscoveryTimerID = null;
let currentOctet = 1;
let ips = [];
let ci = 0;
let knownShellyDevices = {};

function getNetworkID(ip, subnet) {
  let ipParts = ip.split('.');
  let subnetParts = subnet.split('.');
  let networkIDParts = [];
  for (let i = 0; i < 4; i++) {
    networkIDParts.push(ipParts[i] & subnetParts[i]);
  }
  return networkIDParts.join('.');
}

function saveKVSdata(key, data) {
    Shelly.call("KVS.Set", { key: key, value: data }, function(result, error_code, error_message) { 
        if (error_code == 0) { 
            print("KVS " + key + " set to " + data); 
        } else { 
            print("KVS " + key + " set failed: "+error_message);
        }
    });
}

// This isn't used, but it could be in the afterDetection function.
function loadKVSdata(key) {
    Shelly.call("KVS.Get", { key: key }, function (result) { return result.value; });
}

function scanNetwork(networkID, subnet) {
  print("Scan: ", networkID);
  let subnetParts = subnet.split('.').map(Number);
  let ipRange = 256 - subnetParts[3];
  let networkParts = networkID.split('.').map(Number);
  
  for (let i = 1; i < ipRange; i++) {
    let targetIP = networkParts[0] + '.' + networkParts[1] + '.' + networkParts[2] + '.' + (networkParts[3] + i);
    ips.push(targetIP);
  }
}

function checkIP(ip, callback) {
    Shelly.call(
        "HTTP.GET",
        { url: "http://" + ip + "/rpc/Shelly.GetDeviceInfo" },
        function (result, error_code, error_message) {
            if (error_code === 0 && result.code == 200) {
                let data = JSON.parse(result.body);
                print("IP " + ip + " is reachable.");
                callback(data.app);
            } else {
                print("Error reaching IP " + ip + ": " + error_message);
                print(JSON.stringify(result));
                
                callback(null);
            }
        }
    );
}

function startDiscoveryTimer(ready) {
    if (DiscoveryTimerID === null) {
        DiscoveryTimerID = Timer.set(5000, true, function () {
            if (ci > ips.length) {
                //stopDiscoveryTimer(); // Only if you want the script to run once and stop.
                ci = 0;
                ready();
                return;
            }
            checkIP(ips[ci], function(device) {
                if (device != null) {
                    knownShellyDevices[ips[ci]] = device;
                    if (useKVS) saveKVSdata(ips[ci], device); // maybe we access this in another script.
                }
                ci++;
            });
        });
        print("Discovery timer started.");
    } else { // don't think this could happen, but maybe...
        print("Discovery timer is already running.");
    }
}

// not used, but could be in the afterDetection if needed.
function stopDiscoveryTimer() {
    if (DiscoveryTimerID !== null) {
        Timer.clear(DiscoveryTimerID);
        DiscoveryTimerID = null;
        print("Discovery timer stopped.");
    } else {
        print("Discovery timer is not running.");
    }
}

function startupStrategyA() {
    Shelly.call("Wifi.GetConfig", {}, function(result, error_code, error_message) {
        if (error_code === 0) {
            if(useWifi && result.wifi && result.wifi.sta && result.wifi.sta.ip && result.wifi.sta.netmask) {
                let ip = result.wifi.sta.ip;
                let subnet = result.wifi.sta.netmask;
                let networkID = getNetworkID(ip, subnet);
                print("Wifi Network ID: " + networkID);
                scanNetwork(networkID, subnet);
                startDiscoveryTimer(function() {
                    afterDetection();
                });
            } if(result.eth && result.eth.ip && result.eth.netmask) {
                let ip = result.eth.ip;
                let subnet = result.eth.netmask;
                let networkID = getNetworkID(ip, subnet);
                print("Ethernet Network ID: " + networkID);
                scanNetwork(networkID, subnet);
                startDiscoveryTimer(function() {
                    afterDetection();
                });
            } else {
                print("No IP configured, using strategy B");
                startupStrategyB();
            }
        
        } else {
            print("Error getting device info, using strategy B");
            startupStrategyB();
        }
    });
}

function startupStrategyB() {
    Shelly.call("Shelly.GetStatus", {}, function(result, error_code, error_message) {
        if (error_code === 0) {;
            if(useWifi && result.wifi && result.wifi.sta_ip) {
                let ip = result.wifi.sta_ip;
                let subnet = "255.255.255.0"; // not sure what else to do here since it's not reported in GetStatus
                let networkID = getNetworkID(ip, subnet);
                print("Wifi Network ID (from status):", networkID);
                scanNetwork(networkID, subnet);
                startDiscoveryTimer(function() {
                    afterDetection();
                });
            } else if (result.eth && result.eth.ip) {
                let ip = result.eth.ip;
                let subnet = "255.255.255.0"; // not sure what else to do here since it's not reported in GetStatus
                let networkID = getNetworkID(ip, subnet);
                print("Ethernet Network ID (from status):", networkID);
                scanNetwork(networkID, subnet);
                startDiscoveryTimer(function() {
                    afterDetection();
                });
            } else {
                print("No IP found, using fallback IP");
                scanNetwork(fallbackIP, fallbackNetmask);
                startDiscoveryTimer(function() {
                    afterDetection();
                });
            }
        
        } else {
            print("Error getting device info:", error_message);
            print(JSON.stringify(result));
        }
    });
}

startupStrategyA();