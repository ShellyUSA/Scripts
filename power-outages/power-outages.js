/************************   settings  ************************/
notify = [ { "name": "web-a", "url":"https://.../page?device={device}&state={state}" },
           { "name": "web-b", "url":"https://.../b/page?device={device}&state={state}" },
           { "name": "mq-c", "topic":"updown", "msg":"{device} is {state}"} ];

devices = [ { "name": "plug-a",
               "alerts": [ {"notify": "web-a", "dir": "down"}, 
                           {"notify": "mq-c", "dir": "down"} ], 
               "url": "http://10.0.0.11/status",
               "poll_time": 300  },
            { "name": "plug-b",
              "alerts": [ {"notify": "web-b", "dir": "both"} ], 
               "url": "http://10.0.0.12/status",
               "poll_time": 300  } ];

cycle_time = 5;    // the script runs periodically to check if it is time to poll or send queued notifications
// cycle time defines the minimum poll_time for any device, and affects latency of message delivery

/***************   program variables, do not change  ***************/
in_flight = 0;
notify_map = {};
timer_handle = "";
next_device = 0;

function def( o ) {
    return typeof o !== "undefined";
}

function poll_response( result, error_code, error_message, dev ) {
    in_flight--;
    let new_state = "up"
    if ( error_code != 0 ) new_state = 'down';
    devices[ dev ].action = 'complete';
    if ( new_state != devices[ dev ].state ) {
        devices[ dev ].state = new_state;
        devices[ dev ].action = 'changed';
    }
}

function alert_response( result, error_code, error_message, notify ) {
    in_flight--;
    if ( error_code != 0 )
        print( "failed to send notification: " + notify )
}

function apply_templates( s, d ){
    s = s.replace( '{device}', d.name );
    s = s.replace( '{state}', d.state );
    return s;
}

function alert( d ) {
    while( in_flight < 3 && d.alerts_processed < d.alerts.length ) {
        let alert = d.alerts[ d.alerts_processed ];

        if ( alert.dir == 'both' || alert.dir == d.state ) {
            if ( def( notify_map[ alert.notify ].url ) ) {
                in_flight++;
                let url = apply_templates( notify_map[ alert.notify ].url, d );
                Shelly.call( "HTTP.GET", { url: url }, alert_response,  alert.notify  );
            } else if ( def( notify_map[ alert.notify ].topic ) && MQTT.isConnected() ) {
                let topic = apply_templates( notify_map[ alert.notify ].topic, d );
                let message = apply_templates( notify_map[ alert.notify ].message, d );
                MQTT.publish( topic, message );
            }
        }

        d.alerts_processed ++;
   }
   if ( d.alerts_processed == d.alerts.length ) d.action = 'notified';
}

function check_states( ) {
    let now = Date.now() / 1000;
    let last_device = next_device;

    while( in_flight < 3 ) {
        let d = devices[ next_device ];
        if ( ( d.state == 'unknown' || d.last_poll < now - d.poll_time ) && d.action != 'in-flight' ) {
            d.action = 'in-flight';
            in_flight++;
            d.alerts_processed = 0;
            d.last_poll = now;
            Shelly.call( "HTTP.GET", { url: d.url }, poll_response, next_device );
        } else if ( d.action == 'changed' && ( d.state == 'up' || d.state == 'down' ) ) {
            alert( d );
        }
        next_device ++;
        if ( next_device >= devices.length ) next_device = 0;
        if ( next_device == last_device ) break;
    }
}

function init( ) {
    timer_handle = Timer.set( 1000 * cycle_time, true, check_states );
    for ( let d in devices ) {
        devices[ d ].state = 'unknown';
        devices[ d ].action = '';
        devices[ d ].last_poll = 0;
        devices[ d ].alerts_processed = 0;
    }
    for ( let n in notify ) {
        notify_map[ notify[ n ].name ] = notify[ n ];
    }
}

init();
