// Shelly 1 script

// Логика:

// - Когато изход 1 е OFF, след 1 секунда започва следене на S1

// - Когато изход 1 е ON, S1 не се следи

// - Ако при активно следене S1 се промени ON->OFF или OFF->ON,

//   включва се изход 1



let SWITCH_ID = 0; // Изход 1

let INPUT_ID = 0;  // S1



let monitorEnabled = false;

let enableTimer = null;

let lastInputState = null;



// Включване на изход 1

function turnOutputOn() {

  monitorEnabled = false;



  if (enableTimer !== null) {

    Timer.clear(enableTimer);

    enableTimer = null;

  }



  Shelly.call("Switch.Set", {

    id: SWITCH_ID,

    on: true

  });



  print("S1 changed -> Output 1 ON");

}



// Обработка според състоянието на изхода

function handleOutputState(outputOn) {

  if (outputOn) {

    monitorEnabled = false;



    if (enableTimer !== null) {

      Timer.clear(enableTimer);

      enableTimer = null;

    }



    print("Output 1 ON -> S1 monitoring disabled");

    return;

  }



  if (enableTimer !== null) {

    Timer.clear(enableTimer);

  }



  enableTimer = Timer.set(1000, false, function () {

    Shelly.call("Input.GetStatus", { id: INPUT_ID }, function (inputRes) {

      lastInputState = inputRes.state;



      Shelly.call("Switch.GetStatus", { id: SWITCH_ID }, function (switchRes) {

        if (!switchRes.output) {

          monitorEnabled = true;

          print("Output 1 OFF -> S1 monitoring enabled");

          print("Initial S1 state:", lastInputState);

        }

      });

    });

  });



  print("Output 1 OFF -> waiting 1 sec before S1 monitoring");

}



// Следене на събития

Shelly.addEventHandler(function (event) {



  // Промяна на изход 1

  if (event.component === "switch:" + SWITCH_ID) {

    Shelly.call("Switch.GetStatus", { id: SWITCH_ID }, function (res) {

      handleOutputState(res.output);

    });

  }



  // Промяна на S1

  if (

    monitorEnabled &&

    event.component === "input:" + INPUT_ID

  ) {

    Shelly.call("Input.GetStatus", { id: INPUT_ID }, function (res) {

      let currentState = res.state;



      if (

        lastInputState !== null &&

        currentState !== lastInputState

      ) {

        print("S1 changed from", lastInputState, "to", currentState);

        lastInputState = currentState;

        turnOutputOn();

      } else {

        lastInputState = currentState;

      }

    });

  }



});



// Начална инициализация

Shelly.call("Input.GetStatus", { id: INPUT_ID }, function (inputRes) {

  lastInputState = inputRes.state;



  Shelly.call("Switch.GetStatus", { id: SWITCH_ID }, function (switchRes) {

    handleOutputState(switchRes.output);

  });

});
