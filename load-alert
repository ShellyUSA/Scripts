// This script alerts the user if the power drops below a 
// given threshold while the device is still switched on.
// Compatible with both PM and EM devices.
//
// USER SETTINGS:
// Enter the power consumption value of your device (units = Watts):
threshold_off = 0 // Device is considered OFF when power is less than or equal to this value
threshold_on = 5 // Device is considered ON again only when power rises above this value. (Prevents false alerts from minor power fluctuations.)
// For EM devices, choose how often to poll for power consumption value (in milliseconds):
poll_interval = 1000
// Choose notification endpoint: 
let CONFIG = {
  notifyEndpoint: "http://push-notification-endpoint-url",
};
// Enter the error message of your choice:
user_msg = "Load may have failed."
//
//
//
// FALLBACK: 
// On error “Could not detect device type automatically.”, specify device type below:
// "pm" or "em" (leave blank to auto-detect)
let user_device_type = "";
//
// -------------------DO NOT MODIFY PAST THIS POINT-------------------

let notifications = [];
let last_state = "on";  // default to on to catch first time off
if (poll_interval < 1000) poll_interval = 1000; // avoid overload polling

// user msg encoding
function _simple_encode(str) {
  let res = "";
  for (let i = 0; i < str.length; i++) {
    if (str.at(i) === 0x20) {
      res += "%20";
    } else {
      res += chr(str.at(i));
    }
  }
  return res;
}

// debug msgs toggle
let DEBUG = false;
function debug(msg) { if (DEBUG) print(msg); }

// -------------------AUTO DETECT DEVICE TYPE-------------------

// polling device type first 
let device_type = "unknown";

Shelly.call("Shelly.GetDeviceInfo", {}, function (result, error_code) {
  if (error_code !== 0 || result === null) {
    print("Could not retrieve device info.");
    return;
  }

  // check for user override on device type auto-detect
  if (user_device_type === "pm" || user_device_type === "em") {
    device_type = user_device_type.toLowerCase();
    print("Using user-defined device type: " + device_type);
  } else {
    // getting model from the GetDeviceInfo call
    let model = result.model || "";
    let modelUpper = model.toUpperCase();
    debug("Detected model: " + model);

    // search for EM or PM in model string from call
    if (
      modelUpper.indexOf("EM") >= 0 &&
      (modelUpper.indexOf("PM") >= 0 || modelUpper.indexOf("PLUG") >= 0 || modelUpper.indexOf("SNPL") >= 0)
    ) {
      device_type = "unknown"; // detected both strings, will ask user for override
    } else if (modelUpper.indexOf("EM") >= 0) {
      device_type = "em";
    } else if (modelUpper.indexOf("PM") >= 0 || modelUpper.indexOf("PLUG") >= 0 || modelUpper.indexOf("SNPL") >= 0) {
      device_type = "pm";
    } else {
      device_type = "unknown"; // unable to determine model type, will ask user for override
    }

    debug("Auto-detected device type: " + device_type);
  }

  // if auto-detection failed
  if (device_type === "unknown") {
    print("Could not detect device type automatically. Please set your device type manually in the FALLBACK section under USER SETTINGS.");
    return; // stops script unless device type can be determined
  }

  if (device_type === "pm") {
    handlePM();
  } else if (device_type === "em") {
    handleEM();
  }
});


// -------------------PM DEVICE HANDLER-------------------

function handlePM() {
  let has_switch = true;

  // check for switch
  Shelly.call("switch.getstatus", { id: 0 }, function (result, error_code, error_message) {
    if (error_code !== 0 || result === null || typeof result.output === "undefined") {
      has_switch = false;
      debug("no switch");
    } else {
      has_switch = true;
      debug("has switch");
    }

    // main function — runs on events ie switch flip etc
    Shelly.addEventHandler(function (event, user_data) {
      if (typeof event.info.apower === "undefined") {
        // if the event has no apower info, exit function
        debug("Event occurred, but without power info");
        return;
      }

      let power = event.info.apower;
      let new_state = last_state;

      // determine state
      if (power <= threshold_off) {
        new_state = "off";
      } else if (power > threshold_on) {
        new_state = "on";
      } else {
        // detected power but below the threshold
        debug("Detected power below user threshold.");
        return;
      }

      // on state change
      if (new_state !== last_state) {
        debug("State changed from " + last_state + " to " + new_state);
        last_state = new_state;

        if (new_state === "off") {
          // only sends notification if it turned off
          if (!has_switch) {
            // no switch: push message & end function here
            debug("Event occurred (switchless device), pushing message");
            notifications.push(user_msg);
          } else {
            // if switch exists...
            Shelly.call("switch.getstatus", { id: 0 }, function (result, error_code) {
              if (result.output) {
                // if the switch is on, push notification
                debug("Device is ON but power dropped. Pushing message.");
                notifications.push(user_msg);
              } else {
                debug("Device is OFF. No need to notify.");
              }
            });
          }
        } else {
          debug("Device is back ON. No alert needed.");
        }
      } else {
        debug("No state change.");
      }
    }, null);

    // send notifications if any queued
    // if there is a notif to be sent then it sends
    Timer.set(1000, true, function () {
      if (notifications.length) {
        let message = notifications[0];
        notifications.splice(0, 1);
        print("ALERT: ", message);
        let nEndpoint = CONFIG.notifyEndpoint + _simple_encode(message);
        Shelly.call(
          "http.get",
          { url: nEndpoint },
          function (result, error_code, error_message) {
            print(JSON.stringify(result));
          },
          null
        );
      }
    });
  });
}

// -------------------EM DEVICE HANDLER-------------------

function handleEM() {
  let new_state = last_state;

  Timer.set(poll_interval, true, function () {
    Shelly.call("Shelly.GetStatus", {}, function (result, error_code) {
      if (error_code !== 0 || result === null) {
        print("Error calling Shelly.GetStatus. Error code: ", error_code);
        return;
      }

      // scan for any channels with power info
      let totalPower = 0;
      for (let key in result) {
        let entry = result[key];
        if (entry && typeof entry === "object" && entry.hasOwnProperty("act_power")) {
          let p = entry.act_power;
          if (typeof p === "number") {
            debug("Found power in key " + key + ": " + p + " W");
            totalPower += p;
          }
        }
      }

      debug("Total combined power (EM): " + totalPower + " W");

      // determine state
      if (totalPower <= threshold_off) {
        new_state = "off";
      } else if (totalPower > threshold_on) {
        new_state = "on";
      } else {
        debug("Detected power below user threshold.");
        return;
      }

      // on state change
      if (new_state !== last_state) {
        debug("State changed from " + last_state + " to " + new_state);
        last_state = new_state;

        if (new_state === "off") {
          debug("Power dropped below threshold on EM device, pushing message");
          notifications.push(user_msg);
        } else {
          debug("Power is back ON. No alert needed.");
        }
      } else {
        // print("No state change.");
      }
    });
  });

  // notifs (same as pm)
  Timer.set(1000, true, function () {
    if (notifications.length) {
      let message = notifications[0];
      notifications.splice(0, 1);
      print("ALERT: ", message);
      let nEndpoint = CONFIG.notifyEndpoint + _simple_encode(message);
      Shelly.call(
        "http.get",
        { url: nEndpoint },
        function (result, error_code, error_message) {
          print(JSON.stringify(result));
        },
        null
      );
    }
  });
}
