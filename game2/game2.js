var canvas, ctx;

var level = {
  x: 40,         // X position
  y: 285,         // Y position
  columns: 8,     // Number of tile columns
  rows: 8,        // Number of tile rows
  tilewidth: 70,  // Visual width of a tile
  tileheight: 70, // Visual height of a tile
  tiles: [],      // The two-dimensional tile array
  selectedtile: {selected: false, column: 0, row: 0}
};

var time = [
  {"type": "hb", "number": "31", "month": "July"}, //07
  {"type": "halloween", "number": "31", "month": "Oct"}, //10
  {"type": "christmas", "number": "25", "month": "Dec"}, // 12
  {"type": "stval", "number": "14", "month": "Feb"} //02
];

var current_time = 0;
var days_counter = 0;

var icons = [
  "hscarf", "phoenix", "snitch",
  "tscarf", "mark", "sign",
  /*"hut",*/ "prophecy",
  "hb", "christmas", "stval", "halloween", "skull", "rskull"
];

var scores = {
  "harry": 0,
  "tom": 0,
  "nobody": 0
};

var buttons = [
  {x: 275, y: 90, width: 95, height: 45, text: "New Game", pressed: false},
  {x: 100, y: 88, width: 70, height: 70, text: "Calendar"},
  {x: level.x + 220, y: level.y + 250, width: 150, height: 100, text: "Play again"},
  {x: 400, y: 160, width: 75, height: 40, text: "Win"}
];

// Timing and frames per second
var lastframe = 0;
var fpstime = 0;
var framecount = 0;
var fps = 0;

// Mouse dragging
var drag = false;

// Clusters and moves that were found
var clusters = [];  // { column, row, length, horizontal }
var buster = {};    // {type, column, row}
var buster_victims = []; // column, row
var moves = [];     // { column1, row1, column2, row2 }

// Current move
var currentmove = {column1: 0, row1: 0, column2: 0, row2: 0};

// Game states
var gamestates = {init: 0, ready: 1, resolve: 2};
var gamestate = gamestates.init;

// Animation variables
var animationstates = {searchClusters: 0, shiftTilesDown: 1, swapTiles: 2, reSwapTiles: 3, buster: 4, show_final: 5};
var animationstate = animationstates.searchClusters;
var animationtime = 0;
var animationtimetotal = 0.3;

// Game Over
var gameover = false;

function getRandomTile() {
  // buster
  let lucky_val = 40 + 200 / (5 + days_counter);
  if (Math.floor(Math.random() * lucky_val) == 0) {
    const icon = icons.indexOf(time[current_time].type);
    nextDate();
    return icon;
  }

  // skull
  if (Math.floor(Math.random() * 50) == 0) {
    return icons.indexOf("skull");
  }

  return Math.floor(Math.random() * 7); //icons.length
}

// Update the game state
function update(tframe) {
  var dt = (tframe - lastframe) / 1000;
  lastframe = tframe;

  // Update the fps counter
  updateFps(dt);

  if (gamestate == gamestates.ready) {
    // Game is ready for player input
    // Check for game over
    if (moves.length <= 0) {
      gameover = true;
    }

  } else if (gamestate == gamestates.resolve) {
    // Game is busy resolving and animating clusters
    animationtime += dt;

    if (animationstate == animationstates.searchClusters) {
      if (animationtime > animationtimetotal) {
        afterRemovingItems();
      }
    } else if (animationstate == animationstates.shiftTilesDown) {
      // Tiles need to be shifted down
      if (animationtime > animationtimetotal) {
        shiftTiles();

        animationstate = animationstates.searchClusters;
        animationtime = 0;

        findClusters();
        if (clusters.length <= 0) {
          gamestate = gamestates.ready;
        }
      }
    } else if (animationstate == animationstates.swapTiles) {
      // Swapping tiles animation
      if (animationtime > animationtimetotal) {

        // not for skull
        if(level.tiles[currentmove.column1][currentmove.row1].type != icons.indexOf("skull") &&
            level.tiles[currentmove.column2][currentmove.row2].type != icons.indexOf("skull")) {
          notSkullSwapping();
        } else {
          animationtime = 0;
          gamestate = gamestates.ready;
        }

        findMoves();
        findClusters();
      }
    } else if (animationstate == animationstates.reSwapTiles) {
      // Rewind swapping animation
      if (animationtime > animationtimetotal) {
        // Invalid swap, swap back
        swap(currentmove.column1, currentmove.row1, currentmove.column2,
            currentmove.row2);

        // Animation complete
        gamestate = gamestates.ready;
      }
    } else if (animationstate == animationstates.buster) {
      if (animationtime > animationtimetotal) {
        animationtimetotal = 0.3;
        buster = {};

        if (buster_victims.length > 0) {
          for (var i = 0; i < buster_victims.length; i++) {
            var scoretype = (buster_victims[i].type < 3) ? "harry" : (buster_victims[i].type < 6) ? "tom" : "nobody";
            scores[scoretype] += 1;
            level.tiles[buster_victims[i].column][buster_victims[i].row].type = -1;
          }
          removeClustersAndStartShiftingAnimation();
          animationstate = animationstates.shiftTilesDown;
        } else {
          gamestate = gamestates.ready;
        }
        animationtime = 0;
      }
    }
    else if(animationstate == animationstates.show_final){
      if (animationtime > animationtimetotal) {
        animationtimetotal = 0.3;
        newGame();
        animationtime = 0;
      }
    }

    findMoves();
    findClusters();
  }
}

function notSkullSwapping() {
  swap(currentmove.column1, currentmove.row1, currentmove.column2, currentmove.row2);

  // Check if the swap made a cluster
  findClusters();

  if (clusters.length > 0) {
    // Valid swap, found one or more clusters
    // Prepare animation states
    animationstate = animationstates.searchClusters;
    animationtime = 0;
    gamestate = gamestates.resolve;
  }

  // if buster
  else if (level.tiles[currentmove.column1][currentmove.row1].type >= 7 &&
      level.tiles[currentmove.column1][currentmove.row1].type != icons.indexOf("skull")) {
    gamestate = gamestates.resolve;
    animationstate = animationstates.buster;
    animationtime = 0;
    doBuster(currentmove.column1, currentmove.row1);
  }
  else if (level.tiles[currentmove.column2][currentmove.row2].type >= 7 &&
      level.tiles[currentmove.column1][currentmove.row1].type != icons.indexOf("skull")) {
    gamestate = gamestates.resolve;
    animationstate = animationstates.buster;
    animationtime = 0;
    doBuster(currentmove.column2, currentmove.row2);
  }

  // Invalid swap, Rewind swapping animation
  else {
    animationstate = animationstates.reSwapTiles;
    animationtime = 0;
  }
}

function afterRemovingItems() {
  days_counter++;
  findClusters();

  if (clusters.length > 0) {
    for (var i = 0; i < clusters.length; i++) {
      var scoretype = (clusters[i].type < 3) ? "harry" : (clusters[i].type < 6) ? "tom" : "nobody";
      scores[scoretype] += 3 * (clusters[i].length - 2);
    }
    removeClustersAndStartShiftingAnimation();
    animationstate = animationstates.shiftTilesDown;
  } else {
    gamestate = gamestates.ready;
  }
  animationtime = 0;
}