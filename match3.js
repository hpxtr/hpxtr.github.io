// ------------------------------------------------------------------------
// How To Make A Match-3 Game With HTML5 Canvas
// Copyright (c) 2015 Rembound.com
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see http://www.gnu.org/licenses/.
//
// http://rembound.com/articles/how-to-make-a-match3-game-with-html5-canvas
// ------------------------------------------------------------------------

// The function gets called when the window is fully loaded
window.onload = function () {
    // Get the canvas and context
    var canvas = document.getElementById("board");
    var context = canvas.getContext("2d");

    // Timing and frames per second
    var lastframe = 0;
    var fpstime = 0;
    var framecount = 0;
    var fps = 0;

    // Mouse dragging
    var drag = false;

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

    // All of the different tile colors in RGB
    var tilecolors = [[255, 128, 128],
        [128, 255, 128],
        [128, 128, 255],
        [255, 255, 128],
        [255, 128, 255],
        [128, 255, 255],
        [255, 255, 255]];

    // Clusters and moves that were found
    var clusters = [];  // { column, row, length, horizontal }
    var moves = [];     // { column1, row1, column2, row2 }

    // Current move
    var currentmove = {column1: 0, row1: 0, column2: 0, row2: 0};

    // Game states
    var gamestates = {init: 0, ready: 1, resolve: 2};
    var gamestate = gamestates.init;

    var horcrux_w = 80;
    var horcrux_h = 80;
    var horcrux_x = 55;
    var horcrux_y = 270;
    var max_horchrux_score = 3;

    // Score
    var horcruxes = [
        {type: "ring", value: 0, img: "img/ring.png", selected: "", probability: 20},
        {type: "diary", value: 0, img: "img/diary.png", selected: "diary_s.png", probability: 17},
        {type: "locket", value: 0, img: "img/locket.png", selected: "", probability: 15},
        {type: "cup", value: 0, img: "img/cup.png", selected: "", probability: 14},
        {type: "diadem", value: 0, img: "img/diadem.png", selected: "", probability: 13},
        {type: "snake", value: 0, img: "img/snake.png", selected: "", probability: 12},
        {type: "scar", value: 0, img: "img/scar.png", selected: "", probability: 10}
    ];

    // Animation variables
    var animationstate = 0;
    var animationtime = 0;
    var animationtimetotal = 0.3;

    // Game Over
    var gameover = false;
    var love = false;
    var death = false;
    var win = true;

    // Gui buttons
    var buttons = [
        {x: 300, y: 200, width: 75, height: 40, text: "New Game"},
        {x: level.x + 80, y: level.y + 200, width: 150, height: 50, text: "Love"},
        {x: level.x + 320, y: level.y + 200, width: 150, height: 50, text: "Kill"},
        {x: 370, y: 200, width: 75, height: 40, text: "Win"}
    ];

    // Initialize the game
    function init() {
        // Add mouse events
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("mouseout", onMouseOut);

        canvas.addEventListener("touchstart", onTouchStart, false);
        canvas.addEventListener("touchend", onTouchEnd, false);
        canvas.addEventListener("touchcancel", onTouchCancel, false);
        canvas.addEventListener("touchmove", onTouchMove, false);

        // Initialize the two-dimensional tile array
        for (var i = 0; i < level.columns; i++) {
            level.tiles[i] = [];
            for (var j = 0; j < level.rows; j++) {
                // Define a tile type and a shift parameter for animation
                level.tiles[i][j] = {type: 0, shift: 0}
            }
        }

        // New game
        newGame();

        // Enter main loop
        main(0);
    }

    // Main loop
    function main(tframe) {
        // Request animation frames
        window.requestAnimationFrame(main);

        // Update and render the game

        // Draw background
        drawHeader();

        update(tframe);
        drawScores();
        drawBoard();
        render();
        if(debug){
            context.font = "24px Verdana";
            context.fillStyle = "#f00";
            context.fillText(debug, 50, 50);
        }
    }

    function drawHeader() {
        // Draw background and a border
        context.fillStyle = "#261a2f";
        context.fillRect(0, 0, canvas.width, canvas.height);

        var header = document.getElementById("header");
        context.drawImage(header, 0, 0, 680, 307);

        var newGame = new Image(300, 160);
        newGame.src = "img/button.png";
        newGame.onload = context.drawImage(newGame, buttons[0].x, buttons[0].y, buttons[0].width, buttons[0].height);

        drawButton("Win", buttons[3].x, buttons[3].y, buttons[3].width, buttons[3].height);
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

            if (animationstate == 0) {
                // Clusters need to be found and removed
                if (animationtime > animationtimetotal) {
                    // Find clusters
                    findClusters();

                    if (clusters.length > 0) {
                        // Add points to the score
                        for (var i = 0; i < clusters.length; i++) {
                            // Add extra points for longer clusters
                            //score += 100 * (clusters[i].length - 2);
                            addScore(clusters[i].type);
                        }

                        // Clusters found, remove them
                        removeClusters();

                        // Tiles need to be shifted
                        animationstate = 1;
                    } else {
                        // No clusters found, animation complete
                        gamestate = gamestates.ready;
                    }
                    animationtime = 0;
                }
            } else if (animationstate == 1) {
                // Tiles need to be shifted
                if (animationtime > animationtimetotal) {
                    // Shift tiles
                    shiftTiles();

                    // New clusters need to be found
                    animationstate = 0;
                    animationtime = 0;

                    // Check if there are new clusters
                    findClusters();
                    if (clusters.length <= 0) {
                        // Animation complete
                        gamestate = gamestates.ready;
                    }
                }
            } else if (animationstate == 2) {
                // Swapping tiles animation
                if (animationtime > animationtimetotal) {
                    // Swap the tiles
                    swap(currentmove.column1, currentmove.row1, currentmove.column2, currentmove.row2);

                    // Check if the swap made a cluster
                    findClusters();
                    if (clusters.length > 0) {
                        // Valid swap, found one or more clusters
                        // Prepare animation states
                        animationstate = 0;
                        animationtime = 0;
                        gamestate = gamestates.resolve;
                    } else {
                        // Invalid swap, Rewind swapping animation
                        animationstate = 3;
                        animationtime = 0;
                    }

                    // Update moves and clusters
                    findMoves();
                    findClusters();
                }
            } else if (animationstate == 3) {
                // Rewind swapping animation
                if (animationtime > animationtimetotal) {
                    // Invalid swap, swap back
                    swap(currentmove.column1, currentmove.row1, currentmove.column2, currentmove.row2);

                    // Animation complete
                    gamestate = gamestates.ready;
                }
            }

            // Update moves and clusters
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

    // Draw text that is centered
    function drawCenterText(text, x, y, width) {
        var textdim = context.measureText(text);
        context.fillText(text, x + (width - textdim.width) / 2, y);
    }

    // Render the game
    function render() {

        // Render tiles
        renderTiles();

        // Render clusters
        renderClusters();

        // Render moves, when there are no clusters
        if (clusters.length <= 0 && gamestate == gamestates.ready) {
            //renderMoves();
        }

        // Game Over overlay
        if (gameover) {
            var levelwidth = level.tilewidth*level.rows;
            var levelheight = level.tileheight*level.columns;

            if(love){
                var loveImg = document.getElementById("love");
                context.drawImage(loveImg, level.x+2, level.y+2, levelwidth-2, levelheight-2);
            } else if(death){

            } else {
                context.fillStyle = "#FC921D";
                context.globalAlpha = 0.2;
                context.fillRect(level.x, level.y, levelwidth, levelheight);
                context.globalAlpha = 1.0;

                context.fillStyle = "#261a2f";
                context.fillRect(level.x, buttons[1].y - 100, levelwidth+4, 170);
                context.fillStyle = "#FC921D";
                context.font = "24px Verdana";
                if (win) {
                    drawCenterText("You picked up all horcruxes! ", level.x, buttons[1].y - 50, levelwidth);
                    drawButton("Love them", buttons[1].x, buttons[1].y, buttons[1].width, buttons[1].height);
                    drawButton("Kill them", buttons[2].x, buttons[2].y, buttons[2].width, buttons[2].height);
                } else {
                    drawCenterText("You missed horcrux and Harry died", level.x, level.y + levelheight / 2 - 20, levelwidth);
                }
            }
        }

    }

    function drawBoard() {
        var levelwidth = level.columns * level.tilewidth;
        var levelheight = level.rows * level.tileheight;

        // board borders
        context.fillStyle = "#FC921D";//"#e8eaec";

        for (var i=0; i<=level.columns; i++){
            // vertical
            context.fillRect(level.x + i*level.tilewidth, level.y, 2, levelheight);

            //horizontal
            context.fillRect(level.x, level.y + i*level.tileheight, levelwidth, 2);
        }
        context.fillRect(level.x, level.y, 2, levelheight);
        context.fillRect(level.x + level.columns*level.tilewidth, level.y, 2, levelheight);
        // horizontal
        context.fillRect(level.x, level.y, levelwidth, 2);
        context.fillRect(level.x, level.y + level.rows*level.tileheight, levelwidth, 2);

        // scores borders
        // vertical
        context.fillRect(horcrux_x, horcrux_y, 2, horcrux_h);
        context.fillRect(horcrux_x + horcrux_w*horcruxes.length, horcrux_y, 2, horcrux_h);
        // horizontal
        context.fillRect(horcrux_x, horcrux_y, horcrux_w*horcruxes.length, 2);
        context.fillRect(horcrux_x, horcrux_y + horcrux_h, horcrux_w*horcruxes.length, 2);
    }

    // Draw scores
    function drawScores() {
        var images = [];
        for (var i = 0; i < horcruxes.length; i++) {

            if(horcruxes[i].value > 0){
                var image = new Image(horcrux_w, horcrux_h);
                image.src = "img/top/"+ horcruxes[i].type + horcruxes[i].value + ".png";
                context.imageSmoothingEnabled = false;
                context.webkitImageSmoothingEnabled = false;
                context.mozImageSmoothingEnabled = false;
                image.onload = context.drawImage(image, horcrux_x + i * horcrux_w, horcrux_y, horcrux_w, horcrux_h);
            }
        }
    }

    function drawButton(text, x, y, w, h) {
        // Draw button shape
        context.fillStyle = "#261a2f";
        context.fillRect(x, y, w, h);

        // Draw button text
        context.fillStyle = "#FC921D";
        context.font = "18px Verdana";
        var textdim = context.measureText(text);
        context.fillText(text, x + (w - textdim.width) / 2, y + 30);
    }

    // Render tiles
    function renderTiles() {
        for (var i = 0; i < level.columns; i++) {
            for (var j = 0; j < level.rows; j++) {
                // Get the shift of the tile for animation
                var shift = level.tiles[i][j].shift;

                // Calculate the tile coordinates
                var coord = getTileCoordinate(i, j, 0, (animationtime / animationtimetotal) * shift);

                // Check if there is a tile present
                if (level.tiles[i][j].type >= 0) {

                    // Draw the tile using the color
                    drawTileWithType(coord.tilex, coord.tiley, level.tiles[i][j].type);
                }

                // Draw the selected tile
                if (level.selectedtile.selected) {
                    if (level.selectedtile.column == i && level.selectedtile.row == j) {
                        // Draw a red tile
                        drawSelectedTile(coord.tilex, coord.tiley, level.tiles[i][j].type);
                    }
                }
            }
        }

        // Render the swap animation
        if (gamestate == gamestates.resolve && (animationstate == 2 || animationstate == 3)) {
            // Calculate the x and y shift
            var shiftx = currentmove.column2 - currentmove.column1;
            var shifty = currentmove.row2 - currentmove.row1;

            // First tile
            var coord1shift = getTileCoordinate(currentmove.column1, currentmove.row1, (animationtime / animationtimetotal) * shiftx, (animationtime / animationtimetotal) * shifty);
            var col1 = tilecolors[level.tiles[currentmove.column1][currentmove.row1].type];

            // Second tile
            var coord2shift = getTileCoordinate(currentmove.column2, currentmove.row2, (animationtime / animationtimetotal) * -shiftx, (animationtime / animationtimetotal) * -shifty);
            var col2 = tilecolors[level.tiles[currentmove.column2][currentmove.row2].type];

            // Change the order, depending on the animation state
            if (animationstate == 2) {
                // Draw the tiles
                drawTileWithType(coord1shift.tilex, coord1shift.tiley, level.tiles[currentmove.column1][currentmove.row1].type);
                drawTileWithType(coord2shift.tilex, coord2shift.tiley, level.tiles[currentmove.column2][currentmove.row2].type);
            } else {
                // Draw the tiles
                drawTileWithType(coord2shift.tilex, coord2shift.tiley, level.tiles[currentmove.column2][currentmove.row2].type);
                drawTileWithType(coord1shift.tilex, coord1shift.tiley, level.tiles[currentmove.column1][currentmove.row1].type);
            }
        }
    }

    // Get the tile coordinate
    function getTileCoordinate(column, row, columnoffset, rowoffset) {
        var tilex = level.x + (column + columnoffset) * level.tilewidth;
        var tiley = level.y + (row + rowoffset) * level.tileheight;
        return {tilex: tilex, tiley: tiley};
    }

    function drawSelectedTile(x, y, type) {
        var image = new Image(level.tilewidth, level.tileheight);
        image.src = horcruxes[type].selected;
        image.onload = context.drawImage(image, x + 2, y + 2, level.tilewidth - 4, level.tileheight - 4);
    }

    function drawTileWithType(x, y, type_id) {
        var tile = document.getElementById(horcruxes[type_id].type);
        context.drawImage(tile, x+2, y+2, level.tilewidth - 4, level.tileheight - 4);
    }

    // Render clusters
    function renderClusters() {
        for (var i = 0; i < clusters.length; i++) {
            // Calculate the tile coordinates
            var coord = getTileCoordinate(clusters[i].column, clusters[i].row, 0, 0);

            if (clusters[i].horizontal) {
                // Draw a horizontal line
                //testLightning();
                //var light = createLightning(50, 150);
                //drawLightning(light, context);

                //context.fillStyle = "#00ff00";
                //context.fillRect(coord.tilex + level.tilewidth/2, coord.tiley + level.tileheight/2 - 4, (clusters[i].length - 1) * level.tilewidth, 8);
            } else {
                // Draw a vertical line
                //context.fillStyle = "#0000ff";
                //context.fillRect(coord.tilex + level.tilewidth/2 - 4, coord.tiley + level.tileheight/2, 8, (clusters[i].length - 1) * level.tileheight);
            }
        }
    }

    // Start a new game
    function newGame() {
        // Reset score
        for (var i=0; i<horcruxes.length; i++){
            horcruxes[i].value = 0;
        }

        // Set the gamestate to ready
        gamestate = gamestates.ready;

        // Reset game over
        gameover = false;
        love = false;
        death = false;

        // Create the level
        createLevel();

        // Find initial clusters and moves
        findMoves();
        findClusters();
    }

    // Create a random level
    function createLevel() {
        var done = false;

        // Keep generating levels until it is correct
        while (!done) {

            // Create a level with random tiles
            for (var i = 0; i < level.columns; i++) {
                for (var j = 0; j < level.rows; j++) {
                    level.tiles[i][j].type = getRandomTile();
                }
            }

            // Resolve the clusters
            resolveClusters();

            // Check if there are valid moves
            findMoves();

            // Done when there is a valid move
            if (moves.length > 0) {
                done = true;
            }
        }
    }

    // Get a random tile
    function getRandomTile() {
        //return Math.floor(Math.random() * tilecolors.length);
        var random = Math.floor(Math.random() * level.columns * level.rows);

        for (var i = 0; i < horcruxes.length; i++) {
            if (random < level.columns * level.rows * horcruxes[i].probability / 100) {
                return i;
            } else {
                random = random - level.columns * level.rows * horcruxes[i].probability / 100;
            }
        }
        return horcruxes.length;
    }

    // Remove clusters and insert tiles
    function resolveClusters() {
        // Check for clusters
        findClusters();

        // While there are clusters left
        while (clusters.length > 0) {

            // Remove clusters
            removeClusters();

            // Shift tiles
            shiftTiles();

            // Check if there are clusters left
            findClusters();
        }
    }

    // Find clusters in the level
    function findClusters() {
        // Reset clusters
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

    var start;
    var end;
    var debug = "";

    function onTouchStart(evt) {
        var pos = getTouchPos(canvas, evt);
        var mt = getMouseTile(pos);
        debug = "start: " + pos.x + "; " + pos.y + " = " + mt.x + "; " + mt.y + " " + mt.valid + ". \n";
        if(mt.valid){
            start = mt;
        }
    }

    function onTouchEnd(e) {
        var pos = getTouchPos(canvas, e);
        var mt = getMouseTile(pos);
        debug = debug + "end: " + pos.x + "; " + pos.y + " = " + mt.x + "; " + mt.y + " " + mt.valid + ". \n";
        if(mt.valid){
            if(start){
                debug = debug + "Can move!";
                // Check if the tiles can be swapped
                if (canSwap(mt.x, mt.y, start.x, start.y)) {
                    // Swap the tiles
                    mouseSwap(mt.x, mt.y, start.x, start.y);
                }
            }
        }
        start = undefined;
    }

    function onTouchCancel(e) {
        if(start){
            start = undefined;
            alert("cancel");
        }
    }

    function onTouchMove(e) {
        //alert("move");
    }

    // On mouse movement
    function onMouseMove(e) {
        // Get the mouse position
        var pos = getMousePos(canvas, e);

        // Check if we are dragging with a tile selected
        if (drag && level.selectedtile.selected) {
            // Get the tile under the mouse
            mt = getMouseTile(pos);
            if (mt.valid) {
                // Valid tile

                // Check if the tiles can be swapped
                if (canSwap(mt.x, mt.y, level.selectedtile.column, level.selectedtile.row)) {
                    // Swap the tiles
                    mouseSwap(mt.x, mt.y, level.selectedtile.column, level.selectedtile.row);
                }
            }
        }
    }

    // On mouse button click
    function onMouseDown(e) {
        // Get the mouse position
        var pos = getMousePos(canvas, e);

        // Start dragging
        if (!drag) {
            // Get the tile under the mouse
            mt = getMouseTile(pos);

            if (mt.valid) {
                // Valid tile
                var swapped = false;
                if (level.selectedtile.selected) {
                    if (mt.x == level.selectedtile.column && mt.y == level.selectedtile.row) {
                        // Same tile selected, deselect
                        level.selectedtile.selected = false;
                        drag = true;
                        return;
                    } else if (canSwap(mt.x, mt.y, level.selectedtile.column, level.selectedtile.row)) {
                        // Tiles can be swapped, swap the tiles
                        mouseSwap(mt.x, mt.y, level.selectedtile.column, level.selectedtile.row);
                        swapped = true;
                    }
                }

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

            // Start dragging
            drag = true;
        }

        // Check if a button was clicked
        for (var i = 0; i < buttons.length; i++) {
            if (pos.x >= buttons[i].x && pos.x < buttons[i].x + buttons[i].width &&
                pos.y >= buttons[i].y && pos.y < buttons[i].y + buttons[i].height) {

                // Button i was clicked
                if (i == 0) {
                    // New Game
                    newGame();
                } else if (i == 1) {
                    // Show Love
                    love = true;
                } else if (i == 2) {
                    // Show Death
                } else if (i == 3){
                    gameover = true;
                }
            }
        }
    }

    function onMouseUp(e) {
        // Reset dragging
        drag = false;
    }

    function onMouseOut(e) {
        // Reset dragging
        drag = false;
    }

    // Get the mouse position
    function getMousePos(canvas, e) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((e.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
            y: Math.round((e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
        };
    }

    // Get the mouse position
    function getTouchPos(canvas, e) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((e.changedTouches[0].pageX - rect.left) / (rect.right - rect.left) * canvas.width),
            y: Math.round((e.changedTouches[0].pageY - rect.top) / (rect.bottom - rect.top) * canvas.height)
        };
    }

    // Call init to start the game
    init();
};