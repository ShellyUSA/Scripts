// CONFIGURATION — set these two values to match your device
let NUM_INPUTS = 2; // Number of inputs (1–8)
let NUM_RELAYS = 2; // Number of relays (1–8)
let MAX_RETRIES = 3; // Safety retry limit if a relay won't turn off

// Recursively turn off all relays 0..NUM_RELAYS-1, then fire callback
function turnOffRelay(idx, callback) {
 if (idx >= NUM_RELAYS) {
 if (callback) callback();
 return;
 }
 Shelly.call("Switch.Set", { id: idx, on: false }, function () {
 turnOffRelay(idx + 1, callback);
 });
}

function allRelaysOff(callback) {
 turnOffRelay(0, callback);
}

// Recursively verify relays 0..NUM_RELAYS-1 are all off,
// then energise the target relay. Retries if any relay is still on.
function checkRelayOff(idx, targetRelay, retries) {
 if (idx >= NUM_RELAYS) {
 // All relays confirmed off — safe to energise target
 Shelly.call("Switch.Set", { id: targetRelay, on: true }, function () {
 print("Interlock: relay", targetRelay, "is ON");
 });
 return;
 }
 Shelly.call("Switch.GetStatus", { id: idx }, function (result) {
 if (result && result.output === true) {
 // A relay is still on
 if (retries <= 0) {
 print("Interlock ERROR: relay", idx, "stuck ON — aborting for safety");
 return;
 }
 print("Interlock: relay", idx, "still on — retry", (MAX_RETRIES - retries + 1));
 allRelaysOff(function () {
 Timer.set(200, false, function () {
 checkRelayOff(0, targetRelay, retries - 1);
 });
 });
 } else {
 // This relay is off — check the next one
 checkRelayOff(idx + 1, targetRelay, retries);
 }
 });
}

function checkAndTurnOn(targetRelay) {
 checkRelayOff(0, targetRelay, MAX_RETRIES);
}

// ── Event handler ──────────────────────────────────────────
Shelly.addEventHandler(function (event) {
 // Only process input events
 if (!event.component || event.component.slice(0, 6) !== "input:") return;

 let inputId = parseInt(event.component.slice(6));
 if (isNaN(inputId) || inputId < 0 || inputId >= NUM_INPUTS) return;

 let state = event.info && event.info.state;

 if (state === false) {
 // ── REQUIREMENT 2: any input OFF → all relays OFF ──────
 print("Input", inputId, "OFF — turning all relays off");
 allRelaysOff(null);

 } else if (state === true) {
 // ── REQUIREMENT 3: input ON → interlock sequence ───────
 // Step 1: command all relays off
 // Step 2: 100 ms settling delay
 // Step 3: verify all relays off (with retry)
 // Step 4: energise the matching relay channel
 print("Input", inputId, "ON — starting interlock for relay", inputId);
 allRelaysOff(function () {
 Timer.set(100, false, function () {
 checkAndTurnOn(inputId);
 });
 });
 }
});

print("Interlock script running. NUM_INPUTS:", NUM_INPUTS, "NUM_RELAYS:", NUM_RELAYS);
