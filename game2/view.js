
let font_color = "#373789";
let border_color = "#00ffff";
let undertext_color = "#f4ecc0";
let font = "HoboStd";

let score_x = 85;
let score_y = 275;

let calendar_x = 120;
let calendar_y = 120;

function drawHeader() {
    // Draw background and a border
    ctx.fillStyle = font_color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var cover = document.getElementById("cover");

    ctx.drawImage(cover, 0, 0, 638, 638*4150/2480);

    var start_btn = (buttons[0].pressed) ? document.getElementById("start_on") : document.getElementById("start");
    ctx.drawImage(start_btn, buttons[0].x, buttons[0].y, buttons[0].width, buttons[0].height);

    //ctx.fillStyle = undertext_color;
   // ctx.fillRect(calendar_x, calendar_y-33, 50, 88);

    ctx.font = "26px " + font;
    ctx.fillStyle = font_color;
    ctx.fillText(time[current_time].number, calendar_x, calendar_y);
    ctx.fillText(time[current_time].month, calendar_x, calendar_y+30);


    //drawButton("Win", buttons[3].x, buttons[3].y, buttons[3].width, buttons[3].height);
}

function render() {
    renderTiles();
    renderClusters();
    renderBusters();

    // Render moves, when there are no clusters
    if (clusters.length <= 0 && gamestate == gamestates.ready) {
        //renderMoves();
    }

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

            ctx.fillStyle = border_color; //(win)? border_color : "#44aa44";
            ctx.globalAlpha = 0.2;
            ctx.fillRect(level.x, level.y, levelwidth, levelheight);
            ctx.globalAlpha = 1.0;

            ctx.fillStyle = font_color;
            ctx.fillRect(level.x, buttons[1].y - 100, levelwidth + 4, 170);
            ctx.fillStyle = border_color;
            ctx.font = "20px " + font;

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

    //ctx.fillStyle = board_color;
    //ctx.fillRect(level.x, level.y, levelwidth, levelheight);

    // board borders
    ctx.fillStyle = border_color;//"#e8eaec";

    for (var i = 0; i <= level.columns; i++) {
        // vertical
        //ctx.fillRect(level.x + i * level.tilewidth, level.y, borderwidth, levelheight);

        //horizontal
        //ctx.fillRect(level.x, level.y + i * level.tileheight, levelwidth, borderwidth);
    }

    //ctx.fillRect(level.x, level.y, borderwidth, levelheight);
    //ctx.fillRect(level.x + level.columns * level.tilewidth, level.y, borderwidth, levelheight);
    // horizontal
    //ctx.fillRect(level.x, level.y, levelwidth, borderwidth);
    //ctx.fillRect(level.x, level.y + level.rows * level.tileheight, levelwidth, borderwidth);

}

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

function renderBusters() {
    if(buster.type == "hb"){
        var coord = getTileCoordinate(buster.column, buster.row, 0, 0);
        spark(coord.tilex + level.tilewidth/2, coord.tiley + level.tileheight/2 - 4);
    }
}

// Draw scores
function drawScores() {
    //ctx.fillStyle = undertext_color;
    //ctx.fillRect(score_x, score_y-24, 166, 27);

    ctx.font = "26px "+ font;
    ctx.fillStyle = "#E0523C";
    ctx.fillText(scores.harry.toLocaleString('en-US', {minimumIntegerDigits: 3, useGrouping:false}), score_x, score_y);

    ctx.fillStyle = "#5BD790";
    ctx.fillText(scores.tom.toLocaleString('en-US', {minimumIntegerDigits: 3, useGrouping:false}), score_x+60, score_y);

    ctx.fillStyle = font_color;
    ctx.fillText(scores.nobody.toLocaleString('en-US', {minimumIntegerDigits: 3, useGrouping:false}), score_x+120, score_y);
}



function drawButton(text, x, y, w, h) {
    ctx.fillStyle = font_color;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = border_color;
    ctx.font = "18px " + font;
    var textdim = ctx.measureText(text);
    ctx.fillText(text, x + (w - textdim.width) / 2, y + 30);
}

function drawSelectedTile(x, y, type_id) {
    drawTileWithType(x,y,type_id);
}

function drawTileWithType(x, y, type_id) {
    var tile = document.getElementById(icons[type_id]);
    try{
        ctx.drawImage(tile, x + 2, y + 2, level.tilewidth - 4, level.tileheight - 4);
    } catch (err){
        console.log(x+";"+y+" - " + icons[type_id]);
        console.warn(err);
    }
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

function renderTiles() {
    for (var i = 0; i < level.columns; i++) {
        for (var j = 0; j < level.rows; j++) {

            // Render the shift animation
            var shift = level.tiles[i][j].shift;
            var coord = getTileCoordinate(i, j, 0, (animationtime / animationtimetotal) * shift);

            // Check if there is a tile present
            if (level.tiles[i][j].type >= 0) {
                drawTileWithType(coord.tilex, coord.tiley, level.tiles[i][j].type);
            }

            if (level.selectedtile.selected) {
                if (level.selectedtile.column == i && level.selectedtile.row == j) {
                    drawSelectedTile(coord.tilex, coord.tiley, level.tiles[i][j].type);
                }
            }
        }
    }

    // Render the swap animation
    if (gamestate == gamestates.resolve &&
        (animationstate == animationstates.swapTiles || animationstate == animationstates.reSwapTiles)) {
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
        if (animationstate == animationstates.swapTiles) {
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