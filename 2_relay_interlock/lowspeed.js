// ============================================================
// LOW SPEED PUMP INTERLOCK SCRIPT (Shelly 1PM Gen4)
// ============================================================
// CONFIGURATION
var HIGH_SPEED_DEVICE_IP = "192.168.1.101"; // ← Change to your high speed 1PM IP
var INTERLOCK_DELAY = 500; // 0.5 seconds in milliseconds
var MY_RELAY_ID = 0; // This device's relay ID
var VIRTUAL_SWITCH_ID = 201; // Virtual component ID for low speed trigger

// Track processing state to prevent conflicts
var isProcessing = false;

// Function to turn off the other device
function turnOffOtherDevice(callback) {
    var url = "http://" + HIGH_SPEED_DEVICE_IP + "/rpc/Switch.Set";
    var body = JSON.stringify({
        id: 0,
        on: false
    });
    
    HTTP.post(url, body, function(result, error_code, error_message) {
        if (error_code !== 0) {
            print("ERROR: Failed to turn off high speed device:", error_message);
        } else {
            print("High speed device turned OFF");
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
                print("ERROR: Failed to turn on low speed relay:", JSON.stringify(error));
            } else {
                print("LOW SPEED pump activated");
            }
            isProcessing = false;
        });
    });
}

// Main interlock function for low speed
function activateLowSpeed() {
    if (isProcessing) {
        print("Already processing - ignoring trigger");
        return;
    }
    
    isProcessing = true;
    print("LOW SPEED triggered - starting interlock sequence");
    
    // Step 1: Turn off high speed device
    // Step 2: Wait 0.5 seconds
    // Step 3: Turn on low speed (this device)
    turnOffOtherDevice(function() {
        turnOnThisDevice();
    });
}

// Listen for virtual component triggers
Shelly.addEventHandler(function(event) {
    // Virtual switch trigger
    if (event.component === "switch:" + VIRTUAL_SWITCH_ID && 
        event.data && event.data.state === true) {
        activateLowSpeed();
    }
    
    // Also listen for manual relay trigger (backup)
    if (event.component === "switch:" + MY_RELAY_ID && 
        event.data && event.data.state === true && !isProcessing) {
        activateLowSpeed();
    }
}, null);

print("LOW SPEED interlock script loaded");
print("Virtual switch ID:", VIRTUAL_SWITCH_ID);
print("Partner device IP:", HIGH_SPEED_DEVICE_IP);
