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
    {"type":"hb", "number":"31", "month":"07"},
    {"type":"christmas", "number":"25", "month":"12"},
    {"type":"stval", "number":"14", "month":"02"}
];

var current_time = 0;
var days_counter = 0;
var was_lucky = false;

var icons = [
    "hscarf", "phoenix", "snitch",
    "tscarf", "mark", "sign",
    /*"hut",*/ "prophecy",
    "hb", "christmas", "stval"
];

var scores = {
    "harry": 0,
    "tom": 0,
    "nobody": 0
};

var buttons = [
    {x: 275, y: 90, width: 95, height: 45, text: "New Game", pressed: false},
    {x: level.x + 80, y: level.y + 200, width: 150, height: 50, text: "Love"},
    {x: level.x + 320, y: level.y + 200, width: 150, height: 50, text: "Kill"},
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
var animationstates = {searchClusters:0, shiftTilesDown:1, swapTiles:2, reSwapTiles:3, buster:4};
var animationstate = animationstates.searchClusters;
var animationtime = 0;
var animationtimetotal = 0.3;

// Game Over
var gameover = false;

window.onload = function () {
    canvas = document.getElementById("board");
    ctx = canvas.getContext("2d");

    initSparks();

    function init() {
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("mouseout", onMouseOut);

        canvas.addEventListener("touchstart", onTouchStart, false);
        canvas.addEventListener("touchend", onTouchEnd, false);
        canvas.addEventListener("touchcancel", onTouchCancel, false);
        canvas.addEventListener("touchmove", onTouchMove, false);

        for (var i = 0; i < level.columns; i++) {
            level.tiles[i] = [];
            for (var j = 0; j < level.rows; j++) {
                // Define a tile type and a shift parameter for animation
                level.tiles[i][j] = {type: 0, shift: 0}
            }
        }

        newGame();
        main(0);
    }

    function main(tframe) {
        window.requestAnimationFrame(main);

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;

        drawHeader();
        update(tframe);
        drawScores();
        drawBoard();
        render();

        updateBolt();
        renderBolt();

        if(days_counter > 10){
            days_counter = 0;
            was_lucky = false;
            current_time++;
            if(current_time >= time.length){
                current_time = 0;
            }
        }
        /*if(debug){
         ctx.font = "14px Verdana";
         ctx.fillStyle = "#f00";
         ctx.fillText(debug, 50, 50);
         }*/
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
                    else if(level.tiles[currentmove.column1][currentmove.row1].type >= 7
                    ) {
                        gamestate = gamestates.resolve;
                        animationstate = animationstates.buster;
                        animationtime = 0;
                        doBuster(currentmove.column1, currentmove.row1);
                    } else if(level.tiles[currentmove.column2][currentmove.row2].type >= 7
                    ) {
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

            findMoves();
            findClusters();
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

    function doBuster(column, row) {
        buster_victims = [];
        var type = level.tiles[column][row].type;
        if(icons[type] == "hb"){
            console.log("HAPPY BIRTHDAY!" + column + ";" + row);
            buster = {"type" : "hb", "column" : column, "row" : row};
            for (var i=column-1; i<=column+1; i++){
                for (var j=row-1; j<=row+1; j++){
                    if(i>= 0 && i<8 && j>=0 && j<8){
                        buster_victims.push({"column" : i, "row" : j, "type": level.tiles[i][j].type});
                    }
                }
            }
        } else if(icons[type] == "halloween"){
            console.log("HAPPY HALLOWEEN!" + column + ";" + row);
            buster = {"type" : "halloween", "column" : column, "row" : row};

            var buster_coord = getTileCoordinate(column, row, 0, 0);
            tilebolt(buster_coord);
            buster_victims.push({"column" : column, "row" : row, "type": type});
            for (var i = 0; i < level.columns; i++) {
                for (var j = 0; j < level.rows; j++) {
                    if(level.tiles[i][j].type < 3){ // all harry's items will die
                        buster_victims.push({"column" : i, "row" : j, "type": level.tiles[i][j].type});
                    }
                }
            }
        } else if(icons[type] == "stval"){
            console.log("HAPPY ST VALENTINE!" + column + ";" + row);
            buster = {"type" : "stval", "column" : column, "row" : row};

            var buster_coord = getTileCoordinate(column, row, 0, 0);
            tilebolt(buster_coord);
            buster_victims.push({"column" : column, "row" : row, "type": type});
            for (var i = 0; i < level.columns; i++) {
                for (var j = 0; j < level.rows; j++) {
                    if(level.tiles[i][j].type > 2 && level.tiles[i][j].type < 6){ // all tom's items will die
                        buster_victims.push({"column" : i, "row" : j, "type": level.tiles[i][j].type});
                    }
                }
            }
        }
    }

    function updateFps(dt) {
        if (fpstime > 0.25) {
            // Calculate fps
            fps = Math.round(framecount / fpstime);

            // Reset time and framecount
            fpstime = 0;
            framecount = 0;
        }

        // Increase time and framecount
        fpstime += dt;
        framecount++;
    }

    function newGame() {
        scores.harry = scores.tom = scores.nobody = 0;

        gamestate = gamestates.ready;

        // Reset game over
        gameover = false;

        createLevel();

        // Find initial clusters and moves
        findMoves();
        findClusters();
    }

    function createLevel() {
        var done = false;

        // Keep generating levels until it is correct
        while (!done) {
            for (var i = 0; i < level.columns; i++) {
                for (var j = 0; j < level.rows; j++) {
                    level.tiles[i][j].type = getRandomTile();
                }
            }

            resolveClusters();
            findMoves();

            // Done when there is a valid move
            if (moves.length > 0) {
                done = true;
            }
        }
    }

    function getRandomTile() {
        var lucky = Math.floor(Math.random() * (was_lucky ? 120 : 80));
        if(lucky == 1) {
            was_lucky = true;
            return icons.indexOf(time[current_time].type);
        }

        return Math.floor(Math.random() * 7); //icons.length
    }

    // Remove clusters and insert tiles
    function resolveClusters() {
        findClusters();

        // While there are clusters left
        while (clusters.length > 0) {
            removeClustersAndStartShiftingAnimation();
            shiftTiles();
            findClusters();
        }
    }

    function findClusters() {
        clusters = [];

        // Find horizontal clusters
        for (var j = 0; j < level.rows; j++) {
            // Start with a single tile, cluster of 1
            var matchlength = 1;
            for (var i = 0; i < level.columns; i++) {
                var checkcluster = false;

                if (i == level.columns - 1) {
                    // Last tile
                    checkcluster = true;
                } else {
                    // Check the type of the next tile
                    if (level.tiles[i][j].type == level.tiles[i + 1][j].type &&
                        level.tiles[i][j].type != -1) {
                        // Same type as the previous tile, increase matchlength
                        matchlength += 1;
                    } else {
                        // Different type
                        checkcluster = true;
                    }
                }

                // Check if there was a cluster
                if (checkcluster) {
                    if (matchlength >= 3) {
                        // Found a horizontal cluster
                        clusters.push(
                            {
                                column: i + 1 - matchlength,
                                row: j,
                                length: matchlength,
                                horizontal: true,
                                type: level.tiles[i][j].type
                            });
                    }

                    matchlength = 1;
                }
            }
        }

        // Find vertical clusters
        for (var i = 0; i < level.columns; i++) {
            // Start with a single tile, cluster of 1
            var matchlength = 1;
            for (var j = 0; j < level.rows; j++) {
                var checkcluster = false;

                if (j == level.rows - 1) {
                    // Last tile
                    checkcluster = true;
                } else {
                    // Check the type of the next tile
                    if (level.tiles[i][j].type == level.tiles[i][j + 1].type &&
                        level.tiles[i][j].type != -1) {
                        // Same type as the previous tile, increase matchlength
                        matchlength += 1;
                    } else {
                        // Different type
                        checkcluster = true;
                    }
                }

                // Check if there was a cluster
                if (checkcluster) {
                    if (matchlength >= 3) {
                        // Found a vertical cluster
                        clusters.push(
                            {
                                column: i,
                                row: j + 1 - matchlength,
                                length: matchlength,
                                horizontal: false,
                                type: level.tiles[i][j].type
                            });
                    }

                    matchlength = 1;
                }
            }
        }
    }

    function findMoves() {
        // Reset moves
        moves = [];

        // Check horizontal swaps
        for (var j = 0; j < level.rows; j++) {
            for (var i = 0; i < level.columns - 1; i++) {
                // Swap, find clusters and swap back
                swap(i, j, i + 1, j);
                findClusters();
                swap(i, j, i + 1, j);

                // Check if the swap made a cluster
                if (clusters.length > 0) {
                    // Found a move
                    moves.push({column1: i, row1: j, column2: i + 1, row2: j});
                }
            }
        }

        // Check vertical swaps
        for (var i = 0; i < level.columns; i++) {
            for (var j = 0; j < level.rows - 1; j++) {
                // Swap, find clusters and swap back
                swap(i, j, i, j + 1);
                findClusters();
                swap(i, j, i, j + 1);

                // Check if the swap made a cluster
                if (clusters.length > 0) {
                    // Found a move
                    moves.push({column1: i, row1: j, column2: i, row2: j + 1});
                }
            }
        }

        // Reset clusters
        clusters = []
    }

    // Loop over the cluster tiles and execute a function
    function loopClusters(func) {
        for (var i = 0; i < clusters.length; i++) {
            //  { column, row, length, horizontal }
            var cluster = clusters[i];
            var coffset = 0;
            var roffset = 0;
            for (var j = 0; j < cluster.length; j++) {
                func(i, cluster.column + coffset, cluster.row + roffset, cluster);

                if (cluster.horizontal) {
                    coffset++;
                } else {
                    roffset++;
                }
            }
        }
    }

    function removeClustersAndStartShiftingAnimation() {
        // Change the type of the tiles to -1, indicating a removed tile
        loopClusters(function (index, column, row, cluster) {
            level.tiles[column][row].type = -1;
        });

        // Calculate how much a tile should be shifted downwards
        for (var i = 0; i < level.columns; i++) {
            var shift = 0;
            for (var j = level.rows - 1; j >= 0; j--) {
                // Loop from bottom to top
                if (level.tiles[i][j].type == -1) {
                    // Tile is removed, increase shift
                    shift++;
                    level.tiles[i][j].shift = 0;
                } else {
                    // Set the shift
                    level.tiles[i][j].shift = shift;
                }
            }
        }
    }

    // Shift tiles and insert new tiles
    function shiftTiles() {
        for (var i = 0; i < level.columns; i++) {
            for (var j = level.rows - 1; j >= 0; j--) {
                // Loop from bottom to top
                if (level.tiles[i][j].type == -1) {
                    // Insert new random tile
                    level.tiles[i][j].type = getRandomTile();
                } else {
                    // Swap tile to shift it
                    var shift = level.tiles[i][j].shift;
                    if (shift > 0) {
                        swap(i, j, i, j + shift)
                    }
                }

                // Reset shift
                level.tiles[i][j].shift = 0;
            }
        }
    }

    // Get the tile under the mouse
    function getMouseTile(pos) {
        // Calculate the index of the tile
        var tx = Math.floor((pos.x - level.x) / level.tilewidth);
        var ty = Math.floor((pos.y - level.y) / level.tileheight);

        // Check if the tile is valid
        if (tx >= 0 && tx < level.columns && ty >= 0 && ty < level.rows) {
            // Tile is valid
            return {
                valid: true,
                x: tx,
                y: ty
            };
        }

        // No valid tile
        return {valid: false, x: 0, y: 0};
    }

    function canSwap(x1, y1, x2, y2) {
        // Check if the tile is a direct neighbor of the selected tile
        if ((Math.abs(x1 - x2) == 1 && y1 == y2) ||
            (Math.abs(y1 - y2) == 1 && x1 == x2)) {
            return true;
        }

        return false;
    }

    function swap(x1, y1, x2, y2) {
        var typeswap = level.tiles[x1][y1].type;
        level.tiles[x1][y1].type = level.tiles[x2][y2].type;
        level.tiles[x2][y2].type = typeswap;
    }

    function mouseSwap(c1, r1, c2, r2) {
        // Save the current move
        currentmove = {column1: c1, row1: r1, column2: c2, row2: r2};

        // Deselect
        level.selectedtile.selected = false;

        // Start animation
        animationstate = animationstates.swapTiles;
        animationtime = 0;
        gamestate = gamestates.resolve;
    }

    function onTouchStart(evt) {
        var pos = getTouchPos(canvas, evt);
        var mt = getMouseTile(pos);

        if (mt.valid) {
            level.selectedtile.column = mt.x;
            level.selectedtile.row = mt.y;
            level.selectedtile.selected = true;
        }
    }

    function onTouchEnd(e) {
        var pos = getTouchPos(canvas, e);
        var mt = getMouseTile(pos);

        if (mt.valid) {
            checkMoving(mt, true);
        }
        start = undefined;
    }

    function onTouchCancel(e) {
        if (start) {
            start = undefined;
            alert("cancel");
        }
    }

    function onTouchMove(e) {
        var pos = getTouchPos(canvas, e);
        var mt = getMouseTile(pos);

        if (mt.valid) {
            checkMoving(mt, false);
        }
    }

    function onMouseMove(e) {
        var pos = getMousePos(canvas, e);

        if (drag && level.selectedtile.selected) {
            mt = getMouseTile(pos);
            if (mt.valid) {
                checkMoving(mt, false);
            }
        }
    }

    function checkMoving(endTile, endOfGesture) {
        if (level.selectedtile.selected) {
            if (endTile.x == level.selectedtile.column && endTile.y == level.selectedtile.row && endOfGesture) {
                // Same tile selected, deselect
                level.selectedtile.selected = false;
                drag = true;
                return false;
            } else if (canSwap(endTile.x, endTile.y, level.selectedtile.column, level.selectedtile.row)) {
                mouseSwap(endTile.x, endTile.y, level.selectedtile.column, level.selectedtile.row);
                return true;
            }
        }
    }

    function onMouseDown(e) {
        // Get the mouse position
        var pos = getMousePos(canvas, e);

        // Start dragging
        if (!drag) {
            mt = getMouseTile(pos);
            if (mt.valid) {
                var swapped = checkMoving(mt, true);

                if (!swapped) {
                    level.selectedtile.column = mt.x;
                    level.selectedtile.row = mt.y;
                    level.selectedtile.selected = true;
                }
            } else {
                level.selectedtile.selected = false;
            }

            drag = true;
        }

        // Check if a button was clicked
        for (var i = 0; i < buttons.length; i++) {
            if (pos.x >= buttons[i].x && pos.x < buttons[i].x + buttons[i].width &&
                pos.y >= buttons[i].y && pos.y < buttons[i].y + buttons[i].height) {

                // Button i was clicked
                if (i == 0) {
                    // New Game
                    buttons[0].pressed = true;
                    newGame();
                    bolt(e);
                } else if (gameover && i == 1) {
                   // love = true;
                } else if (gameover && i == 2) {
                   // death = true;
                } else if (i == 3) {
                    //gameover = true;
                    //win = true;
                }
            }
        }
    }

    function bolt(e) {
        const pos = getMousePos(canvas, e);
        thunder.push(new Thunder({
            x: pos.x,
            y: pos.y,
            color: "#00ff11"//'#32ff95'
        }));
        particles.push(new Particles({
            x: pos.x,
            y: pos.y
        }));
    }

    function onMouseUp(e) {
        // Reset dragging
        drag = false;
        buttons[0].pressed = false;
    }

    function onMouseOut(e) {
        // Reset dragging
        drag = false;
        buttons[0].pressed = false;
    }

    // Get the mouse position
    function getMousePos(canvas, e) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.round(
                (e.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
            y: Math.round(
                (e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
        };
    }

    // Get the mouse position
    function getTouchPos(canvas, e) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.round(
                (e.changedTouches[0].pageX - rect.left) / (rect.right - rect.left)
                * canvas.width),
            y: Math.round(
                (e.changedTouches[0].pageY - rect.top) / (rect.bottom - rect.top)
                * canvas.height)
        };
    }

    // Call init to start the game
    init();
};