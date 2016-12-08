(function($) {

// Game params
const switchDelay = 200;
const timeBetweenRounds = 1000;
const soundTimeMilis = 650;

const validColors = ['green', 'red', 'yellow', 'blue'];

// Load sounds in arrays of 3 similar items to avoid overlapping sounds
const soundGreen = [new Audio('assets/green.wav'),
    new Audio('assets/green.wav'), new Audio('assets/green.wav')];
const soundYellow = [new Audio('assets/yellow.wav'),
    new Audio('assets/yellow.wav'), new Audio('assets/yellow.wav')];
const soundRed = [new Audio('assets/red.wav'),
    new Audio('assets/red.wav'), new Audio('assets/red.wav')];
const soundBlue = [new Audio('assets/blue.wav'),
    new Audio('assets/blue.wav'), new Audio('assets/blue.wav')];
const soundSwitch = [new Audio('assets/switch.mp3'),
    new Audio('assets/switch.mp3'), new Audio('assets/switch.mp3')];

const colorInfo = {
  green: {
    sound: soundGreen,
    colorOn: '#00ff73',
    colorOff: '#00a74a',
  },
  yellow: {
    sound: soundYellow,
    colorOn: '#f8d53a',
    colorOff: '#cca707',
  },
  blue: {
    sound: soundBlue,
    colorOn: '#0f7cf0',
    colorOff: '#094a8f',
  },
  red: {
    sound: soundRed,
    colorOn: '#e91620',
    colorOff: '#9f0f17',
  },
};

const colorSounds = {
  green: soundGreen,
  yellow: soundYellow,
  red: soundRed,
  blue: soundBlue
};

// Inits
let strictMode = false;
let playing = false;
let waitingInput = false;
let showingAnimation = false;
let level = 0;
let sequence = [];
let inputSequence = [];
let playIndex = 0;

// Add a listener to the switch to turn on and off the game
$("#switch").change(function() {
  
  playSound(soundSwitch);
  
  if ($(this).is(':checked')) {
    setTimeout(turnOn, switchDelay);
  } else {
    setTimeout(turnOff, switchDelay);
  }
});

//**********
// ON-OFF
//**********
function turnOn() {
  // Set "ON" styles via adding the class .device-on
  $(".device").addClass('device-on');
  
  // Setup buttons listeners
  $("#strict").click(toggleStrictMode);
  $("#start").click(start);
  $("#green").mousedown('green', pressedColor)
      .mouseup('green', releasedColor);
  $("#red").mousedown('red', pressedColor)
      .mouseup('red', releasedColor);
  $("#yellow").mousedown('yellow', pressedColor)
      .mouseup('yellow', releasedColor);
  $("#blue").mousedown('blue', pressedColor)
      .mouseup('blue', releasedColor);

  animateTurnOn();
}

function turnOff() {
  // Remove "ON" styles via removing the class .device-on
  $(".device").removeClass('device-on');
  
  // Remove buttons listeners
  $("#strict").off('click');
  $("#start").off('click');
  $("#green").off('mousedown mouseup');
  $("#red").off('mousedown mouseup');
  $("#yellow").off('mousedown mouseup');
  $("#blue").off('mousedown mouseup');

  // reset states to initials
  turnOffStrictMode();
  stop();
  printDisplay("");
}

//**********
// GAME HANDLING
//**********
function pressedColor(color) {
  if (color.hasOwnProperty('data')) {
    color = color.data;
  }
  
  // If the game is waiting for the user's input:
  //   1. store the input in the inputSequence array
  //   2. check if that input equals the correct value
  //     2.1. If it is not, restartStep or endGame (depending on strictMode)
  //   3. If the input is correct, checks if both sequences have the same length.
  //     3.1. If they are not the same, keep waiting for input.
  //     3.2. If they are the same, add a new step -> show sequence -> waitInput;
  if (showingAnimation) {
    return;
  }

  soundAndLightColor(color);
  if (waitingInput) {
    // Store the input at inputSequence;
    inputSequence.push(color);
    
    const lastIndex = inputSequence.length - 1;
    // check if the last input was correct
    if (inputSequence[lastIndex] == sequence[lastIndex]) {
      // ...case of correct input
      
      if (inputSequence.length == sequence.length) {
        // ...case of complete sequence
        waitingInput = false;
        
        // checks if the game has finished (lvl 20)
        if (level === 20) {
          userWon();
          return;
        }
        
        // next level
        addNewStep();
        setTimeout(function() {
          showSequence(getTimes(level));
          waitInput();
        }, timeBetweenRounds);
      } // else, wait for next input;
      
    } else {
      // ...case of wrong input
      inputSequence = [];
      witingInput = false;
      animateMistake(handleMistakenInput);
    }
  }
}

function releasedColor(color) {
  if (color.hasOwnProperty('data')) {
    color = color.data;
  }
  $("#" + color).removeClass('active');
}

function handleMistakenInput() {
  if (strictMode) {
    // Game over
    start();

  } else {
    // Retry last level
    printDisplay(level);
    showSequence(getTimes(level));
    
  }
}

function soundAndLightColor(color) {
  playSound(colorSounds[color]);
  $("#" + color).addClass('active');
}

function lightColor(color) {
  $("#" + color).addClass('active');
}

/**
 * Given a level, this function returns an array with the following values;
 * ['time pressing button', 'time between buttons']
 */
function getTimes(level) {
  if (level < 5) {
    return [800, 200];
  } else if (level < 9) {
    return [600, 150];
  } else if (level < 13) {
    return [400, 100];
  } else {
    return [250, 75];
  }
}

function addNewStep() {
  level++;
  inputSequence = [];
  printDisplay(level);
  sequence.push(validColors[rand(0,3)]);
}

function showSequence(times) {
  // TODO check if this can be improved using colorSequenceAnimation
  showingAnimation = true;
  const pressTime = times[0];
  const timeBetweenColors = times[1];
  const stepTime = pressTime + timeBetweenColors;
  for (let i = 0; i < level; i++) {
    setTimeout(soundAndLightColor, stepTime * i, sequence[i]);
    setTimeout(releasedColor, stepTime * i + pressTime, sequence[i]);
    
    if (i == level - 1) {
      setTimeout(function() {
        showingAnimation = false;
      }, stepTime * i + pressTime);
    }
  }
}

function waitInput() {
  waitingInput = true;
}

function userWon() {
  winAnimation(afterAnimation);
  
  function afterAnimation() {
    setTimeout(start, 1000);
  }
}

//**********
// START-STOP
//**********
function start() {

  // If there is an animation showing, do nothing
  if (showingAnimation) {
    return;
  }

  // If the user is playing, stop the game, and start again 1 second after reseting the game.
  if (playing) {
    stop();
    setTimeout(start, 1000);
    return;
  }
  
  playing = true;
  
  
  addNewStep();
  const times = getTimes(level);
  const totalShowTime = level * (times[0] + times[1]);
  
  showSequence(times); //getSpeed(level) could be called here directly
  setTimeout(waitInput, totalShowTime);
}

function stop() {
  playing = false;
  
  sequence = [];
  level = 0;
  
  // remove all timeouts
  let id = window.setTimeout(()=>{}, 0);
  while (id--) {
      window.clearTimeout(id);
  }
  
  // turn off all the colors
  validColors.forEach(function(value) {
    releasedColor(value);
  });
  
  printDisplay('--');
}

//**********
// STRICT MODE
//**********
function toggleStrictMode() {
  if (strictMode) {
    turnOffStrictMode();
  } else {
    turnOnStrictMode();
  }
}

function turnOnStrictMode() {
  strictMode = true;
  $(".light").addClass('strict-on');
  
  /*$(".light").css({
    backgroundColor: lightOnColor,
    boxShadow: '0 0 4px rgba(255,0,0,1)'
  })*/
}

function turnOffStrictMode() {
  strictMode = false;
  $(".light").removeClass('strict-on');
  /*$(".strict-light").css({
    backgroundColor: lightOffColor,
    boxShadow: '0 0 0 transparent',
  })*/
}

//**********
// ANIMATIONS
//**********
function animateTurnOn() {
  // TODO make it more readable using flashColor and flashDisplay
  showingAnimation = true;
  let activeTime = 400;
  
  const clearDisplay = () => {printDisplay('');}
  const initDisplay = () => {printDisplay('--');}
  
  printDisplay('--');
  setTimeout(clearDisplay, activeTime);
  setTimeout(initDisplay, activeTime*2);
  setTimeout(clearDisplay, activeTime*3);
  setTimeout(function() {
    initDisplay();
    showingAnimation = false;
  }, activeTime*4, 'red');
  
  
  // this could be replaced with flashColor. It could become more readable.
  lightColor('green');
  
  setTimeout(lightColor, activeTime, 'red');
  setTimeout(releasedColor, activeTime, 'green');
  
  setTimeout(lightColor, activeTime*2, 'blue');
  setTimeout(releasedColor, activeTime*2, 'red');
  
  setTimeout(lightColor, activeTime*3, 'yellow');
  setTimeout(releasedColor, activeTime*3, 'blue');
  setTimeout(releasedColor, activeTime*4, 'yellow');

}

function animateMistake(callback) {
  // TODO make it more readable using flashColor and flashDisplay
  showingAnimation = true;
  let activeTime = 200;
  
  printDisplay('!!');
  setTimeout(printDisplay, activeTime, '');
  setTimeout(printDisplay, activeTime*2, '!!');
  setTimeout(printDisplay, activeTime*3, '');
  setTimeout(printDisplay, activeTime*4, '!!');
  setTimeout(function() {
    printDisplay('');
    showingAnimation = false;
    if (typeof callback == 'function') {
      setTimeout(callback, activeTime);
    }
  }, activeTime*6);
}

function flashColor(color, time) {
  lightColor(color);
  setTimeout(releasedColor, time, color);
}

function flashDisplay(text, times, delay) {
  for (let i = 0; i < times; i++) {
    setTimeout(printDisplay, i * delay * 2, text);
    setTimeout(printDisplay, i * delay * 2 + delay, '');
  }
}

function colorSequenceAnimation(steps, delay) {
  
  for (let i = 0; i < steps.length - 1; i++) {
    // turn on lights of this step
    if (Array.isArray(steps[i])) {
      steps[i].forEach(function(color) {
        setTimeout(flashColor, delay * i , color, delay);
      });
    } else {
      setTimeout(flashColor, delay * i , steps[i], delay);
    }
  }
  
}

function winAnimation(callback) {
  const displayDelay = 500;
  const times = 4;
  showingAnimation = true;
  
  // animate text
  const totalTime = times * displayDelay* 2;
  
  flashDisplay("Winner", times, displayDelay);
  setTimeout(() => {
    printDisplay('Winner');
    showingAnimation = false;
    if (typeof callback == 'function') {
      callback();
    }
  }, totalTime + displayDelay);
  
  // animate colors
  validColors.forEach((value) => {
    releasedColor(value);
  });
  
  colorSequenceAnimation(
    [['green', 'blue'], ['red', 'yellow'], ['green', 'blue'], ['red', 'yellow'], 'green', 'red', 'blue', 'yellow', 'green', 'red', 'blue', 'yellow', 'green', 'red', 'blue', 'yellow', validColors]
    , 250);
}

//**********
// HELPER FUNCTIONS
//**********
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function printDisplay(text) {
  $(".display").text(text);
}

function playSound(array) {
  // this will always play the copy 0, 1, 2 of the given array.
  // this way we avoid playing a sound that's been played, because it wouldn't
  // sound this way
  playIndex++;
  array[playIndex%3].play();
}

/*
help_solve = function() {
  sequence.forEach(function(value) {
    pressedColor(value);
  });
}

help_win = userWon;
*/

})(jQuery)