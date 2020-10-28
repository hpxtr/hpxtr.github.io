function random(min, max) {
    return Math.random() * (max - min + 1) + min;
}

function clearCanvas3(ctx3) {
    ctx3.globalCompositeOperation = 'destination-out';
    ctx3.fillStyle = 'rgba(0,0,0,' + random(1, 30) / 100 + ')';
    ctx3.fillRect(0, 0, w, h);
    ctx3.globalCompositeOperation = 'source-over';
}

function createLightning(x, y) {
    return {
        x: x,
        y: y,
        xRange: random(5, 30),
        yRange: random(10, 25),
        path: [{
            x: x,
            y: y
        }],
        pathLimit: random(40, 55)
    };
}

function testLightning() {
    var canvas = document.getElementById("board");
    var context = canvas.getContext("2d");

    context.strokeStyle = '#9e9';//'rgba(255, 255, 255, .1)';
    context.lineWidth = 3;

    context.beginPath();
    context.moveTo(10, 0);
    context.lineTo(300, 150);
    //context.lineJoin = 'mitter';
    context.stroke();
}


function drawLightning(light) {
    var canvas = document.getElementById("board");
    var context = canvas.getContext("2d");
    light.path.push({
        x: light.path[light.path.length - 1].x + (random(0, light.xRange) - (light.xRange / 2)),
        y: light.path[light.path.length - 1].y + (random(0, light.yRange))
    });

    context.strokeStyle = '#9e9';//'rgba(255, 255, 255, .1)';
    context.lineWidth = 8;

    context.beginPath();
    context.moveTo(light.x, light.y);
    for (var pc = 0; pc < light.path.length; pc++) {
        context.lineTo(light.path[pc].x, light.path[pc].y);
    }

    context.lineTo(300, 150);
    context.lineJoin = 'miter';
    context.stroke();
}
