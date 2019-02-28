
function renderBusters() {
    if(buster.type == "hb"){
        let buster_coord = getTileCoordinate(buster.column, buster.row, 0, 0);
        spark(buster_coord.tilex, buster_coord.tiley);

        const time_for_step = animationtimetotal/5;
        let boom_step = Math.floor(animationtime/ time_for_step) + 1;

        let size;
        if(boom_step < 5){
            // growing
            size = 222*animationtime / (time_for_step*boom_step);
        } else {
            size = 222*time_for_step*boom_step / animationtime;
        }
        ctx.drawImage(document.getElementById("boom"+boom_step),
            buster_coord.tilex - size/2 + level.tilewidth/2,
            buster_coord.tiley - size/2 + level.tileheight/2,
            size, size);
    }
    else if(buster.type == "halloween"){
        let buster_coord = getTileCoordinate(buster.column, buster.row, 0, 0);
        tilebolt(buster_coord);

        for (let v=0; v<buster_victims.length; v++){
            let vcoord = getTileCoordinate(buster_victims[v].column, buster_victims[v].row, 0, 0);
            colorspark(vcoord.tilex, vcoord.tiley, "#00ff00");
        }
    }
    else if(buster.type == "stval"){
        for (let v=0; v<buster_victims.length; v++){
            let vcoord = getTileCoordinate(buster_victims[v].column, buster_victims[v].row, 0, 0);

            ctx.globalAlpha = animationtimetotal / animationtime;

            var size = 70*1.5 / (animationtimetotal / animationtime );
            ctx.drawImage(document.getElementById("stval"),
                vcoord.tilex - size/2 + level.tilewidth/2,
                vcoord.tiley - size/2 + level.tileheight/2,
                size, size);
            colorspark(vcoord.tilex, vcoord.tiley, "#ff55ad");
        }
    }
}

function doBuster(column, row) {
    buster_victims = [];
    var type = level.tiles[column][row].type;
    if(icons[type] == "hb"){
        //animationtimetotal = 10;
        console.log("HAPPY BIRTHDAY!" + column + ";" + row);
        buster = {"type" : "hb", "column" : column, "row" : row};
        for (let i=column-1; i<=column+1; i++){
            for (let j=row-1; j<=row+1; j++){
                if(i>= 0 && i<8 && j>=0 && j<8){
                    buster_victims.push({"column" : i, "row" : j, "type": level.tiles[i][j].type});
                }
            }
        }
    } else if(icons[type] == "halloween"){
        animationtimetotal = 0.5;
        console.log("HAPPY HALLOWEEN!" + column + ";" + row);
        buster = {"type" : "halloween", "column" : column, "row" : row};

        buster_victims.push({"column" : column, "row" : row, "type": type});
        for (let i = 0; i < level.columns; i++) {
            for (let j = 0; j < level.rows; j++) {
                if(level.tiles[i][j].type < 3){ // all harry's items will die
                    buster_victims.push({"column" : i, "row" : j, "type": level.tiles[i][j].type});
                }
            }
        }
    } else if(icons[type] == "stval"){
        animationtimetotal = 0.5;
        console.log("HAPPY ST VALENTINE!" + column + ";" + row);
        buster = {"type" : "stval", "column" : column, "row" : row};

        buster_victims.push({"column" : column, "row" : row, "type": type});
        for (let i = 0; i < level.columns; i++) {
            for (let j = 0; j < level.rows; j++) {
                if(level.tiles[i][j].type > 2 && level.tiles[i][j].type < 6){ // all tom's items will die
                    buster_victims.push({"column" : i, "row" : j, "type": level.tiles[i][j].type});
                }
            }
        }
    }
}