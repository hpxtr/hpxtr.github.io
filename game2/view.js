
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

    ctx.drawImage(cover, 0, 0, 638, 1068);//638*4150/2480);

    var start_btn = (buttons[0].pressed) ? document.getElementById("start_on") : document.getElementById("start");
    ctx.drawImage(start_btn, buttons[0].x, buttons[0].y, buttons[0].width, buttons[0].height);

    //ctx.fillStyle = undertext_color;
   // ctx.fillRect(calendar_x, calendar_y-33, 50, 88);

    ctx.font = "26px " + font;
    ctx.fillStyle = font_color;
    ctx.fillText(time[current_time].number, calendar_x, calendar_y);
    ctx.fillText(time[current_time].month, calendar_x, calendar_y+30);


    drawButton("Gameover", buttons[3].x, buttons[3].y, buttons[3].width, buttons[3].height);
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

            ctx.fillStyle = "#C9BBBD"; //(win)? border_color : "#44aa44";
            ctx.globalAlpha = 0.3;
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
            //ctx.fillRect(level.x, level.y, levelwidth, levelheight);
            ctx.globalAlpha = 1.0;

            ctx.fillStyle = font_color;
            ctx.fillRect(level.x, buttons[1].y - 55, levelwidth + 4, 120);
            ctx.fillStyle = "#C9BBBD";
            ctx.font = "20px " + font;

            drawCenterText("Воу, вы собрали " + scores.harry + " гарриков и " + scores.tom + " томиков!",
                    level.x,
                    buttons[1].y, levelwidth);
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
                spark(coord.tilex + h*level.tilewidth, coord.tiley);
            }
        } else {
            // Draw a vertical line
            for (var v=0; v<clusters[i].length; v++){
                spark(coord.tilex, coord.tiley + v*level.tileheight);
            }
        }
    }
}

// Draw scores
function drawScores() {
    //ctx.fillStyle = undertext_color;
    //ctx.fillRect(score_x, score_y-24, 166, 27);

    ctx.font = "26px "+ font;
    ctx.fillStyle = "#86618e";
    ctx.fillText(scores.harry.toLocaleString('en-US', {minimumIntegerDigits: 3, useGrouping:false}), score_x, score_y);

  ctx.font = "20px "+ font;
  ctx.fillStyle = font_color;
  ctx.fillText("vs", score_x+58, score_y);

  ctx.font = "26px "+ font;
    ctx.fillStyle = "#548bbb";
    ctx.fillText(scores.tom.toLocaleString('en-US', {minimumIntegerDigits: 3, useGrouping:false}), score_x+90, score_y);

    //ctx.fillStyle = font_color;
    //ctx.fillText(scores.nobody.toLocaleString('en-US', {minimumIntegerDigits: 3, useGrouping:false}), score_x+120, score_y);
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

function tilebolt(pos) {
    thunder.push(new Thunder({
        x: pos.tilex + level.tilewidth/2,
        y: pos.tiley + level.tileheight/2 - 4,
        color: "#00ff11"//'#32ff95'
    }));
    particles.push(new Particles({
        x: pos.tilex + level.tilewidth/2,
        y: pos.tiley + level.tileheight/2 - 4
    }));
}

function colorspark(x, y, color) {
    particles.push(new Particles({
        x: x  + level.tilewidth/2,
        y: y + level.tileheight/2 - 4,
        color: color
    }));
}

function spark(x, y) {
    particles.push(new Particles({
        x: x  + level.tilewidth/2,
        y: y + level.tileheight/2 - 4
    }));
}

function bigspark(x, y) {
    particles.push(new Particles({
        x: x  + level.tilewidth/2,
        y: y + level.tileheight/2 - 4,
        width: 50
        //v: {direct: 5.810678095494448, weight: 20.562300635604453, friction: 0.88},
        //g: {direct: 1.464413895595235, weight: 1.38336239105111736}
        //a: {change: 0.039701101933149546, min: 0.8697720456281206, max: 30.383046168499955}
    }));
}