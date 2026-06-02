// ============================================================
// HIGH SPEED PUMP INTERLOCK SCRIPT (Shelly 1PM Gen4)
// ============================================================
// CONFIGURATION
var LOW_SPEED_DEVICE_IP = "192.168.1.100"; // ← Change to your low speed 1PM IP
var INTERLOCK_DELAY = 500; // 0.5 seconds in milliseconds
var MY_RELAY_ID = 0; // This device's relay ID
var VIRTUAL_SWITCH_ID = 200; // Virtual component ID for high speed trigger

// Track processing state to prevent conflicts
var isProcessing = false;

// Function to turn off the other device
function turnOffOtherDevice(callback) {
    var url = "http://" + LOW_SPEED_DEVICE_IP + "/rpc/Switch.Set";
    var body = JSON.stringify({
        id: 0,
        on: false
    });
    
    HTTP.post(url, body, function(result, error_code, error_message) {
        if (error_code !== 0) {
            print("ERROR: Failed to turn off low speed device:", error_message);
        } else {
            print("Low speed device turned OFF");
        }
        if (callback) callback();
    }, {
        "Content-Type": "application/json"
    });
}

// Function to turn on this device after delay
function turnOnThisDevice() {
    Timer.set(INTERLOCK_DELAY, false, function() {
        Shelly.call("Switch.Set", {
            id: MY_RELAY_ID,
            on: true
        }, function(result, error) {
            if (error) {
                print("ERROR: Failed to turn on high speed relay:", JSON.stringify(error));
            } else {
                print("HIGH SPEED pump activated");
            }
            isProcessing = false;
        });
    });
}

// Main interlock function for high speed
function activateHighSpeed() {
    if (isProcessing) {
        print("Already processing - ignoring trigger");
        return;
    }
    
    isProcessing = true;
    print("HIGH SPEED triggered - starting interlock sequence");
    
    // Step 1: Turn off low speed device
    // Step 2: Wait 0.5 seconds  
    // Step 3: Turn on high speed (this device)
    turnOffOtherDevice(function() {
        turnOnThisDevice();
    });
}

// Listen for virtual component triggers
Shelly.addEventHandler(function(event) {
    // Virtual switch trigger
    if (event.component === "switch:" + VIRTUAL_SWITCH_ID && 
        event.data && event.data.state === true) {
        activateHighSpeed();
    }
    
    // Also listen for manual relay trigger (backup)
    if (event.component === "switch:" + MY_RELAY_ID && 
        event.data && event.data.state === true && !isProcessing) {
        activateHighSpeed();
    }
}, null);

print("HIGH SPEED interlock script loaded");
print("Virtual switch ID:", VIRTUAL_SWITCH_ID);
print("Partner device IP:", LOW_SPEED_DEVICE_IP);
