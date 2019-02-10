
let bkgr_color = "#1E1933";
let red_color = "#FC921D";
let board_color = "#341935";

let horcrux_w = 80;
let horcrux_h = 80;
let horcrux_x = 55;
let horcrux_y = 280;


function drawHeader() {
    // Draw background and a border
    ctx.fillStyle = bkgr_color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var header = document.getElementById("header");
    ctx.drawImage(header, 0, 0, 680, 276);

    if (buttons[0].pressed) {
        var doitonbtn = document.getElementById("doiton");
        ctx.drawImage(doitonbtn, buttons[0].x, buttons[0].y, buttons[0].width, buttons[0].height);
    } else {
        ctx.fillStyle = "#b76718";
        ctx.fillRect(buttons[0].x, buttons[0].y, 1, buttons[0].height);
        ctx.fillRect(buttons[0].x + buttons[0].width, buttons[0].y, 1, buttons[0].height);
        ctx.fillRect(buttons[0].x, buttons[0].y, buttons[0].width, 1);
        ctx.fillRect(buttons[0].x, buttons[0].y + buttons[0].height, buttons[0].width, 1);
    }

    //drawButton("Win", buttons[3].x, buttons[3].y, buttons[3].width, buttons[3].height);
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
        var levelwidth = level.tilewidth * level.rows;
        var levelheight = level.tileheight * level.columns;

        if (love) {
            var loveImg = document.getElementById("love");
            ctx.drawImage(loveImg, level.x + 2, level.y + 2, levelwidth - 2, levelheight - 2);
        }
        else if (death) {
            var deathImg = document.getElementById("death");
            ctx.drawImage(deathImg, level.x + 2, level.y + 2, levelwidth - 2, levelheight - 2);
        }
        else {

            ctx.fillStyle = red_color; //(win)? red_color : "#44aa44";
            ctx.globalAlpha = 0.2;
            ctx.fillRect(level.x, level.y, levelwidth, levelheight);
            ctx.globalAlpha = 1.0;

            ctx.fillStyle = bkgr_color;
            ctx.fillRect(level.x, buttons[1].y - 100, levelwidth + 4, 170);
            ctx.fillStyle = red_color;
            ctx.font = "20px Verdana";

            if (win) {
                drawCenterText("Поздравляем, вы собрали Волдеморта!", level.x,
                    buttons[1].y - 60, levelwidth);
                drawCenterText("Что делать?", level.x, buttons[1].y - 20,
                    levelwidth);
                drawButton("Любить", buttons[1].x, buttons[1].y, buttons[1].width,
                    buttons[1].height);
                drawButton("Прибить", buttons[2].x, buttons[2].y, buttons[2].width,
                    buttons[2].height);
            }
            else {
                drawCenterText("У вас не вышло собрать все крестражи.", level.x,
                    buttons[1].y - 40, levelwidth);
                drawCenterText("Попробуйте еще раз!", level.x, buttons[1].y + 10,
                    levelwidth);
            }
        }
    }

}

function drawBoard() {
    var levelwidth = level.columns * level.tilewidth;
    var levelheight = level.rows * level.tileheight;
    var borderwidth = 1;

    ctx.fillStyle = board_color;
    ctx.fillRect(level.x, level.y, levelwidth, levelheight);

    // board borders
    ctx.fillStyle = red_color;//"#e8eaec";

    for (var i = 0; i <= level.columns; i++) {
        // vertical
        ctx.fillRect(level.x + i * level.tilewidth, level.y, borderwidth,
            levelheight);

        //horizontal
        ctx.fillRect(level.x, level.y + i * level.tileheight, levelwidth,
            borderwidth);
    }
    ctx.fillRect(level.x, level.y, borderwidth, levelheight);
    ctx.fillRect(level.x + level.columns * level.tilewidth, level.y,
        borderwidth, levelheight);
    // horizontal
    ctx.fillRect(level.x, level.y, levelwidth, borderwidth);
    ctx.fillRect(level.x, level.y + level.rows * level.tileheight,
        levelwidth, borderwidth);

    // scores borders
    // vertical
    ctx.fillRect(horcrux_x, horcrux_y, borderwidth, horcrux_h);
    ctx.fillRect(horcrux_x + horcrux_w * horcruxes.length, horcrux_y,
        borderwidth, horcrux_h);
    // horizontal
    ctx.fillRect(horcrux_x, horcrux_y, horcrux_w * horcruxes.length,
        borderwidth);
    ctx.fillRect(horcrux_x, horcrux_y + horcrux_h,
        horcrux_w * horcruxes.length, borderwidth);
}

// Render clusters
function renderClusters() {
    for (var i = 0; i < clusters.length; i++) {
        // Calculate the tile coordinates
        var coord = getTileCoordinate(clusters[i].column, clusters[i].row, 0, 0);


        if (clusters[i].horizontal) {
            // Draw a horizontal line
            for (var h=0; h<clusters[i].length; h++){
                spark(coord.tilex + level.tilewidth/2 + h*level.tilewidth, coord.tiley + level.tileheight/2 - 4);
            }
        } else {
            // Draw a vertical line
            for (var v=0; v<clusters[i].length; v++){
                spark(coord.tilex + level.tilewidth/2 - 4, coord.tiley + level.tileheight/2 + v*level.tileheight);
            }
        }
    }
}

// Draw scores
function drawScores() {
    ctx.fillStyle = board_color;
    ctx.fillRect(horcrux_x, horcrux_y, horcrux_w*horcruxes.length, horcrux_h);

    var images = [];
    for (var i = 0; i < horcruxes.length; i++) {
        var image = new Image(horcrux_w, horcrux_h);
        image.src = "img/top/" + horcruxes[i].type + (horcruxes[i].value+1) + ".png";
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        image.onload = ctx.drawImage(image, horcrux_x + i * horcrux_w,
            horcrux_y, horcrux_w, horcrux_h);
    }
}

function drawButton(text, x, y, w, h) {
    ctx.fillStyle = bkgr_color;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = red_color;
    ctx.font = "18px Verdana";
    var textdim = ctx.measureText(text);
    ctx.fillText(text, x + (w - textdim.width) / 2, y + 30);
}

function drawSelectedTile(x, y, type_id) {
    drawTileWithType(x,y,type_id);
}

function drawTileWithType(x, y, type_id) {
    var tile = document.getElementById(horcruxes[type_id].type);
    ctx.drawImage(tile, x + 2, y + 2, level.tilewidth - 4, level.tileheight - 4);
}

// Draw text that is centered
function drawCenterText(text, x, y, width) {
    var textdim = ctx.measureText(text);
    ctx.fillText(text, x + (width - textdim.width) / 2, y);
}

// Get the tile coordinate
function getTileCoordinate(column, row, columnoffset, rowoffset) {
    var tilex = level.x + (column + columnoffset) * level.tilewidth;
    var tiley = level.y + (row + rowoffset) * level.tileheight;
    return {tilex: tilex, tiley: tiley};
}

// Render tiles
function renderTiles() {
    for (var i = 0; i < level.columns; i++) {
        for (var j = 0; j < level.rows; j++) {
            // Get the shift of the tile for animation
            var shift = level.tiles[i][j].shift;

            // Calculate the tile coordinates
            var coord = getTileCoordinate(i, j, 0,
                (animationtime / animationtimetotal) * shift);

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
    if (gamestate == gamestates.resolve && (animationstate == 2
        || animationstate == 3)) {
        // Calculate the x and y shift
        var shiftx = currentmove.column2 - currentmove.column1;
        var shifty = currentmove.row2 - currentmove.row1;

        // First tile
        var coord1shift = getTileCoordinate(currentmove.column1, currentmove.row1,
            (animationtime / animationtimetotal) * shiftx,
            (animationtime / animationtimetotal) * shifty);

        // Second tile
        var coord2shift = getTileCoordinate(currentmove.column2, currentmove.row2,
            (animationtime / animationtimetotal) * -shiftx,
            (animationtime / animationtimetotal) * -shifty);

        // Change the order, depending on the animation state
        if (animationstate == 2) {
            // Draw the tiles
            drawTileWithType(coord1shift.tilex, coord1shift.tiley,
                level.tiles[currentmove.column1][currentmove.row1].type);
            drawTileWithType(coord2shift.tilex, coord2shift.tiley,
                level.tiles[currentmove.column2][currentmove.row2].type);
        } else {
            // Draw the tiles
            drawTileWithType(coord2shift.tilex, coord2shift.tiley,
                level.tiles[currentmove.column2][currentmove.row2].type);
            drawTileWithType(coord1shift.tilex, coord1shift.tiley,
                level.tiles[currentmove.column1][currentmove.row1].type);
        }
    }
}

function spark(x, y) {
    particles.push(new Particles({
        x: x,
        y: y
    }));
}