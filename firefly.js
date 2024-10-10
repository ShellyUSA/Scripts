const CONFIG = {
  //Choose delay time in seconds before and after every cycle for one of 4 possible channels
  channel_cycle_delay_seconds: [3, 2, 1, 4],
  /*
      Choose time in seconds to transit from current brightness to target brightness
      for one of 4 possible channels
    */
  transition_durations: [18, 18, 18, 18],
  //Choose min brightness in percent for one of 4 possible channels
  min_brightness: [10, 15, 20, 25],
  //Choose max brightness in percent for one of 4 possible channels
  max_brightness: [80, 85, 78, 75],
};

//Get current profile
const profile = Shelly.getDeviceInfo().profile;

console.log("profile: ", profile);

// any of rgb | light | rgbw for Plus RGBW PM,
let profiles = {
  light: "light",
  rgbw: "rgbw",
  rgb: "rgb",
};

let is_channel_started = [false, false, false, false];

let lightChannelHandlers = [null, null, null, null];
let statusHandler = null;

//Turn On channel and set min brightness
function turnOnChannel(id, component) {
  console.log("Turning on the channel and set min brightness!");
  const method = component + ".set";
  Shelly.call(method, {
    id: id,
    on: true,
    brightness: CONFIG.min_brightness[id],
  });
}

//Turn Off channel
function turnOffChannel(id, component) {
  console.log("Turning off the channel!");
  const method = component + ".set";
  Shelly.call(method, {
    id: id,
    on: false,
  });
}

//Set brightness and transition_duration
function setBrightnessWithTransionDuration(id, brightness, component) {
  const method = component + ".set";
  Shelly.call(
    method,
    {
      id: id,
      brightness: brightness,
      transition_duration: CONFIG.transition_durations[id],
    },
    function () {
      is_channel_started[id] = true;
    }
  );
}

//Start channel cycle with target max brightness
function startChannelCycle(id, component) {
  turnOnChannel(id, component);
  setBrightnessWithTransionDuration(id, CONFIG.max_brightness[id], component);
}

//Status change handler for brightness for light, rgb, rgbw components
function handleBrightnessChange(eventData) {
  if (
    eventData.component != "undefined" &&
    (eventData.component.indexOf("light") !== -1 ||
      eventData.component.indexOf("rgb") !== -1) &&
    typeof eventData.delta.brightness != "undefined" &&
    typeof eventData.delta.id != "undefined"
  ) {
    const component = eventData.component.split(":")[0];
    const brightness = eventData.delta.brightness;
    const id = eventData.delta.id;
    console.log("brightness: ", brightness);
    console.log("id: ", id);
    if (brightness >= CONFIG.max_brightness[id]) {
      console.log("MAX Brightness is reached!");
      setBrightnessWithTransionDuration(
        id,
        CONFIG.min_brightness[id],
        component
      );
    } else if (
      brightness <= CONFIG.min_brightness[id] &&
      is_channel_started[id]
    ) {
      turnOffChannel(id, component);
      is_channel_started[id] = false;
      //Restart the cycle
      start(id);
    }
  }
}

if (statusHandler) {
  Shelly.removeStatusHandler(statusHandler);
}

statusHandler = Shelly.addStatusHandler(handleBrightnessChange);

function start(id) {
  if (lightChannelHandlers[id]) {
    Timer.clear(lightChannelHandlers[id]);
  }

  lightChannelHandlers[id] = Timer.set(
    CONFIG.channel_cycle_delay_seconds[id] * 1000,
    false,
    function (userData) {
      startChannelCycle(userData.id, userData.component);
    },
    {
      id: id,
      component: profile,
    }
  );
}

//Initially start all possible channels
if (profile === profiles.rgb || profile === profiles.rgbw) {
  start(0);
} else if (profile === profiles.light) {
  for (let i = 0; i < lightChannelHandlers.length; i++) {
    start(i);
  }
}
