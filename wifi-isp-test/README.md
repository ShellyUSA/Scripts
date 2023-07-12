
## Name
Shelly 1pm Wi-Fi ISP Testing

## Files
wifi-isp-test.js
wifi-isp-sched.js

## Requirements
Check WiFi / Internet connection - ping up to 5 domains/IP addresses.
If any of them are successful, test again in XX minutes. 
If it fails, power cycle, wait XX minutes and test again. 
If it still fails, slow down and wait for 30 minutes or one hour to reset, so that we don't go into a spiral of power recycling

## Description
Whenever power is interrupted, all devices reboot. Shelly, routers and anything connected to them.
To be sure we have wifi and internet connection, this script checks for both in a set interval.
wifi-isp-SCHED handles the execution of wifi-isp-TEST.

There is no forced device reboot. In a meeting with Mircho he suggested instead, enable/disable the wi-fi. This way the device tries to reconnect instead of power cycling.
Whenever the device reboots and can't connect to the SNTP server, the clock is set to 19:00:00.

## Usage
Add a new script to the device and name it wifi-isp-test.
Copy and paste the code from wifi-isp-test.js
Save the script
Enable the script

Add another script to the device and name it wifi-isp-sched.
Copy and paste the code from wifi-isp-sched.js
You can change the time the test will occur regularly
Save the script
Enable the script
Run the script

The wifi-isp-sched is set to run once a day. This can be change in the code.
On reboot, the device will run this script once.

First it will check if the device got ip from the router.
if not, it will reboot the connection.
Then it will check if there is internet connection by testing urls (random,google,nasdaq,facebook)

## Support
rodrigo.henriques@shellyusa.com

## Roadmap
replace urls by objects

## Project blocks and workarounds
