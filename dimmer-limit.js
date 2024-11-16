// This script allows you to set upper and lower limits on the brightness of your Shelly Plus Wall Dimmer.
// Commissioned by Yandi Noa at Ikatu, created by clendinning1 and homeautomaton

// CONFIG (add your limits here):
lower_limit = 20
upper_limit = 80

// CODE (do not alter):

function def( o ) {
    return typeof o !== "undefined";
}

// Set brightness
function setBrightness(brightness){
  Shelly.call(
    "Light.Set",
    {"id":0, "brightness":brightness},
    null
   );
}

// Set bounds/limits
function ApplyBounds(brightness) {
  if (brightness < lower_limit){
      setBrightness(lower_limit)
    } else if (brightness > upper_limit){
      setBrightness(upper_limit)
    }
}

// Check brightness
function AddHandler() {
  Shelly.addStatusHandler(
    function (event, userData) {
      if (def(event) && def(event.delta) && def(event.delta.brightness)) {
          ApplyBounds(event.delta.brightness)
          print("Brightness:",event.delta.brightness)
      }
    }
  );
}

function GetCurrentBrightness() {
  let on = Shelly.getComponentStatus("light",0);
  return(on.brightness)
}

function CheckInitialConditions() {
  brightness = GetCurrentBrightness()
  ApplyBounds(brightness)
}

function main() {
  if (lower_limit >= upper_limit) {
    print("Cannot set lower limit higher than upper limit.")
    return
  }
  CheckInitialConditions()
  AddHandler()
}

main()
