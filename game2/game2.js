var canvas, ctx;

// Level object
var level = {
    x: 55,         // X position
    y: 380,         // Y position
    columns: 8,     // Number of tile columns
    rows: 8,        // Number of tile rows
    tilewidth: 70,  // Visual width of a tile
    tileheight: 70, // Visual height of a tile
    tiles: [],      // The two-dimensional tile array
    selectedtile: {selected: false, column: 0, row: 0}
};

// Score
var horcruxes = [
    {type: "ring", value: 0},
    {type: "diary", value: 0},
    {type: "locket", value: 0},
    {type: "cup", value: 0},
    {type: "diadem", value: 0},
    {type: "snake", value: 0},
    {type: "scar", value: 0}
];
var max_horchrux_score = 3;

var buttons = [
    {x: 276, y: 204, width: 123, height: 35, text: "New Game", pressed: false},
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
var moves = [];     // { column1, row1, column2, row2 }

// Current move
var currentmove = {column1: 0, row1: 0, column2: 0, row2: 0};

// Game states
var gamestates = {init: 0, ready: 1, resolve: 2};
var gamestate = gamestates.init;

// Animation variables
var animationstates = {searchClusters:0, shiftTiles:1};
var animationstate = animationstates.searchClusters;
var animationtime = 0;
var animationtimetotal = 0.3;

// Game Over
var gameover = false;
var love = false;
var death = false;
var win = false;

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
        /*if(debug){
         ctx.font = "14px Verdana";
         ctx.fillStyle = "#f00";
         ctx.fillText(debug, 50, 50);
         }*/
    }

    function addScore(i) {
        if (horcruxes[i].value < max_horchrux_score) {
            // add if not max
            horcruxes[i].value = horcruxes[i].value + 1;

            // check end of the game
            gameover = true;
            for (var j = 0; j < horcruxes.length; j++) {
                if (horcruxes[j].value < max_horchrux_score) {
                    gameover = false;
                }
            }
            if (gameover) {
                win = true;
            }
        }
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
                win = false;
            }

        } else if (gamestate == gamestates.resolve) {
            // Game is busy resolving and animating clusters
            animationtime += dt;

            if (animationstate == animationstates.searchClusters) {
                if (animationtime > animationtimetotal) {
                    findClusters();

                    if (clusters.length > 0) {
                        // Add points to the score
                        for (var i = 0; i < clusters.length; i++) {
                            // Add extra points for longer clusters
                            //score += 100 * (clusters[i].length - 2);
                            addScore(clusters[i].type);
                        }

                        removeClusters();
                        animationstate = animationstates.shiftTiles;
                    } else {
                        gamestate = gamestates.ready;
                    }
                    animationtime = 0;
                }
            } else if (animationstate == 1) {
                // Tiles need to be shifted
                if (animationtime > animationtimetotal) {
                    shiftTiles();

                    animationstate = animationstates.searchClusters;
                    animationtime = 0;

                    findClusters();
                    if (clusters.length <= 0) {
                        gamestate = gamestates.ready;
                    }
                }
            } else if (animationstate == 2) {
            } else if (animationstate == 3) {
                // Rewind swapping animation
                if (animationtime > animationtimetotal) {
                    // Invalid swap, swap back
                    swap(currentmove.column1, currentmove.row1, currentmove.column2,
                        currentmove.row2);

                    // Animation complete
                    gamestate = gamestates.ready;
                }
            }

            findMoves();
            findClusters();
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
        for (var i = 0; i < horcruxes.length; i++) {
            horcruxes[i].value = 0;
        }

        gamestate = gamestates.ready;

        // Reset game over
        gameover = false;
        love = false;
        death = false;
        win = false;

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
        return Math.floor(Math.random() * horcruxes.length);
    }

    // Remove clusters and insert tiles
    function resolveClusters() {
        findClusters();

        // While there are clusters left
        while (clusters.length > 0) {
            removeClusters();
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

    // Find available moves
    function findMoves() {
        // Reset moves
        moves = []

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

    // Remove the clusters
    function removeClusters() {
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
        // Shift tiles
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
        return {
            valid: false,
            x: 0,
            y: 0
        };
    }

    // Check if two tiles can be swapped
    function canSwap(x1, y1, x2, y2) {
        // Check if the tile is a direct neighbor of the selected tile
        if ((Math.abs(x1 - x2) == 1 && y1 == y2) ||
            (Math.abs(y1 - y2) == 1 && x1 == x2)) {
            return true;
        }

        return false;
    }

    // Swap two tiles in the level
    function swap(x1, y1, x2, y2) {
        var typeswap = level.tiles[x1][y1].type;
        level.tiles[x1][y1].type = level.tiles[x2][y2].type;
        level.tiles[x2][y2].type = typeswap;
    }

    // Swap two tiles as a player action
    function mouseSwap(c1, r1, c2, r2) {
        // Save the current move
        currentmove = {column1: c1, row1: r1, column2: c2, row2: r2};

        // Deselect
        level.selectedtile.selected = false;

        // Start animation
        animationstate = 2;
        animationtime = 0;
        gamestate = gamestates.resolve;
    }

    var debug = "";

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
            // Get the tile under the mouse
            mt = getMouseTile(pos);

            if (mt.valid) {
                // Valid tile
                var swapped = checkMoving(mt, true);

                if (!swapped) {
                    // Set the new selected tile
                    level.selectedtile.column = mt.x;
                    level.selectedtile.row = mt.y;
                    level.selectedtile.selected = true;
                }
            } else {
                // Invalid tile
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
                    love = true;
                } else if (gameover && i == 2) {
                    death = true;
                } else if (i == 3) {
                    //gameover = true;
                    //win = true;
                }
            }
        }
    }

    function bolt(e) {
        const x = e.clientX;
        const y = e.clientY;
        thunder.push(new Thunder({
            x: x,
            y: y,
            color: "#00ff11"//'#32ff95'
        }));
        particles.push(new Particles({
            x: x,
            y: y
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