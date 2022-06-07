console.log("script responding");
const canvas = document.getElementById("signaturefield");
const clear = document.getElementById("clearsignature");
const hiddenarea = document.getElementById("hidden");
const ctx = canvas.getContext("2d");

let drawing = false;
let x = 0;
let y = 0;

canvas.addEventListener("mousedown", function (evt) {
    x = evt.offsetX;
    y = evt.offsetY;
    drawing = true;
    console.log("offset positions", x, y);
    /* console.log("start: ", start); */
});
canvas.addEventListener("mousemove", function (evt) {
    console.log("start: ", x, y);
    if (drawing == true) {
        console.log("hi there!");
        draw(ctx, x, y, evt.offsetX, evt.offsetY);
        x = evt.offsetX;
        y = evt.offsetY;
    }
});

canvas.addEventListener("mouseup", function (evt) {
    if (drawing == true) {
        console.log("mouseup");
        x = 0;
        y = 0;
        drawing = false;
        hiddenarea.value = canvas.toDataURL();
        console.log(hiddenarea.value);
    }
});

// canvas sript

function draw(ctx, x, y, offsetX, offsetY) {
    console.log("hi, im starting to draw!");

    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.moveTo(x, y);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    ctx.closePath();
}

clear.addEventListener("click", function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});
