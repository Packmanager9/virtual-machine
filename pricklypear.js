
window.addEventListener('DOMContentLoaded', (event) => {

    let windowspares = [{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}]

    const squaretable = {} // this section of code is an optimization for use of the hypotenuse function on Line and LineOP objects
    for(let t = 0;t<10000000;t++){
        squaretable[`${t}`] = Math.sqrt(t)
        if(t > 999){
            t+=9
        }
    }
    const gamepadAPI = {
        controller: {},
        turbo: true,
        connect: function (evt) {
            if (navigator.getGamepads()[0] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[1] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[2] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[3] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            }
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] === null) {
                    continue;
                }
                if (!gamepads[i].connected) {
                    continue;
                }
            }
        },
        disconnect: function (evt) {
            gamepadAPI.turbo = false;
            delete gamepadAPI.controller;
        },
        update: function () {
            gamepadAPI.controller = navigator.getGamepads()[0]
            gamepadAPI.buttonsCache = [];// clear the buttons cache
            for (var k = 0; k < gamepadAPI.buttonsStatus.length; k++) {// move the buttons status from the previous frame to the cache
                gamepadAPI.buttonsCache[k] = gamepadAPI.buttonsStatus[k];
            }
            gamepadAPI.buttonsStatus = [];// clear the buttons status
            var c = gamepadAPI.controller || {}; // get the gamepad object
            var pressed = [];
            if (c.buttons) {
                for (var b = 0, t = c.buttons.length; b < t; b++) {// loop through buttons and push the pressed ones to the array
                    if (c.buttons[b].pressed) {
                        pressed.push(gamepadAPI.buttons[b]);
                    }
                }
            }
            var axes = [];
            if (c.axes) {
                for (var a = 0, x = c.axes.length; a < x; a++) {// loop through axes and push their values to the array
                    axes.push(c.axes[a].toFixed(2));
                }
            }
            gamepadAPI.axesStatus = axes;// assign received values
            gamepadAPI.buttonsStatus = pressed;
            // console.log(pressed); // return buttons for debugging purposes
            return pressed;
        },
        buttonPressed: function (button, hold) {
            var newPress = false;
            for (var i = 0, s = gamepadAPI.buttonsStatus.length; i < s; i++) {// loop through pressed buttons
                if (gamepadAPI.buttonsStatus[i] == button) {// if we found the button we're looking for...
                    newPress = true;// set the boolean variable to true
                    if (!hold) {// if we want to check the single press
                        for (var j = 0, p = gamepadAPI.buttonsCache.length; j < p; j++) {// loop through the cached states from the previous frame
                            if (gamepadAPI.buttonsCache[j] == button) { // if the button was already pressed, ignore new press
                                newPress = false;
                            }
                        }
                    }
                }
            }
            return newPress;
        },
        buttons: [
            'A', 'B', 'X', 'Y', 'LB', 'RB', 'Left-Trigger', 'Right-Trigger', 'Back', 'Start', 'Axis-Left', 'Axis-Right', 'DPad-Up', 'DPad-Down', 'DPad-Left', 'DPad-Right', "Power"
        ],
        buttonsCache: [],
        buttonsStatus: [],
        axesStatus: []
    };
    let canvas
    let canvas_context
    let keysPressed = {}
    let FLEX_engine
    let TIP_engine = {}
    let XS_engine
    let YS_engine
    // TIP_engine.x = 350
    // TIP_engine.y = 350
    class Point {
        constructor(x, y) {
            this.x = x
            this.y = y
            this.radius = 0
        }
        pointDistance(point) {
            return (new LineOP(this, point, "transparent", 0)).hypotenuse()
        }
    }

    class Vector{ // vector math and physics if you prefer this over vector components on circles
        constructor(object = (new Point(0,0)), xmom = 0, ymom = 0){
            this.xmom = xmom
            this.ymom = ymom
            this.object = object
        }
        isToward(point){
            let link = new LineOP(this.object, point)
            let dis1 = link.sqrDis()
            let dummy = new Point(this.object.x+this.xmom, this.object.y+this.ymom)
            let link2 = new LineOP(dummy, point)
            let dis2 = link2.sqrDis()
            if(dis2 < dis1){
                return true
            }else{
                return false
            }
        }
        rotate(angleGoal){
            let link = new Line(this.xmom, this.ymom, 0,0)
            let length = link.hypotenuse()
            let x = (length * Math.cos(angleGoal))
            let y = (length * Math.sin(angleGoal))
            this.xmom = x
            this.ymom = y
        }
        magnitude(){
            return (new Line(this.xmom, this.ymom, 0,0)).hypotenuse()
        }
        normalize(size = 1){
            let magnitude = this.magnitude()
            this.xmom/=magnitude
            this.ymom/=magnitude
            this.xmom*=size
            this.ymom*=size
        }
        multiply(vect){
            let point = new Point(0,0)
            let end = new Point(this.xmom+vect.xmom, this.ymom+vect.ymom)
            return point.pointDistance(end)
        }
        add(vect){
            return new Vector(this.object, this.xmom+vect.xmom, this.ymom+vect.ymom)
        }
        subtract(vect){
            return new Vector(this.object, this.xmom-vect.xmom, this.ymom-vect.ymom)
        }
        divide(vect){
            return new Vector(this.object, this.xmom/vect.xmom, this.ymom/vect.ymom) //be careful with this, I don't think this is right
        }
        draw(){
            let dummy = new Point(this.object.x+this.xmom, this.object.y+this.ymom)
            let link = new LineOP(this.object, dummy, "#FFFFFF", 1)
            link.draw()
        }
    }
    class Line {
        constructor(x, y, x2, y2, color, width) {
            this.x1 = x
            this.y1 = y
            this.x2 = x2
            this.y2 = y2
            this.color = color
            this.width = width
        }
        angle() {
            return Math.atan2(this.y1 - this.y2, this.x1 - this.x2)
        }
        squareDistance() {
            let xdif = this.x1 - this.x2
            let ydif = this.y1 - this.y2
            let squareDistance = (xdif * xdif) + (ydif * ydif)
            return squareDistance
        }
        hypotenuse() {
            let xdif = this.x1 - this.x2
            let ydif = this.y1 - this.y2
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            if(hypotenuse < 10000000-1){
                if(hypotenuse > 1000){
                    return squaretable[`${Math.round(10*Math.round((hypotenuse*.1)))}`]
                }else{
                return squaretable[`${Math.round(hypotenuse)}`]
                }
            }else{
                return Math.sqrt(hypotenuse)
            }
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.x1, this.y1)
            canvas_context.lineTo(this.x2, this.y2)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class LineOP {
        constructor(object, target, color, width) {
            this.object = object
            this.target = target
            this.color = color
            this.width = width
        }
        squareDistance() {
            let xdif = this.object.x - this.target.x
            let ydif = this.object.y - this.target.y
            let squareDistance = (xdif * xdif) + (ydif * ydif)
            return squareDistance
        }
        hypotenuse() {
            let xdif = this.object.x - this.target.x
            let ydif = this.object.y - this.target.y
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            if(hypotenuse < 10000000-1){
                if(hypotenuse > 1000){
                    return squaretable[`${Math.round(10*Math.round((hypotenuse*.1)))}`]
                }else{
                return squaretable[`${Math.round(hypotenuse)}`]
                }
            }else{
                return Math.sqrt(hypotenuse)
            }
        }
        angle() {
            return Math.atan2(this.object.y - this.target.y, this.object.x - this.target.x)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.object.x, this.object.y)
            canvas_context.lineTo(this.target.x, this.target.y)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class Triangle {
        constructor(x, y, color, length, fill = 0, strokeWidth = 0, leg1Ratio = 1, leg2Ratio = 1, heightRatio = 1) {
            this.x = x
            this.y = y
            this.color = color
            this.length = length
            this.x1 = this.x + this.length * leg1Ratio
            this.x2 = this.x - this.length * leg2Ratio
            this.tip = this.y - this.length * heightRatio
            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
            this.fill = fill
            this.stroke = strokeWidth
        }
        draw() {
            canvas_context.strokeStyle = this.color
            canvas_context.stokeWidth = this.stroke
            canvas_context.beginPath()
            canvas_context.moveTo(this.x, this.y)
            canvas_context.lineTo(this.x1, this.y)
            canvas_context.lineTo(this.x, this.tip)
            canvas_context.lineTo(this.x2, this.y)
            canvas_context.lineTo(this.x, this.y)
            if (this.fill == 1) {
                canvas_context.fill()
            }
            canvas_context.stroke()
            canvas_context.closePath()
        }
        isPointInside(point) {
            if (point.x <= this.x1) {
                if (point.y >= this.tip) {
                    if (point.y <= this.y) {
                        if (point.x >= this.x2) {
                            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
                            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
                            this.basey = point.y - this.tip
                            this.basex = point.x - this.x
                            if (this.basex == 0) {
                                return true
                            }
                            this.slope = this.basey / this.basex
                            if (this.slope >= this.accept1) {
                                return true
                            } else if (this.slope <= this.accept2) {
                                return true
                            }
                        }
                    }
                }
            }
            return false
        }
    }
    class Rectangle {
        constructor(x, y, width, height, color, fill = 1, stroke = 0, strokeWidth = 1) {
            this.x = x
            this.y = y
            this.height = height
            this.width = width
            this.color = color
            this.xmom = 0
            this.ymom = 0
            this.stroke = stroke
            this.strokeWidth = strokeWidth
            this.fill = fill
        }
        draw() {
            canvas_context.fillStyle = this.color
            canvas_context.fillRect(this.x, this.y, this.width, this.height)
            canvas_context.strokeStyle = "#FFFFFF"
            canvas_context.lineWidth = 1


            canvas_context.strokeRect(this.x, this.y, this.width, this.height)
        }
        move() {
            this.x += this.xmom
            this.y += this.ymom
        }
        isPointInside(point) {
            if (point.x >= this.x) {
                if (point.y >= this.y) {
                    if (point.x <= this.x + this.width) {
                        if (point.y <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            if (point.x + point.radius >= this.x) {
                if (point.y + point.radius >= this.y) {
                    if (point.x - point.radius <= this.x + this.width) {
                        if (point.y - point.radius <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
    }
    class Circle {
        constructor(x, y, radius, color, xmom = 0, ymom = 0, friction = 1, reflect = 0, strokeWidth = 0, strokeColor = "transparent") {
            this.x = x
            this.y = y
            this.radius = radius
            this.color = color
            this.xmom = xmom
            this.ymom = ymom
            this.friction = friction
            this.reflect = reflect
            this.strokeWidth = strokeWidth
            this.strokeColor = strokeColor
        }
        draw() {
            canvas_context.lineWidth = this.strokeWidth
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath();
            if (this.radius > 0) {
                canvas_context.arc(this.x, this.y, this.radius, 0, (Math.PI * 2), true)
                canvas_context.fillStyle = this.color
                canvas_context.fill()
                canvas_context.stroke();
            } else {
                console.log("The circle is below a radius of 0, and has not been drawn. The circle is:", this)
            }
        }
        move() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
        }
        unmove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x -= this.xmom
            this.y -= this.ymom
        }
        frictiveMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
            this.xmom *= this.friction
            this.ymom *= this.friction
        }
        frictiveunMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.xmom /= this.friction
            this.ymom /= this.friction
            this.x -= this.xmom
            this.y -= this.ymom
        }
        isPointInside(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.radius * this.radius)) {
                return true
            }
            return false
        }
        doesPerimeterTouch(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= ((this.radius + point.radius) * (this.radius + point.radius))) {
                return true
            }
            return false
        }
    } 
    class CircleRing {
        constructor(x, y, radius, color, xmom = 0, ymom = 0, friction = 1, reflect = 0, strokeWidth = 0, strokeColor = "transparent") {
            this.x = x
            this.y = y
            this.radius = radius
            this.color = color
            this.xmom = xmom
            this.ymom = ymom
            this.friction = friction
            this.reflect = reflect
            this.strokeWidth = 10
            this.strokeColor = strokeColor
        }
        draw() {
            canvas_context.lineWidth = this.strokeWidth
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath();
            if (this.radius > 0) {
                canvas_context.arc(this.x, this.y, this.radius, 0, (Math.PI * 2), true)
                canvas_context.fillStyle = this.color
                canvas_context.fill()
                canvas_context.stroke();
            } else {
                console.log("The circle is below a radius of 0, and has not been drawn. The circle is:", this)
            }
        }
        move() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
        }
        unmove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x -= this.xmom
            this.y -= this.ymom
        }
        frictiveMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
            this.xmom *= this.friction
            this.ymom *= this.friction
        }
        frictiveunMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.xmom /= this.friction
            this.ymom /= this.friction
            this.x -= this.xmom
            this.y -= this.ymom
        }
        isPointInside(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.radius * this.radius)) {
                return true
            }
            return false
        }
        doesPerimeterTouch(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= ((this.radius + point.radius) * (this.radius + point.radius))) {
                return true
            }
            return false
        }
    } class Polygon {
        constructor(x, y, size, color, sides = 3, xmom = 0, ymom = 0, angle = 0, reflect = 0) {
            if (sides < 2) {
                sides = 2
            }
            this.reflect = reflect
            this.xmom = xmom
            this.ymom = ymom
            this.body = new Circle(x, y, size - (size * .293), "transparent")
            this.nodes = []
            this.angle = angle
            this.size = size
            this.color = color
            this.angleIncrement = (Math.PI * 2) / sides
            this.sides = sides
            for (let t = 0; t < sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
        }
        isPointInside(point) { // rough approximation
            this.body.radius = this.size - (this.size * .293)
            if (this.sides <= 2) {
                return false
            }
            this.areaY = point.y - this.body.y
            this.areaX = point.x - this.body.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.body.radius * this.body.radius)) {
                return true
            }
            return false
        }
        move() {
            if (this.reflect == 1) {
                if (this.body.x > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.body.x < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.body.x += this.xmom
            this.body.y += this.ymom
        }
        draw() {
            this.nodes = []
            this.angleIncrement = (Math.PI * 2) / this.sides
            this.body.radius = this.size - (this.size * .293)
            for (let t = 0; t < this.sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
            canvas_context.strokeStyle = this.color
            canvas_context.fillStyle = this.color
            canvas_context.lineWidth = 0
            canvas_context.beginPath()
            canvas_context.moveTo(this.nodes[0].x, this.nodes[0].y)
            for (let t = 1; t < this.nodes.length; t++) {
                canvas_context.lineTo(this.nodes[t].x, this.nodes[t].y)
            }
            canvas_context.lineTo(this.nodes[0].x, this.nodes[0].y)
            canvas_context.fill()
            canvas_context.stroke()
            canvas_context.closePath()
        }
    }
    class Shape {
        constructor(shapes) {
            this.shapes = shapes
        }
        draw() {
            for (let t = 0; t < this.shapes.length; t++) {
                this.shapes[t].draw()
            }
        }
        isPointInside(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].isPointInside(point)) {
                    return true
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].doesPerimeterTouch(point)) {
                    return true
                }
            }
            return false
        }
        innerShape(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].doesPerimeterTouch(point)) {
                    return this.shapes[t]
                }
            }
            return false
        }
        isInsideOf(box) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (box.isPointInside(this.shapes[t])) {
                    return true
                }
            }
            return false
        }
        adjustByFromDisplacement(x,y) {
            for (let t = 0; t < this.shapes.length; t++) {
                if(typeof this.shapes[t].fromRatio == "number"){
                    this.shapes[t].x+=x*this.shapes[t].fromRatio
                    this.shapes[t].y+=y*this.shapes[t].fromRatio
                }
            }
        }
        adjustByToDisplacement(x,y) {
            for (let t = 0; t < this.shapes.length; t++) {
                if(typeof this.shapes[t].toRatio == "number"){
                    this.shapes[t].x+=x*this.shapes[t].toRatio
                    this.shapes[t].y+=y*this.shapes[t].toRatio
                }
            }
        }
        mixIn(arr){
            for(let t = 0;t<arr.length;t++){
                for(let k = 0;k<arr[t].shapes.length;k++){
                    this.shapes.push(arr[t].shapes[k])
                }
            }
        }
        push(object) {
            this.shapes.push(object)
        }
    }

    class Spring {
        constructor(x, y, radius, color, body = 0, length = 1, gravity = 0, width = 1) {
            if (body == 0) {
                this.body = new Circle(x, y, radius, color)
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            } else {
                this.body = body
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            }
            this.gravity = gravity
            this.width = width
        }
        balance() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            if (this.beam.hypotenuse() < this.length) {
                this.body.xmom += (this.body.x - this.anchor.x) / this.length
                this.body.ymom += (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom -= (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom -= (this.body.y - this.anchor.y) / this.length
            } else {
                this.body.xmom -= (this.body.x - this.anchor.x) / this.length
                this.body.ymom -= (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom += (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom += (this.body.y - this.anchor.y) / this.length
            }
            let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
            this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
            this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
            this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
        }
        draw() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            this.beam.draw()
            this.body.draw()
            this.anchor.draw()
        }
        move() {
            this.anchor.ymom += this.gravity
            this.anchor.move()
        }

    }  
    class SpringOP {
        constructor(body, anchor, length, width = 3, color = body.color) {
            this.body = body
            this.anchor = anchor
            this.beam = new LineOP(body, anchor, color, width)
            this.length = length
        }
        balance() {
            if (this.beam.hypotenuse() < this.length) {
                this.body.xmom += ((this.body.x - this.anchor.x) / this.length) 
                this.body.ymom += ((this.body.y - this.anchor.y) / this.length) 
                this.anchor.xmom -= ((this.body.x - this.anchor.x) / this.length) 
                this.anchor.ymom -= ((this.body.y - this.anchor.y) / this.length) 
            } else if (this.beam.hypotenuse() > this.length) {
                this.body.xmom -= (this.body.x - this.anchor.x) / (this.length)
                this.body.ymom -= (this.body.y - this.anchor.y) / (this.length)
                this.anchor.xmom += (this.body.x - this.anchor.x) / (this.length)
                this.anchor.ymom += (this.body.y - this.anchor.y) / (this.length)
            }

            let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
            this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
            this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
            this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
        }
        draw() {
            this.beam.draw()
        }
        move() {
            //movement of SpringOP objects should be handled separate from their linkage, to allow for many connections, balance here with this object, move nodes independently
        }
    }

    class Color {
        constructor(baseColor, red = -1, green = -1, blue = -1, alpha = 1) {
            this.hue = baseColor
            if (red != -1 && green != -1 && blue != -1) {
                this.r = red
                this.g = green
                this.b = blue
                if (alpha != 1) {
                    if (alpha < 1) {
                        this.alpha = alpha
                    } else {
                        this.alpha = alpha / 255
                        if (this.alpha > 1) {
                            this.alpha = 1
                        }
                    }
                }
                if (this.r > 255) {
                    this.r = 255
                }
                if (this.g > 255) {
                    this.g = 255
                }
                if (this.b > 255) {
                    this.b = 255
                }
                if (this.r < 0) {
                    this.r = 0
                }
                if (this.g < 0) {
                    this.g = 0
                }
                if (this.b < 0) {
                    this.b = 0
                }
            } else {
                this.r = 0
                this.g = 0
                this.b = 0
            }
        }
        normalize() {
            if (this.r > 255) {
                this.r = 255
            }
            if (this.g > 255) {
                this.g = 255
            }
            if (this.b > 255) {
                this.b = 255
            }
            if (this.r < 0) {
                this.r = 0
            }
            if (this.g < 0) {
                this.g = 0
            }
            if (this.b < 0) {
                this.b = 0
            }
        }
        randomLight() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12) + 4)];
            }
            var color = new Color(hash, 55 + Math.random() * 200, 55 + Math.random() * 200, 55 + Math.random() * 200)
            return color;
        }
        randomDark() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12))];
            }
            var color = new Color(hash, Math.random() * 200, Math.random() * 200, Math.random() * 200)
            return color;
        }
        random() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 16))];
            }
            var color = new Color(hash, Math.random() * 255, Math.random() * 255, Math.random() * 255)
            return color;
        }
    }
    class Softbody { //buggy, spins in place
        constructor(x, y, radius, color, size, members = 10, memberLength = 5, force = 10, gravity = 0) {
            this.springs = []
            this.pin = new Circle(x, y, radius, color)
            this.points = []
            this.flop = 0
            let angle = 0
            this.size = size 
            let line = new Line((Math.cos(angle)*size), (Math.sin(angle)*size), (Math.cos(angle+ ((Math.PI*2)/members))*size), (Math.sin(angle+ ((Math.PI*2)/members))*size) )
            let distance = line.hypotenuse()
            for(let t =0;t<members;t++){
                let circ = new Circle(x+(Math.cos(angle)*size), y+(Math.sin(angle)*size), radius, color)
                circ.reflect = 1
                circ.bigbody = new Circle(x+(Math.cos(angle)*size), y+(Math.sin(angle)*size), distance, color)
                circ.draw()
                circ.touch = []
                this.points.push(circ)
                angle += ((Math.PI*2)/members)
            }

            for(let t =0;t<this.points.length;t++){
                for(let k =0;k<this.points.length;k++){
                    if(t!=k){
                        if(this.points[k].bigbody.doesPerimeterTouch(this.points[t])){
                        if(!this.points[k].touch.includes(t) && !this.points[t].touch.includes(k)){
                                let spring = new SpringOP(this.points[k], this.points[t], (size*Math.PI)/members, 2, color)
                                this.points[k].touch.push(t)
                                this.points[t].touch.push(k)
                                this.springs.push(spring)
                                spring.beam.draw()
                            }
                        }
                    }
                }
            }

            console.log(this)

            // this.spring = new Spring(x, y, radius, color, this.pin, memberLength, gravity)
            // this.springs.push(this.spring)
            // for (let k = 0; k < members; k++) {
            //     this.spring = new Spring(x, y, radius, color, this.spring.anchor, memberLength, gravity)
            //     if (k < members - 1) {
            //         this.springs.push(this.spring)
            //     } else {
            //         this.spring.anchor = this.pin
            //         this.springs.push(this.spring)
            //     }
            // }
            this.forceConstant = force
            this.centroid = new Circle(0, 0, 10, "red")
        }
        circularize() {
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            this.angle = 0
            this.angleIncrement = (Math.PI * 2) / this.springs.length
            for (let t = 0; t < this.points.length; t++) {
                this.points[t].x = this.centroid.x + (Math.cos(this.angle) * this.forceConstant)
                this.points[t].y = this.centroid.y + (Math.sin(this.angle) * this.forceConstant)
                this.angle += this.angleIncrement 
            }
        }
        balance() {
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.points.length; s++) {
                this.xpoint += (this.points[s].x / this.points.length)
                this.ypoint += (this.points[s].y / this.points.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            // this.centroid.x += TIP_engine.x / this.points.length
            // this.centroid.y += TIP_engine.y / this.points.length
            for (let s = 0; s < this.points.length; s++) {
                this.link = new LineOP(this.points[s], this.centroid, 0, "transparent")
                if (this.link.hypotenuse() != 0) {

                    if(this.size < this.link.hypotenuse()){
                        this.points[s].xmom -= (Math.cos(this.link.angle())*(this.link.hypotenuse())) * this.forceConstant*.1
                        this.points[s].ymom -= (Math.sin(this.link.angle())*(this.link.hypotenuse())) * this.forceConstant*.1
                    }else{
                        this.points[s].xmom += (Math.cos(this.link.angle())*(this.link.hypotenuse())) * this.forceConstant*.1
                        this.points[s].ymom += (Math.sin(this.link.angle())*(this.link.hypotenuse())) * this.forceConstant*.1
                    }

                    // this.points[s].xmom += (((this.points[s].x - this.centroid.x) / (this.link.hypotenuse()))) * this.forceConstant
                    // this.points[s].ymom += (((this.points[s].y - this.centroid.y) / (this.link.hypotenuse()))) * this.forceConstant
                }
            }
            if(this.flop%2 == 0){
                for (let s =  0; s < this.springs.length; s++) {
                    this.springs[s].balance()
                }
            }else{
                for (let s = this.springs.length-1;s>=0; s--) {
                    this.springs[s].balance()
                }
            }
            for (let s = 0; s < this.points.length; s++) {
                this.points[s].move()
                this.points[s].draw()
            }
            for (let s =  0; s < this.springs.length; s++) {
                this.springs[s].draw()
            }
            this.centroid.draw()
        }
    }
    class Observer {
        constructor(x, y, radius, color, range = 100, rays = 10, angle = (Math.PI * .125)) {
            this.body = new Circle(x, y, radius, color)
            this.color = color
            this.ray = []
            this.rayrange = range
            this.globalangle = Math.PI
            this.gapangle = angle
            this.currentangle = 0
            this.obstacles = []
            this.raymake = rays
        }
        beam() {
            this.currentangle = this.gapangle / 2
            for (let k = 0; k < this.raymake; k++) {
                this.currentangle += (this.gapangle / Math.ceil(this.raymake / 2))
                let ray = new Circle(this.body.x, this.body.y, 1, "white", (((Math.cos(this.globalangle + this.currentangle)))), (((Math.sin(this.globalangle + this.currentangle)))))
                ray.collided = 0
                ray.lifespan = this.rayrange - 1
                this.ray.push(ray)
            }
            for (let f = 0; f < this.rayrange; f++) {
                for (let t = 0; t < this.ray.length; t++) {
                    if (this.ray[t].collided < 1) {
                        this.ray[t].move()
                        for (let q = 0; q < this.obstacles.length; q++) {
                            if (this.obstacles[q].isPointInside(this.ray[t])) {
                                this.ray[t].collided = 1
                            }
                        }
                    }
                }
            }
        }
        draw() {
            this.beam()
            this.body.draw()
            canvas_context.lineWidth = 1
            canvas_context.fillStyle = this.color
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath()
            canvas_context.moveTo(this.body.x, this.body.y)
            for (let y = 0; y < this.ray.length; y++) {
                canvas_context.lineTo(this.ray[y].x, this.ray[y].y)
                canvas_context.lineTo(this.body.x, this.body.y)
            }
            canvas_context.stroke()
            canvas_context.fill()
            this.ray = []
        }
    }
    function setUp(canvas_pass, style = "#000000") {
        canvas = canvas_pass
        canvas_context = canvas.getContext('2d');
        canvas.style.background = style
        window.setInterval(function () {
            main()
        }, 17)
        document.addEventListener('keydown', (event) => {
            keysPressed[event.key] = true;
        });
        document.addEventListener('keyup', (event) => {
            delete keysPressed[event.key];
        });
        window.addEventListener('pointerdown', e => {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine
            let clear = 0
            for(let t = 0;t<icons.length;t++){
                if(icons[t].body.isPointInside(TIP_engine)){
                    icons[t].marked = 1
                    clear = 1
                }
            }
            for(let t = 0;t<icons.length;t++){
                // if(clear == 1){
                    if(!icons[t].window.isPointInside(TIP_engine)){
                        icons[t].running = 0
                    }
                // }
            }
            // example usage: if(object.isPointInside(TIP_engine)){ take action }
        });
        window.addEventListener('pointermove', continued_stimuli);

        window.addEventListener('pointerup', e => {
            for(let t = 0;t<icons.length;t++){
                    icons[t].marked = 0
            }
            // window.removeEventListener("pointermove", continued_stimuli);
        })
        function continued_stimuli(e) {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine
        }
    }
    function gamepad_control(object, speed = 1) { // basic control for objects using the controler
//         console.log(gamepadAPI.axesStatus[1]*gamepadAPI.axesStatus[0]) //debugging
        if (typeof object.body != 'undefined') {
            if(typeof (gamepadAPI.axesStatus[1]) != 'undefined'){
                if(typeof (gamepadAPI.axesStatus[0]) != 'undefined'){
                object.body.x += (gamepadAPI.axesStatus[0] * speed)
                object.body.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        } else if (typeof object != 'undefined') {
            if(typeof (gamepadAPI.axesStatus[1]) != 'undefined'){
                if(typeof (gamepadAPI.axesStatus[0]) != 'undefined'){
                object.x += (gamepadAPI.axesStatus[0] * speed)
                object.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        }
    }
    function control(object, speed = 1) { // basic control for objects
        if (typeof object.body != 'undefined') {
            if (keysPressed['w']) {
                object.body.y -= speed
            }
            if (keysPressed['d']) {
                object.body.x += speed
            }
            if (keysPressed['s']) {
                object.body.y += speed
            }
            if (keysPressed['a']) {
                object.body.x -= speed
            }
        } else if (typeof object != 'undefined') {
            if (keysPressed['w']) {
                object.y -= speed
            }
            if (keysPressed['d']) {
                object.x += speed
            }
            if (keysPressed['s']) {
                object.y += speed
            }
            if (keysPressed['a']) {
                object.x -= speed
            }
        }
    }
    function getRandomLightColor() { // random color that will be visible on  black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12) + 4)];
        }
        return color;
    }
    function getRandomColor() { // random color
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 16) + 0)];
        }
        return color;
    }
    function getRandomDarkColor() {// color that will be visible on a black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12))];
        }
        return color;
    }
    function castBetween(from, to, granularity = 10, radius = 1) { //creates a sort of beam hitbox between two points, with a granularity (number of members over distance), with a radius defined as well
            let limit = granularity
            let shape_array = []
            for (let t = 0; t < limit; t++) {
                let circ = new Circle((from.x * (t / limit)) + (to.x * ((limit - t) / limit)), (from.y * (t / limit)) + (to.y * ((limit - t) / limit)), radius, "red")
                circ.toRatio = t/limit
                circ.fromRatio = (limit-t)/limit
                shape_array.push(circ)
            }
            return (new Shape(shape_array))
    }

    let setup_canvas = document.getElementById('canvas') //getting canvas from document

    setUp(setup_canvas) // setting up canvas refrences, starting timer. 

    // object instantiation and creation happens here 
    
    class Icon{
        constructor(x,y){
             this.running = 0
             this.ran = 0
            this.body  = new Circle(x,y, 20, getRandomColor())
            this.name = getRandomColor()+getRandomColor()
            this.marked = 0
            this.gamenum = icons.length
        }
        move(point){
            this.body.x = point.x
            this.body.y = point.y
            for(let k = 0;k<icons.length;k++){
                for(let t = 0;t<icons.length;t++){
                if(this!=icons[t]){
                    if(icons[k].body.doesPerimeterTouch(icons[t].body)){
                        let j = 0
                        while(icons[k].body.doesPerimeterTouch(icons[t].body)){
                            j++
                            if(j>20){
                                break
                            }
                            let ranx = (icons[k].body.x-icons[t].body.x)/10
                            let rany = (icons[k].body.y-icons[t].body.y)/10
                            // this.body.x+=ranx
                            // this.body.y+=rany
                            icons[t].body.x-=ranx
                            icons[t].body.y-=rany
                        }
                        
                    }
                }
            }
            }
        }
        run(booter){

            if(booter.index == 0){
                this.running = 1


    // const squaretable = {} // this section of code is an optimization for use of the hypotenuse function on Line and LineOP objects
    // for(let t = 0;t<10000000;t++){
    //     squaretable[`${t}`] = Math.sqrt(t)
    //     if(t > 999){
    //         t+=9
    //     }
    // }
    // let song = new Audio()
    // song.src = 'frog.mp3'
    const gamepadAPI = {
        controller: {},
        turbo: true,
        connect: function (evt) {
            if (navigator.getGamepads()[0] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[1] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[2] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[3] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            }
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] === null) {
                    continue;
                }
                if (!gamepads[i].connected) {
                    continue;
                }
            }
        },
        disconnect: function (evt) {
            gamepadAPI.turbo = false;
            delete gamepadAPI.controller;
        },
        update: function () {
            gamepadAPI.controller = navigator.getGamepads()[0]
            gamepadAPI.buttonsCache = [];// clear the buttons cache
            for (var k = 0; k < gamepadAPI.buttonsStatus.length; k++) {// move the buttons status from the previous frame to the cache
                gamepadAPI.buttonsCache[k] = gamepadAPI.buttonsStatus[k];
            }
            gamepadAPI.buttonsStatus = [];// clear the buttons status
            var c = gamepadAPI.controller || {}; // get the gamepad object
            var pressed = [];
            if (c.buttons) {
                for (var b = 0, t = c.buttons.length; b < t; b++) {// loop through buttons and push the pressed ones to the array
                    if (c.buttons[b].pressed) {
                        pressed.push(gamepadAPI.buttons[b]);
                    }
                }
            }
            var axes = [];
            if (c.axes) {
                for (var a = 0, x = c.axes.length; a < x; a++) {// loop through axes and push their values to the array
                    axes.push(c.axes[a].toFixed(2));
                }
            }
            gamepadAPI.axesStatus = axes;// assign received values
            gamepadAPI.buttonsStatus = pressed;
            // console.log(pressed); // return buttons for debugging purposes
            return pressed;
        },
        buttonPressed: function (button, hold) {
            var newPress = false;
            for (var i = 0, s = gamepadAPI.buttonsStatus.length; i < s; i++) {// loop through pressed buttons
                if (gamepadAPI.buttonsStatus[i] == button) {// if we found the button we're looking for...
                    newPress = true;// set the boolean variable to true
                    if (!hold) {// if we want to check the single press
                        for (var j = 0, p = gamepadAPI.buttonsCache.length; j < p; j++) {// loop through the cached states from the previous frame
                            if (gamepadAPI.buttonsCache[j] == button) { // if the button was already pressed, ignore new press
                                newPress = false;
                            }
                        }
                    }
                }
            }
            return newPress;
        },
        buttons: [
            'A', 'B', 'X', 'Y', 'LB', 'RB', 'Left-Trigger', 'Right-Trigger', 'Back', 'Start', 'Axis-Left', 'Axis-Right', 'DPad-Up', 'DPad-Down', 'DPad-Left', 'DPad-Right', "Power"
        ],
        buttonsCache: [],
        buttonsStatus: [],
        axesStatus: []
    };
    let canvas
    let canvas_context
    let keysPressed = {}
    let FLEX_engine
    // let TIP_engine = {}
    let XS_engine
    let YS_engine
    // TIP_engine.x = 350
    // TIP_engine.y = 350
    class Point {
        constructor(x, y) {
            this.x = x
            this.y = y
            this.radius = 0
        }
        pointDistance(point) {
            return (new LineOP(this, point, "transparent", 0)).hypotenuse()
        }
    }

    class Vector{ // vector math and physics if you prefer this over vector components on circles
        constructor(object = (new Point(0,0)), xmom = 0, ymom = 0){
            this.xmom = xmom
            this.ymom = ymom
            this.object = object
        }
        isToward(point){
            let link = new LineOP(this.object, point)
            let dis1 = link.squareDistance()
            let dummy = new Point(this.object.x+this.xmom, this.object.y+this.ymom)
            let link2 = new LineOP(dummy, point)
            let dis2 = link2.squareDistance()
            if(dis2 < dis1){
                return true
            }else{
                return false
            }
        }
        rotate(angleGoal){
            let link = new Line(this.xmom, this.ymom, 0,0)
            let length = link.hypotenuse()
            let x = (length * Math.cos(angleGoal))
            let y = (length * Math.sin(angleGoal))
            this.xmom = x
            this.ymom = y
        }
        magnitude(){
            return (new Line(this.xmom, this.ymom, 0,0)).hypotenuse()
        }
        normalize(size = 1){
            let magnitude = this.magnitude()
            this.xmom/=magnitude
            this.ymom/=magnitude
            this.xmom*=size
            this.ymom*=size
        }
        multiply(vect){
            let point = new Point(0,0)
            let end = new Point(this.xmom+vect.xmom, this.ymom+vect.ymom)
            return point.pointDistance(end)
        }
        add(vect){
            return new Vector(this.object, this.xmom+vect.xmom, this.ymom+vect.ymom)
        }
        subtract(vect){
            return new Vector(this.object, this.xmom-vect.xmom, this.ymom-vect.ymom)
        }
        divide(vect){
            return new Vector(this.object, this.xmom/vect.xmom, this.ymom/vect.ymom) //be careful with this, I don't think this is right
        }
        draw(){
            let dummy = new Point(this.object.x+this.xmom, this.object.y+this.ymom)
            let link = new LineOP(this.object, dummy, "#FFFFFF", 1)
            link.draw()
        }
    }
    class Line {
        constructor(x, y, x2, y2, color, width) {
            this.x1 = x
            this.y1 = y
            this.x2 = x2
            this.y2 = y2
            this.color = color
            this.width = width
        }
        angle() {
            return Math.atan2(this.y1 - this.y2, this.x1 - this.x2)
        }
        squareDistance() {
            let xdif = this.x1 - this.x2
            let ydif = this.y1 - this.y2
            let squareDistance = (xdif * xdif) + (ydif * ydif)
            return squareDistance
        }
        hypotenuse() {
            let xdif = this.x1 - this.x2
            let ydif = this.y1 - this.y2
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            // if(hypotenuse < 10000000-1){
            //     if(hypotenuse > 1000){
            //         return squaretable[`${Math.round(10*Math.round((hypotenuse*.1)))}`]
            //     }else{
            //     return squaretable[`${Math.round(hypotenuse)}`]
            //     }
            // }else{
                return Math.sqrt(hypotenuse)
            // }
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.x1, this.y1)
            canvas_context.lineTo(this.x2, this.y2)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class LineOP {
        constructor(object, target, color, width) {
            this.object = object
            this.target = target
            this.color = color
            this.width = width
        }
        squareDistance() {
            let xdif = this.object.x - this.target.x
            let ydif = this.object.y - this.target.y
            let squareDistance = (xdif * xdif) + (ydif * ydif)
            return squareDistance
        }
        hypotenuse() {
            let xdif = this.object.x - this.target.x
            let ydif = this.object.y - this.target.y
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            // if(hypotenuse < 10000000-1){
            //     if(hypotenuse > 1000){
            //         return squaretable[`${Math.round(10*Math.round((hypotenuse*.1)))}`]
            //     }else{
            //     return squaretable[`${Math.round(hypotenuse)}`]
            //     }
            // }else{
                return Math.sqrt(hypotenuse)
            // }
        }
        angle() {
            return Math.atan2(this.object.y - this.target.y, this.object.x - this.target.x)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.object.x, this.object.y)
            canvas_context.lineTo(this.target.x, this.target.y)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class Triangle {
        constructor(x, y, color, length, fill = 0, strokeWidth = 0, leg1Ratio = 1, leg2Ratio = 1, heightRatio = 1) {
            this.x = x
            this.y = y
            this.color = color
            this.length = length
            this.x1 = this.x + this.length * leg1Ratio
            this.x2 = this.x - this.length * leg2Ratio
            this.tip = this.y - this.length * heightRatio
            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
            this.fill = fill
            this.stroke = strokeWidth
        }
        draw() {
            canvas_context.strokeStyle = this.color
            canvas_context.stokeWidth = this.stroke
            canvas_context.beginPath()
            canvas_context.moveTo(this.x, this.y)
            canvas_context.lineTo(this.x1, this.y)
            canvas_context.lineTo(this.x, this.tip)
            canvas_context.lineTo(this.x2, this.y)
            canvas_context.lineTo(this.x, this.y)
            if (this.fill == 1) {
                canvas_context.fill()
            }
            canvas_context.stroke()
            canvas_context.closePath()
        }
        isPointInside(point) {
            if (point.x <= this.x1) {
                if (point.y >= this.tip) {
                    if (point.y <= this.y) {
                        if (point.x >= this.x2) {
                            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
                            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
                            this.basey = point.y - this.tip
                            this.basex = point.x - this.x
                            if (this.basex == 0) {
                                return true
                            }
                            this.slope = this.basey / this.basex
                            if (this.slope >= this.accept1) {
                                return true
                            } else if (this.slope <= this.accept2) {
                                return true
                            }
                        }
                    }
                }
            }
            return false
        }
    }
    class Rectangle {
        constructor(x, y, width, height, color, fill = 1, stroke = 0, strokeWidth = 1) {
            this.x = x
            this.y = y
            this.height = height
            this.width = width
            this.color = color
            this.xmom = 0
            this.ymom = 0
            this.stroke = stroke
            this.strokeWidth = strokeWidth
            this.fill = fill
        }
        draw() {
            canvas_context.fillStyle = this.color
            canvas_context.fillRect(this.x, this.y, this.width, this.height)
        }
        move() {
            this.x += this.xmom
            this.y += this.ymom
        }
        isPointInside(point) {
            if (point.x >= this.x) {
                if (point.y >= this.y) {
                    if (point.x <= this.x + this.width) {
                        if (point.y <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            if (point.x + point.radius >= this.x) {
                if (point.y + point.radius >= this.y) {
                    if (point.x - point.radius <= this.x + this.width) {
                        if (point.y - point.radius <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
    }
    class RectangleGrad {
        constructor(x, y, width, height, color, fill = 1, stroke = 0, strokeWidth = 1) {
            this.x = x
            this.y = y
            this.height = height
            this.width = width
            this.color = color
            this.xmom = 0
            this.ymom = 0
            this.stroke = stroke
            this.strokeWidth = strokeWidth
            this.fill = fill
            let grad = canvas_context.createLinearGradient(this.x, this.y, this.x+this.width, this.y+this.height);
      
            for(let t = 0;t<10000;t++){
                grad.addColorStop(t/10000, getRandomFrogColor()+'44');
            }
            this.grad = grad
        }
        draw() {
            canvas_context.fillStyle = this.grad
            canvas_context.fillRect(this.x, this.y, this.width, this.height)
        }
        move() {
            this.x += this.xmom
            this.y += this.ymom
        }
        isPointInside(point) {
            if (point.x >= this.x) {
                if (point.y >= this.y) {
                    if (point.x <= this.x + this.width) {
                        if (point.y <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            if (point.x + point.radius >= this.x) {
                if (point.y + point.radius >= this.y) {
                    if (point.x - point.radius <= this.x + this.width) {
                        if (point.y - point.radius <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
    }
    class Circle {
        constructor(x, y, radius, color, xmom = 0, ymom = 0, friction = 1, reflect = 0, strokeWidth = 0, strokeColor = "transparent") {
            this.x = x
            this.y = y
            this.radius = radius
            this.color = color
            this.xmom = xmom
            this.ymom = ymom
            this.friction = friction
            this.reflect = reflect
            this.strokeWidth = strokeWidth
            this.strokeColor = strokeColor
        }
        draw() {
            canvas_context.lineWidth = this.strokeWidth
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath();
            if (this.radius > 0) {
                canvas_context.arc(this.x, this.y, this.radius, 0, (Math.PI * 2), true)
                canvas_context.fillStyle = this.color
                canvas_context.fill()
                canvas_context.stroke();
            } else {
                console.log("The circle is below a radius of 0, and has not been drawn. The circle is:", this)
            }
        }
        move() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
            canvas_context.translate(-this.xmom, -this.ymom)
        }
        unmove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x -= this.xmom
            this.y -= this.ymom
        }
        frictiveMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
            this.xmom *= this.friction
            this.ymom *= this.friction
        }
        frictiveunMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.xmom /= this.friction
            this.ymom /= this.friction
            this.x -= this.xmom
            this.y -= this.ymom
        }
        isPointInside(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.radius * this.radius)) {
                return true
            }
            return false
        }
        doesPerimeterTouch(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= ((this.radius + point.radius) * (this.radius + point.radius))) {
                return true
            }
            return false
        }
    } 
    class CircleRing {
        constructor(x, y, radius, color, xmom = 0, ymom = 0, friction = 1, reflect = 0, strokeWidth = 0, strokeColor = "transparent") {
            this.x = x
            this.y = y
            this.radius = radius
            this.color = color
            this.xmom = xmom
            this.ymom = ymom
            this.friction = friction
            this.reflect = reflect
            this.strokeWidth = 10
            this.strokeColor = strokeColor
        }
        draw() {
            canvas_context.lineWidth = this.strokeWidth
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath();
            if (this.radius > 0) {
                canvas_context.arc(this.x, this.y, this.radius, 0, (Math.PI * 2), true)
                canvas_context.fillStyle = this.color
                canvas_context.fill()
                canvas_context.stroke();
            } else {
                console.log("The circle is below a radius of 0, and has not been drawn. The circle is:", this)
            }
        }
        move() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
        }
        unmove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x -= this.xmom
            this.y -= this.ymom
        }
        frictiveMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
            this.xmom *= this.friction
            this.ymom *= this.friction
        }
        frictiveunMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.xmom /= this.friction
            this.ymom /= this.friction
            this.x -= this.xmom
            this.y -= this.ymom
        }
        isPointInside(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.radius * this.radius)) {
                return true
            }
            return false
        }
        doesPerimeterTouch(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= ((this.radius + point.radius) * (this.radius + point.radius))) {
                return true
            }
            return false
        }
    } class Polygon {
        constructor(x, y, size, color, sides = 3, xmom = 0, ymom = 0, angle = 0, reflect = 0) {
            if (sides < 2) {
                sides = 2
            }
            this.reflect = reflect
            this.xmom = xmom
            this.ymom = ymom
            this.body = new Circle(x, y, size - (size * .293), "transparent")
            this.nodes = []
            this.angle = angle
            this.size = size
            this.color = color
            this.angleIncrement = (Math.PI * 2) / sides
            this.sides = sides
            for (let t = 0; t < sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
        }
        isPointInside(point) { // rough approximation
            this.body.radius = this.size - (this.size * .293)
            if (this.sides <= 2) {
                return false
            }
            this.areaY = point.y - this.body.y
            this.areaX = point.x - this.body.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.body.radius * this.body.radius)) {
                return true
            }
            return false
        }
        move() {
            if (this.reflect == 1) {
                if (this.body.x > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.body.x < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.body.x += this.xmom
            this.body.y += this.ymom
        }
        draw() {
            this.nodes = []
            this.angleIncrement = (Math.PI * 2) / this.sides
            this.body.radius = this.size - (this.size * .293)
            for (let t = 0; t < this.sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
            canvas_context.strokeStyle = this.color
            canvas_context.fillStyle = this.color
            canvas_context.lineWidth = 0
            canvas_context.beginPath()
            canvas_context.moveTo(this.nodes[0].x, this.nodes[0].y)
            for (let t = 1; t < this.nodes.length; t++) {
                canvas_context.lineTo(this.nodes[t].x, this.nodes[t].y)
            }
            canvas_context.lineTo(this.nodes[0].x, this.nodes[0].y)
            canvas_context.fill()
            canvas_context.stroke()
            canvas_context.closePath()
        }
    }
    class Shape {
        constructor(shapes) {
            this.shapes = shapes
        }
        draw() {
            for (let t = 0; t < this.shapes.length; t++) {
                this.shapes[t].draw()
            }
        }
        isPointInside(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].isPointInside(point)) {
                    return true
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].doesPerimeterTouch(point)) {
                    return true
                }
            }
            return false
        }
        innerShape(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].doesPerimeterTouch(point)) {
                    return this.shapes[t]
                }
            }
            return false
        }
        isInsideOf(box) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (box.isPointInside(this.shapes[t])) {
                    return true
                }
            }
            return false
        }
        adjustByFromDisplacement(x,y) {
            for (let t = 0; t < this.shapes.length; t++) {
                if(typeof this.shapes[t].fromRatio == "number"){
                    this.shapes[t].x+=x*this.shapes[t].fromRatio
                    this.shapes[t].y+=y*this.shapes[t].fromRatio
                }
            }
        }
        adjustByToDisplacement(x,y) {
            for (let t = 0; t < this.shapes.length; t++) {
                if(typeof this.shapes[t].toRatio == "number"){
                    this.shapes[t].x+=x*this.shapes[t].toRatio
                    this.shapes[t].y+=y*this.shapes[t].toRatio
                }
            }
        }
        mixIn(arr){
            for(let t = 0;t<arr.length;t++){
                for(let k = 0;k<arr[t].shapes.length;k++){
                    this.shapes.push(arr[t].shapes[k])
                }
            }
        }
        push(object) {
            this.shapes.push(object)
        }
    }

    class Spring {
        constructor(x, y, radius, color, body = 0, length = 1, gravity = 0, width = 1) {
            if (body == 0) {
                this.body = new Circle(x, y, radius, color)
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            } else {
                this.body = body
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            }
            this.gravity = gravity
            this.width = width
        }
        balance() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            if (this.beam.hypotenuse() < this.length) {
                this.body.xmom += (this.body.x - this.anchor.x) / this.length
                this.body.ymom += (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom -= (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom -= (this.body.y - this.anchor.y) / this.length
            } else {
                this.body.xmom -= (this.body.x - this.anchor.x) / this.length
                this.body.ymom -= (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom += (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom += (this.body.y - this.anchor.y) / this.length
            }
            let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
            this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
            this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
            this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
        }
        draw() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            this.beam.draw()
            this.body.draw()
            this.anchor.draw()
        }
        move() {
            this.anchor.ymom += this.gravity
            this.anchor.move()
        }

    }  
    class SpringOP {
        constructor(body, anchor, length, width = 3, color = body.color) {
            this.body = body
            this.anchor = anchor
            this.beam = new LineOP(body, anchor, color, width)
            this.length = length
        }
        balance() {
            if (this.beam.hypotenuse() < this.length) {
                this.body.xmom += ((this.body.x - this.anchor.x) / this.length) 
                this.body.ymom += ((this.body.y - this.anchor.y) / this.length) 
                this.anchor.xmom -= ((this.body.x - this.anchor.x) / this.length) 
                this.anchor.ymom -= ((this.body.y - this.anchor.y) / this.length) 
            } else if (this.beam.hypotenuse() > this.length) {
                this.body.xmom -= (this.body.x - this.anchor.x) / (this.length)
                this.body.ymom -= (this.body.y - this.anchor.y) / (this.length)
                this.anchor.xmom += (this.body.x - this.anchor.x) / (this.length)
                this.anchor.ymom += (this.body.y - this.anchor.y) / (this.length)
            }

            let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
            this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
            this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
            this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
        }
        draw() {
            this.beam.draw()
        }
        move() {
            //movement of SpringOP objects should be handled separate from their linkage, to allow for many connections, balance here with this object, move nodes independently
        }
    }

    class Color {
        constructor(baseColor, red = -1, green = -1, blue = -1, alpha = 1) {
            this.hue = baseColor
            if (red != -1 && green != -1 && blue != -1) {
                this.r = red
                this.g = green
                this.b = blue
                if (alpha != 1) {
                    if (alpha < 1) {
                        this.alpha = alpha
                    } else {
                        this.alpha = alpha / 255
                        if (this.alpha > 1) {
                            this.alpha = 1
                        }
                    }
                }
                if (this.r > 255) {
                    this.r = 255
                }
                if (this.g > 255) {
                    this.g = 255
                }
                if (this.b > 255) {
                    this.b = 255
                }
                if (this.r < 0) {
                    this.r = 0
                }
                if (this.g < 0) {
                    this.g = 0
                }
                if (this.b < 0) {
                    this.b = 0
                }
            } else {
                this.r = 0
                this.g = 0
                this.b = 0
            }
        }
        normalize() {
            if (this.r > 255) {
                this.r = 255
            }
            if (this.g > 255) {
                this.g = 255
            }
            if (this.b > 255) {
                this.b = 255
            }
            if (this.r < 0) {
                this.r = 0
            }
            if (this.g < 0) {
                this.g = 0
            }
            if (this.b < 0) {
                this.b = 0
            }
        }
        randomLight() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12) + 4)];
            }
            var color = new Color(hash, 55 + Math.random() * 200, 55 + Math.random() * 200, 55 + Math.random() * 200)
            return color;
        }
        randomDark() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12))];
            }
            var color = new Color(hash, Math.random() * 200, Math.random() * 200, Math.random() * 200)
            return color;
        }
        random() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 16))];
            }
            var color = new Color(hash, Math.random() * 255, Math.random() * 255, Math.random() * 255)
            return color;
        }
    }
    class Softbody { //buggy, spins in place
        constructor(x, y, radius, color, size, members = 10, memberLength = 5, force = 10, gravity = 0) {
            this.springs = []
            this.pin = new Circle(x, y, radius, color)
            this.points = []
            this.flop = 0
            let angle = 0
            this.size = size 
            let line = new Line((Math.cos(angle)*size), (Math.sin(angle)*size), (Math.cos(angle+ ((Math.PI*2)/members))*size), (Math.sin(angle+ ((Math.PI*2)/members))*size) )
            let distance = line.hypotenuse()
            for(let t =0;t<members;t++){
                let circ = new Circle(x+(Math.cos(angle)*size), y+(Math.sin(angle)*size), radius, color)
                circ.reflect = 1
                circ.bigbody = new Circle(x+(Math.cos(angle)*size), y+(Math.sin(angle)*size), distance, color)
                circ.draw()
                circ.touch = []
                this.points.push(circ)
                angle += ((Math.PI*2)/members)
            }

            for(let t =0;t<this.points.length;t++){
                for(let k =0;k<this.points.length;k++){
                    if(t!=k){
                        if(this.points[k].bigbody.doesPerimeterTouch(this.points[t])){
                        if(!this.points[k].touch.includes(t) && !this.points[t].touch.includes(k)){
                                let spring = new SpringOP(this.points[k], this.points[t], (size*Math.PI)/members, 2, color)
                                this.points[k].touch.push(t)
                                this.points[t].touch.push(k)
                                this.springs.push(spring)
                                spring.beam.draw()
                            }
                        }
                    }
                }
            }

            console.log(this)

            // this.spring = new Spring(x, y, radius, color, this.pin, memberLength, gravity)
            // this.springs.push(this.spring)
            // for (let k = 0; k < members; k++) {
            //     this.spring = new Spring(x, y, radius, color, this.spring.anchor, memberLength, gravity)
            //     if (k < members - 1) {
            //         this.springs.push(this.spring)
            //     } else {
            //         this.spring.anchor = this.pin
            //         this.springs.push(this.spring)
            //     }
            // }
            this.forceConstant = force
            this.centroid = new Circle(0, 0, 10, "red")
        }
        circularize() {
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            this.angle = 0
            this.angleIncrement = (Math.PI * 2) / this.springs.length
            for (let t = 0; t < this.points.length; t++) {
                this.points[t].x = this.centroid.x + (Math.cos(this.angle) * this.forceConstant)
                this.points[t].y = this.centroid.y + (Math.sin(this.angle) * this.forceConstant)
                this.angle += this.angleIncrement 
            }
        }
        balance() {
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.points.length; s++) {
                this.xpoint += (this.points[s].x / this.points.length)
                this.ypoint += (this.points[s].y / this.points.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            // this.centroid.x += TIP_engine.x / this.points.length
            // this.centroid.y += TIP_engine.y / this.points.length
            for (let s = 0; s < this.points.length; s++) {
                this.link = new LineOP(this.points[s], this.centroid, 0, "transparent")
                if (this.link.hypotenuse() != 0) {

                    if(this.size < this.link.hypotenuse()){
                        this.points[s].xmom -= (Math.cos(this.link.angle())*(this.link.hypotenuse())) * this.forceConstant*.1
                        this.points[s].ymom -= (Math.sin(this.link.angle())*(this.link.hypotenuse())) * this.forceConstant*.1
                    }else{
                        this.points[s].xmom += (Math.cos(this.link.angle())*(this.link.hypotenuse())) * this.forceConstant*.1
                        this.points[s].ymom += (Math.sin(this.link.angle())*(this.link.hypotenuse())) * this.forceConstant*.1
                    }

                    // this.points[s].xmom += (((this.points[s].x - this.centroid.x) / (this.link.hypotenuse()))) * this.forceConstant
                    // this.points[s].ymom += (((this.points[s].y - this.centroid.y) / (this.link.hypotenuse()))) * this.forceConstant
                }
            }
            if(this.flop%2 == 0){
                for (let s =  0; s < this.springs.length; s++) {
                    this.springs[s].balance()
                }
            }else{
                for (let s = this.springs.length-1;s>=0; s--) {
                    this.springs[s].balance()
                }
            }
            for (let s = 0; s < this.points.length; s++) {
                this.points[s].move()
                this.points[s].draw()
            }
            for (let s =  0; s < this.springs.length; s++) {
                this.springs[s].draw()
            }
            this.centroid.draw()
        }
    }
    class Observer {
        constructor(x, y, radius, color, range = 100, rays = 10, angle = (Math.PI * .125)) {
            this.body = new Circle(x, y, radius, color)
            this.color = color
            this.ray = []
            this.rayrange = range
            this.globalangle = Math.PI
            this.gapangle = angle
            this.currentangle = 0
            this.obstacles = []
            this.raymake = rays
        }
        beam() {
            this.currentangle = this.gapangle / 2
            for (let k = 0; k < this.raymake; k++) {
                this.currentangle += (this.gapangle / Math.ceil(this.raymake / 2))
                let ray = new Circle(this.body.x, this.body.y, 1, "white", (((Math.cos(this.globalangle + this.currentangle)))), (((Math.sin(this.globalangle + this.currentangle)))))
                ray.collided = 0
                ray.lifespan = this.rayrange - 1
                this.ray.push(ray)
            }
            for (let f = 0; f < this.rayrange; f++) {
                for (let t = 0; t < this.ray.length; t++) {
                    if (this.ray[t].collided < 1) {
                        this.ray[t].move()
                        for (let q = 0; q < this.obstacles.length; q++) {
                            if (this.obstacles[q].isPointInside(this.ray[t])) {
                                this.ray[t].collided = 1
                            }
                        }
                    }
                }
            }
        }
        draw() {
            this.beam()
            this.body.draw()
            canvas_context.lineWidth = 1
            canvas_context.fillStyle = this.color
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath()
            canvas_context.moveTo(this.body.x, this.body.y)
            for (let y = 0; y < this.ray.length; y++) {
                canvas_context.lineTo(this.ray[y].x, this.ray[y].y)
                canvas_context.lineTo(this.body.x, this.body.y)
            }
            canvas_context.stroke()
            canvas_context.fill()
            this.ray = []
        }
    }
    function setUp(canvas_pass, style = "#000000") {
        canvas = canvas_pass
        canvas_context = canvas.getContext('2d');
        canvas.style.background = style
        
        booter.main = main
        document.addEventListener('keydown', (event) => {
            keysPressed[event.key] = true;
        });
        document.addEventListener('keyup', (event) => {
            delete keysPressed[event.key];
        });
        window.addEventListener('pointerdown', e => {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            // TIP_engine.x = XS_engine
            // TIP_engine.y = YS_engine
            // TIP_engine.body = TIP_engine
            if(timed == 0){
                if(buttontimeb.isPointInside(TIP_engine)){
                    timed = 1
                    time = new Date()
                    moment = time.getTime()
                    
                    tadpoles[0] = new BullFrog()
                                        
                        for(let t = 0;t<312000;t++){
                            flies.push(new Fly())
                            
                        if(Math.random()<.1){
                            flies[t].body.y-=16000
                            flies[t].body.radius*=3
                        }
                        if(Math.random()<.1){
                            flies[t].body.y-=16000
                            flies[t].body.radius*=3
                        }
                        if(Math.random()<.1){
                            flies[t].body.y-=16000
                            flies[t].body.radius*=1.5
                        }
                        }
                }
                if(buttonzenb.isPointInside(TIP_engine)){
                    timed = -1
                    
                    tadpoles[0] = new BullFrog()    
                       
                    for(let t = 0;t<312000;t++){
                        flies.push(new Fly())
                        
                    if(Math.random()<.1){
                        flies[t].body.y-=16000
                        flies[t].body.radius*=3
                    }
                    if(Math.random()<.1){
                        flies[t].body.y-=16000
                        flies[t].body.radius*=3
                    }
                    if(Math.random()<.1){
                        flies[t].body.y-=16000
                        flies[t].body.radius*=1.5
                    }
                    }
                }

                if(buttontimeg.isPointInside(TIP_engine)){
                    timed = 1
                    time = new Date()
                    moment = time.getTime()
                    
                    tadpoles[0] = new GlideFrog()   
                       
                    for(let t = 0;t<312000;t++){
                        flies.push(new Fly())
                        
                    if(Math.random()<.1){
                        flies[t].body.y-=16000
                        flies[t].body.radius*=3
                    }
                    if(Math.random()<.1){
                        flies[t].body.y-=16000
                        flies[t].body.radius*=3
                    }
                    if(Math.random()<.1){
                        flies[t].body.y-=16000
                        flies[t].body.radius*=1.5
                    }
                    }
                }
                if(buttonzeng.isPointInside(TIP_engine)){
                    timed = -1
                    
                    tadpoles[0] = new GlideFrog()   
                       
                    for(let t = 0;t<312000;t++){
                        flies.push(new Fly())
                        
                    if(Math.random()<.1){
                        flies[t].body.y-=16000
                        flies[t].body.radius*=3
                    }
                    if(Math.random()<.1){
                        flies[t].body.y-=16000
                        flies[t].body.radius*=3
                    }
                    if(Math.random()<.1){
                        flies[t].body.y-=16000
                        flies[t].body.radius*=1.5
                    }
                    }
                }


                if(buttontimef.isPointInside(TIP_engine)){
                    timed = 1
                    time = new Date()
                    moment = time.getTime()
                    
                    tadpoles[0] = new Frog()           
                       
                    for(let t = 0;t<312000;t++){
                        flies.push(new Fly())
                        
                    if(Math.random()<.1){
                        flies[t].body.y-=16000
                        flies[t].body.radius*=3
                    }
                    if(Math.random()<.1){
                        flies[t].body.y-=16000
                        flies[t].body.radius*=3
                    }
                    if(Math.random()<.1){
                        flies[t].body.y-=16000
                        flies[t].body.radius*=1.5
                    }
                    }
                }
                if(buttonzenf.isPointInside(TIP_engine)){
                    timed = -1
                    tadpoles[0] = new Frog()         
                       
                    for(let t = 0;t<312000;t++){
                        flies.push(new Fly())
                        
                    if(Math.random()<.1){
                        flies[t].body.y-=16000
                        flies[t].body.radius*=3
                    }
                    if(Math.random()<.1){
                        flies[t].body.y-=16000
                        flies[t].body.radius*=3
                    }
                    if(Math.random()<.1){
                        flies[t].body.y-=16000
                        flies[t].body.radius*=1.5
                    }
                    }
                }

                if(buttontimep.isPointInside(TIP_engine)){
                    timed = 1
                    time = new Date()
                    moment = time.getTime()
                    
                    tadpoles[0] = new PygmyFrog()    
                       
                    for(let t = 0;t<312000;t++){
                        flies.push(new Fly())
                        
                    if(Math.random()<.1){
                        flies[t].body.y-=16000
                        flies[t].body.radius*=3
                    }
                    if(Math.random()<.1){
                        flies[t].body.y-=16000
                        flies[t].body.radius*=3
                    }
                    if(Math.random()<.1){
                        flies[t].body.y-=16000
                        flies[t].body.radius*=1.5
                    }
                    }
                }
                if(buttonzenp.isPointInside(TIP_engine)){
                    timed = -1
                    tadpoles[0] = new PygmyFrog()   
                       
                    for(let t = 0;t<312000;t++){
                        flies.push(new Fly())
                        
                    if(Math.random()<.1){
                        flies[t].body.y-=16000
                        flies[t].body.radius*=3
                    }
                    if(Math.random()<.1){
                        flies[t].body.y-=16000
                        flies[t].body.radius*=3
                    }
                    if(Math.random()<.1){
                        flies[t].body.y-=16000
                        flies[t].body.radius*=1.5
                    }
                    }
                }
            }
            // example usage: if(object.isPointInside(TIP_engine)){ take action }
        });
        window.addEventListener('pointermove', continued_stimuli);

        window.addEventListener('pointerup', e => {
            // window.removeEventListener("pointermove", continued_stimuli);
        })
        function continued_stimuli(e) {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            // TIP_engine.x = XS_engine
            // TIP_engine.y = YS_engine
            // TIP_engine.body = TIP_engine
        }
    }
    function gamepad_control(object, speed = 1) { // basic control for objects using the controler
//         console.log(gamepadAPI.axesStatus[1]*gamepadAPI.axesStatus[0]) //debugging
        if (typeof object.body != 'undefined') {
            if(typeof (gamepadAPI.axesStatus[1]) != 'undefined'){
                if(typeof (gamepadAPI.axesStatus[0]) != 'undefined'){
                object.body.x += (gamepadAPI.axesStatus[0] * speed)
                object.body.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        } else if (typeof object != 'undefined') {
            if(typeof (gamepadAPI.axesStatus[1]) != 'undefined'){
                if(typeof (gamepadAPI.axesStatus[0]) != 'undefined'){
                object.x += (gamepadAPI.axesStatus[0] * speed)
                object.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        }
    }
    function control(object, speed = 1) { // basic control for objects
        if (typeof object.body != 'undefined') {
            if (keysPressed['w']) {
                object.body.y -= speed
            }
            if (keysPressed['d']) {
                object.body.x += speed
            }
            if (keysPressed['s']) {
                object.body.y += speed
            }
            if (keysPressed['a']) {
                object.body.x -= speed
            }
        } else if (typeof object != 'undefined') {
            if (keysPressed['w']) {
                object.y -= speed
            }
            if (keysPressed['d']) {
                object.x += speed
            }
            if (keysPressed['s']) {
                object.y += speed
            }
            if (keysPressed['a']) {
                object.x -= speed
            }
        }
    }
    function getRandomFrogColor() { // random color that will be visible on  black background
        var letters = '0123456789ABCDEF';
        var color = '#22';
        for (var i = 0; i < 2; i++) {
            color += letters[(Math.floor(Math.random() * 12) + 4)];
        }
        for (var i = 0; i < 2; i++) {
            color += letters[(Math.floor(Math.random() * 12) + 4)];
        }
        
        return color;
    }
    function getRandomLightColor() { // random color that will be visible on  black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12) + 4)];
        }
        return color;
    }
    function getRandomColor() { // random color
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 16) + 0)];
        }
        return color;
    }
    function getRandomDarkColor() {// color that will be visible on a black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12))];
        }
        return color;
    }
    function castBetween(from, to, granularity = 10, radius = 1) { //creates a sort of beam hitbox between two points, with a granularity (number of members over distance), with a radius defined as well
            let limit = granularity
            let shape_array = []
            for (let t = 0; t < limit; t++) {
                let circ = new Circle((from.x * (t / limit)) + (to.x * ((limit - t) / limit)), (from.y * (t / limit)) + (to.y * ((limit - t) / limit)), radius, "red")
                circ.toRatio = t/limit
                circ.fromRatio = (limit-t)/limit
                shape_array.push(circ)
            }
            return (new Shape(shape_array))
    }

    let setup_canvas =  document.createElement("CANVAS");
    setup_canvas.width = 700
    setup_canvas.height = 700
    setup_canvas.hidden = true

    setUp(setup_canvas) // setting up canvas refrences, starting timer. 

    // object instantiation and creation happens here 
    
    class Frog{
        constructor(){
            this.color = getRandomColor()
            this.angle = 0
            this.body = new Circle(350, 350, 5, this.color)
            this.guide = new Circle(353, 350, 3, this.color)
            this.tongue = new Circle(353, 350, 3, getRandomColor())
            this.guidedis = 3
            this.links = []
            this.eye1 = new Circle(350,350, 1.1, 'black')
            this.eye2 = new Circle(350,350, 1.1, 'black')
            this.leg1 = new Circle(350,350, 3, this.color)
            this.leg2 = new Circle(350,350, 3, this.color)
            this.leg1x = new Circle(350,350, 2, this.color)
            this.leg2x = new Circle(350,350, 2, this.color)
            this.leg1link = new LineOP(this.body,this.leg1, this.color, 4)
            this.leg2link = new LineOP(this.body,this.leg2,this.color, 4)
            this.leg1xlink = new LineOP(this.leg1x,this.leg1,this.color, 2.5)
            this.leg2xlink = new LineOP(this.leg2x,this.leg2, this.color, 2.5)
            this.leg3 = new Circle(350,350, 3, this.color)
            this.leg4 = new Circle(350,350, 3, this.color)
            this.leg3x = new Circle(350,350, 2, this.color)
            this.leg4x = new Circle(350,350, 2, this.color)
            this.leg3link = new LineOP(this.body,this.leg3, this.color, 4)
            this.leg4link = new LineOP(this.body,this.leg4,this.color, 4)
            this.leg3xlink = new LineOP(this.leg3x,this.leg3,this.color, 2.5)
            this.leg4xlink = new LineOP(this.leg4x,this.leg4, this.color, 2.5)
            this.tonguelink = new LineOP(this.body,this.tongue, this.tongue.color, 2.5)
            this.combo = 0
            this.spindle = 1
            this.timeratio = .8
            this.tonguedis = 2.9
            this.tonguemom = 0
            this.scale = 1
            this.scores = []
            this.score = 0
        }
        draw(){
            for(let t = 0;t<this.scores.length;t++){
                this.scores[t].draw()
            }
            if(this.tonguedis < 3){
                this.tonguedis = 3
                if(keysPressed[' '] || keysPressed['e'] || keysPressed['l']){
                    this.tonguemom = this.guidedis*5
                }
            }
            this.tonguedis += this.tonguemom
            this.tonguedis *= .93
            this.tonguedis -= 1
            this.tonguemom *= .91
            this.body.move()
            if(keysPressed['w'] || !water.isPointInside(this.body)){
                if(keysPressed['w']){
                    this.timeratio = .92 + ((Math.cos(this.spindle))*.15)
                    this.spindle+=.1
                }
            }
            if( !water.isPointInside(this.body)){
                this.body.ymom += .08
            }

            this.guide.x = (Math.cos(this.angle)*this.guidedis)+this.body.x
            this.guide.y = (Math.sin(this.angle)*this.guidedis)+this.body.y
            this.tongue.x = (Math.cos(this.angle)*this.tonguedis)+this.body.x
            this.tongue.y = (Math.sin(this.angle)*this.tonguedis)+this.body.y

            this.tongue.draw()
            this.tonguelink.draw()
            this.body.draw()
            this.eye1.x = (Math.cos(this.angle-.58)*this.guidedis)+this.body.x
            this.eye1.y = (Math.sin(this.angle-.58)*this.guidedis)+this.body.y
            this.eye2.x = (Math.cos(this.angle+.58)*this.guidedis)+this.body.x
            this.eye2.y = (Math.sin(this.angle+.58)*this.guidedis)+this.body.y
            this.leg1.x = (Math.cos(this.angle-(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)+this.body.x
            this.leg1.y = (Math.sin(this.angle-(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)+this.body.y
            this.leg2.x = (Math.cos(this.angle+(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)+this.body.x
            this.leg2.y = (Math.sin(this.angle+(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)+this.body.y
            this.leg1x.x = (Math.cos(this.angle-(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)+this.body.x
            this.leg1x.y = (Math.sin(this.angle-(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)+this.body.y
            this.leg2x.x = (Math.cos(this.angle+(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)+this.body.x
            this.leg2x.y = (Math.sin(this.angle+(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)+this.body.y
            this.leg3.x = this.body.x-(Math.cos(this.angle-(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)
            this.leg3.y = this.body.y-(Math.sin(this.angle-(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)
            this.leg4.x =  this.body.x-(Math.cos(this.angle+(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)
            this.leg4.y = this.body.y-(Math.sin(this.angle+(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)
            this.leg3x.x =  this.body.x-(Math.cos(this.angle-(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)
            this.leg3x.y =  this.body.y-(Math.sin(this.angle-(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)
            this.leg4x.x =  this.body.x-(Math.cos(this.angle+(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)
            this.leg4x.y =this.body.y- (Math.sin(this.angle+(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)
            if(keysPressed['d']){
                this.angle+=.055
            }
            if(keysPressed['a']){
                this.angle-=.055
            }

            if(keysPressed['w'] && water.isPointInside(this.body)){
                this.combo = 0
                this.scores = []
            this.body.xmom = (this.body.xmom*.95)+(((this.guide.x-this.body.x)*1.45)*.07)
            this.body.ymom = (this.body.ymom*.95)+(((this.guide.y-this.body.y)*1.45)*.07)
            }else{
                if(water.isPointInside(this.body)){
                    this.body.xmom*=.98
                    this.body.ymom*=.98
                }
            }
            // this.guide.draw()
            this.leg1.draw()
            this.leg2.draw()
            this.leg1x.draw()
            this.leg2x.draw()
            this.leg1link.draw()
            this.leg2link.draw()
            this.leg1xlink.draw()
            this.leg2xlink.draw()
            this.leg3.draw()
            this.leg4.draw()
            this.leg3x.draw()
            this.leg4x.draw()
            this.leg3link.draw()
            this.leg4link.draw()
            this.leg3xlink.draw()
            this.leg4xlink.draw()
            this.tonguebeam = castBetween(this.body, this.tongue, (this.body.radius+1)*3, this.tongue.radius*1.7)
            this.tonguelink.width = this.tongue.radius
            for(let t = 0;t<flies.length;t++){
                if(flies[t].link.squareDistance() < (700*700)/tadpoles[0].scale){
                if(this.tonguebeam.doesPerimeterTouch(flies[t].body)){
                    this.eat(flies[t], t)
                    t--
                }
            }
            }
            if(floor.isPointInside(this.body)){
                this.body.ymom*=-1.5
                this.body.move()
            }



            this.foot1 = new Foot(this.leg1x, this.leg1xlink.angle(), .7)
            this.foot1.draw()

            this.foot1 = new Foot(this.leg2x, this.leg2xlink.angle(), .7)
            this.foot1.draw()

            this.foot1 = new Foot(this.leg3x, this.leg3xlink.angle(), .7)
            this.foot1.draw()

            this.foot1 = new Foot(this.leg4x, this.leg4xlink.angle(), .7)
            this.foot1.draw()

            this.eye1.draw()
            this.eye2.draw()
        }
        eat(fly,t){
            
            this.combo++
            this.score+=this.combo
            this.scores.push(new Text(fly.body.x, fly.body.y, this.combo))
            flies.splice(t,1)
            if(this.body.radius < 30){
                this.guidedis+= .12345*.3
                this.body.radius+= .12345*.3
                this.eye2.radius+= .12345*.03
                this.eye1.radius+= .12345*.03
                this.leg1.radius+= .12345*.15
                this.leg2.radius+= .12345*.15
                this.leg3.radius+= .12345*.15
                this.leg4.radius+= .12345*.15
                this.leg1x.radius+= .12345*.09
                this.leg2x.radius+= .12345*.09
                this.leg3x.radius+= .12345*.09
                this.leg4x.radius+= .12345*.09
                this.tongue.radius+= .12345*.09
    
                this.leg1link.width += .12345* .15
                this.leg2link.width += .12345* .15
                this.leg2xlink.width += .12345* .15
                this.leg1xlink.width += .12345* .15
    
                this.leg3link.width += .12345* .15
                this.leg4link.width += .12345* .15
                this.leg3xlink.width += .12345* .15
                this.leg4xlink.width += .12345* .15
                canvas_context.translate(tadpoles[0].body.x, tadpoles[0].body.y)
                canvas_context.scale(1/this.scale,1/this.scale)
                this.scale *= .9989
                canvas_context.scale(this.scale,this.scale)
                canvas_context.translate(-tadpoles[0].body.x, -tadpoles[0].body.y)

        flies.push(new Fly())
            }
        }
    }

    class GlideFoot{
        constructor(root, angle, step){
            this.body = root
            this.toes = []
            this.angle = angle-step
            this.step = step
            for(let t = 0;t<3;t++){
                let toe = new Circle(this.body.x+(Math.cos(this.angle)*this.body.radius*2), this.body.y+(Math.sin(this.angle)*this.body.radius*2), this.body.radius*.5, this.body.color)
                let link = new LineOP(toe, this.body, this.body.color+"BB", toe.radius*.5)
                this.angle+=this.step
                this.toes.push(toe)
                this.toes.push(link)
            }

        }
        draw(){
            for(let t = 0;t<this.toes.length;t++){
                this.toes[t].draw()
            }
        }
    }

    
    class BullFoot{
        constructor(root, angle, step){
            this.body = root
            this.toes = []
            this.angle = angle-step
            this.step = step
            for(let t = 0;t<3;t++){
                let toe = new Circle(this.body.x+(Math.cos(this.angle)*this.body.radius*1.8), this.body.y+(Math.sin(this.angle)*this.body.radius*1.8), this.body.radius*.3, this.body.color)
                let link = new LineOP(toe, this.body, this.body.color+"BB", toe.radius*.9)
                this.angle+=this.step
                this.toes.push(toe)
                this.toes.push(link)
            }

        }
        draw(){
            for(let t = 0;t<this.toes.length;t++){
                this.toes[t].draw()
            }
        }
    }

    
    class Foot{
        constructor(root, angle, step){
            this.body = root
            this.toes = []
            this.angle = angle-step
            this.step = step
            for(let t = 0;t<3;t++){
                let toe = new Circle(this.body.x+(Math.cos(this.angle)*this.body.radius*1.8), this.body.y+(Math.sin(this.angle)*this.body.radius*1.8), this.body.radius*.8, this.body.color)
                let link = new LineOP(toe, this.body, this.body.color+"BB", toe.radius*.9)
                this.angle+=this.step
                this.toes.push(toe)
                this.toes.push(link)
            }

        }
        draw(){
            for(let t = 0;t<this.toes.length;t++){
                this.toes[t].draw()
            }
        }
    }
    
        class PygmyFoot{
            constructor(root, angle, step){
                this.body = root
                this.toes = []
                this.angle = angle-step
                this.step = step
                for(let t = 0;t<3;t++){
                    let toe = new Circle(this.body.x+(Math.cos(this.angle)*this.body.radius*2.1), this.body.y+(Math.sin(this.angle)*this.body.radius*2.1), this.body.radius*.2, this.body.color)
                    let link = new LineOP(toe, this.body, this.body.color+"BB", toe.radius*.9)
                    this.angle+=this.step
                    this.toes.push(toe)
                    this.toes.push(link)
                }
    
            }
            draw(){
                for(let t = 0;t<this.toes.length;t++){
                    this.toes[t].draw()
                }
            }
    }

    
    class PygmyFrog{
        constructor(){
            this.color = getRandomColor()
            this.angle = 0
            this.body = new Circle(350, 350, 3, this.color)
            this.guide = new Circle(353, 350, 2, this.color)
            this.tongue = new Circle(353, 350, 2, getRandomColor())
            this.guidedis = 3
            this.links = []
            this.eye1 = new Circle(350,350, 1.1, 'black')
            this.eye2 = new Circle(350,350, 1.1, 'black')
            this.leg1 = new Circle(350,350, 2, this.color)
            this.leg2 = new Circle(350,350, 2, this.color)
            this.leg1x = new Circle(350,350, 1.5, this.color)
            this.leg2x = new Circle(350,350, 1.5, this.color)
            this.leg1link = new LineOP(this.body,this.leg1, this.color, 4)
            this.leg2link = new LineOP(this.body,this.leg2,this.color, 4)
            this.leg1xlink = new LineOP(this.leg1x,this.leg1,this.color, 2.5)
            this.leg2xlink = new LineOP(this.leg2x,this.leg2, this.color, 2.5)
            this.leg3 = new Circle(350,350, 2, this.color)
            this.leg4 = new Circle(350,350, 2, this.color)
            this.leg3x = new Circle(350,350, 1.5, this.color)
            this.leg4x = new Circle(350,350, 1.5, this.color)
            this.leg3link = new LineOP(this.body,this.leg3, this.color, 2.5)
            this.leg4link = new LineOP(this.body,this.leg4,this.color, 2.5)
            this.leg3xlink = new LineOP(this.leg3x,this.leg3,this.color, 1)
            this.leg4xlink = new LineOP(this.leg4x,this.leg4, this.color, 1)
            this.tonguelink = new LineOP(this.body,this.tongue, this.tongue.color, 1.5)
            this.combo = 0
            this.spindle = 1
            this.timeratio = .8
            this.tonguedis = 2.9
            this.tonguemom = 0
            this.scale = 1
            this.scores = []
            this.score = 0
        }
        draw(){
            for(let t = 0;t<this.scores.length;t++){
                this.scores[t].draw()
            }
            if(this.tonguedis < 3){
                this.tonguedis = 3
                if(keysPressed[' '] || keysPressed['e'] || keysPressed['l']){
                    this.tonguemom = this.guidedis*5
                }
            }
            this.tonguedis += this.tonguemom
            this.tonguedis *= .93
            this.tonguedis -= 1
            this.tonguemom *= .91
            this.body.move()
            if(keysPressed['w'] || !water.isPointInside(this.body)){
                if(keysPressed['w']){
                    this.timeratio = .92 + ((Math.cos(this.spindle))*.15)
                    this.spindle+=.1
                }
            }
            if( !water.isPointInside(this.body)){
                this.body.ymom += .08
            }

            this.guide.x = (Math.cos(this.angle)*this.guidedis)+this.body.x
            this.guide.y = (Math.sin(this.angle)*this.guidedis)+this.body.y
            this.tongue.x = (Math.cos(this.angle)*this.tonguedis)+this.body.x
            this.tongue.y = (Math.sin(this.angle)*this.tonguedis)+this.body.y

            this.tongue.draw()
            this.tonguelink.draw()
            this.body.draw()
            this.eye1.x = (Math.cos(this.angle-.58)*this.guidedis*.5)+this.body.x
            this.eye1.y = (Math.sin(this.angle-.58)*this.guidedis*.5)+this.body.y
            this.eye2.x = (Math.cos(this.angle+.58)*this.guidedis*.5)+this.body.x
            this.eye2.y = (Math.sin(this.angle+.58)*this.guidedis*.5)+this.body.y
            this.leg1.x = (Math.cos(this.angle-(Math.PI*(.6666*this.timeratio)))*this.guidedis*2.3)+this.body.x
            this.leg1.y = (Math.sin(this.angle-(Math.PI*(.6666*this.timeratio)))*this.guidedis*2.3)+this.body.y
            this.leg2.x = (Math.cos(this.angle+(Math.PI*(.6666*this.timeratio)))*this.guidedis*2.3)+this.body.x
            this.leg2.y = (Math.sin(this.angle+(Math.PI*(.6666*this.timeratio)))*this.guidedis*2.3)+this.body.y
            this.leg1x.x = (Math.cos(this.angle-(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*3.8)+this.body.x
            this.leg1x.y = (Math.sin(this.angle-(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*3.8)+this.body.y
            this.leg2x.x = (Math.cos(this.angle+(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*3.8)+this.body.x
            this.leg2x.y = (Math.sin(this.angle+(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*3.8)+this.body.y
            this.leg3.x = this.body.x-(Math.cos(this.angle-(Math.PI*(.6666*this.timeratio)))*this.guidedis*2.3)
            this.leg3.y = this.body.y-(Math.sin(this.angle-(Math.PI*(.6666*this.timeratio)))*this.guidedis*2.3)
            this.leg4.x =  this.body.x-(Math.cos(this.angle+(Math.PI*(.6666*this.timeratio)))*this.guidedis*2.3)
            this.leg4.y = this.body.y-(Math.sin(this.angle+(Math.PI*(.6666*this.timeratio)))*this.guidedis*2.3)
            this.leg3x.x =  this.body.x-(Math.cos(this.angle-(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*3.8)
            this.leg3x.y =  this.body.y-(Math.sin(this.angle-(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*3.8)
            this.leg4x.x =  this.body.x-(Math.cos(this.angle+(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*3.8)
            this.leg4x.y =this.body.y- (Math.sin(this.angle+(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*3.8)
            if(keysPressed['d']){
                this.angle+=.075
            }
            if(keysPressed['a']){
                this.angle-=.075
            }

            if(keysPressed['w'] && water.isPointInside(this.body)){
                this.combo = 0
                this.scores = []
            this.body.xmom = (this.body.xmom*.95)+(((this.guide.x-this.body.x)*1.85)*.09)
            this.body.ymom = (this.body.ymom*.95)+(((this.guide.y-this.body.y)*1.85)*.09)
            }else{
                if(water.isPointInside(this.body)){
                    this.body.xmom*=.99
                    this.body.ymom*=.99
                }
            }
            // this.guide.draw()
            this.leg1.draw()
            this.leg2.draw()
            this.leg1x.draw()
            this.leg2x.draw()
            this.leg1link.draw()
            this.leg2link.draw()
            this.leg1xlink.draw()
            this.leg2xlink.draw()
            this.leg3.draw()
            this.leg4.draw()
            this.leg3x.draw()
            this.leg4x.draw()
            this.leg3link.draw()
            this.leg4link.draw()
            this.leg3xlink.draw()
            this.leg4xlink.draw()
            this.tonguebeam = castBetween(this.body, this.tongue, (this.body.radius+3)*5, this.tongue.radius*2.7)
            this.tonguelink.width = this.tongue.radius
            for(let t = 0;t<flies.length;t++){
                if(flies[t].link.squareDistance() < (700*700)/tadpoles[0].scale){
                if(this.tonguebeam.doesPerimeterTouch(flies[t].body)){
                    this.eat(flies[t], t)
                    t--
                }
            }
            }
            if(floor.isPointInside(this.body)){
                this.body.ymom*=-1.5
                this.body.move()
            }



            this.foot1 = new PygmyFoot(this.leg1x, this.leg1xlink.angle(), .7)
            this.foot1.draw()

            this.foot1 = new PygmyFoot(this.leg2x, this.leg2xlink.angle(), .7)
            this.foot1.draw()

            this.foot1 = new PygmyFoot(this.leg3x, this.leg3xlink.angle(), .7)
            this.foot1.draw()

            this.foot1 = new PygmyFoot(this.leg4x, this.leg4xlink.angle(), .7)
            this.foot1.draw()

            this.eye1.draw()
            this.eye2.draw()
        }
        eat(fly,t){
            
            this.combo++
            this.score+=this.combo
            this.scores.push(new Text(fly.body.x, fly.body.y, this.combo))
            flies.splice(t,1)
            if(this.body.radius < 20){
                this.guidedis+= .12345*.3
                this.body.radius+= .12345*.15
                this.eye2.radius+= .12345*.03
                this.eye1.radius+= .12345*.03
                this.leg1.radius+= .12345*.15
                this.leg2.radius+= .12345*.15
                this.leg3.radius+= .12345*.15
                this.leg4.radius+= .12345*.15
                this.leg1x.radius+= .12345*.09
                this.leg2x.radius+= .12345*.09
                this.leg3x.radius+= .12345*.09
                this.leg4x.radius+= .12345*.09
                this.tongue.radius+= .12345*.09
    
                this.leg1link.width += .12345* .15
                this.leg2link.width += .12345* .15
                this.leg2xlink.width += .12345* .15
                this.leg1xlink.width += .12345* .15
    
                this.leg3link.width += .12345* .15
                this.leg4link.width += .12345* .15
                this.leg3xlink.width += .12345* .15
                this.leg4xlink.width += .12345* .15
                canvas_context.translate(tadpoles[0].body.x, tadpoles[0].body.y)
                canvas_context.scale(1/this.scale,1/this.scale)
                this.scale *= .9989
                canvas_context.scale(this.scale,this.scale)
                canvas_context.translate(-tadpoles[0].body.x, -tadpoles[0].body.y)

        flies.push(new Fly())
            }
        }
    }

    
    class BullFrog{
        constructor(){
            this.color = getRandomColor()
            this.angle = 0
            this.body = new Circle(350, 350, 8, this.color)
            this.guide = new Circle(353, 350, 3, this.color)
            this.tongue = new Circle(353, 350, 5, getRandomColor())
            this.guidedis = 3
            this.links = []
            this.eye1 = new Circle(350,350, 1.1, 'black')
            this.eye2 = new Circle(350,350, 1.1, 'black')
            this.leg1 = new Circle(350,350, 3, this.color)
            this.leg2 = new Circle(350,350, 3, this.color)
            this.leg1x = new Circle(350,350, 2, this.color)
            this.leg2x = new Circle(350,350, 2, this.color)
            this.leg1link = new LineOP(this.body,this.leg1, this.color, 4)
            this.leg2link = new LineOP(this.body,this.leg2,this.color, 4)
            this.leg1xlink = new LineOP(this.leg1x,this.leg1,this.color, 2.5)
            this.leg2xlink = new LineOP(this.leg2x,this.leg2, this.color, 2.5)
            this.leg3 = new Circle(350,350, 3, this.color)
            this.leg4 = new Circle(350,350, 3, this.color)
            this.leg3x = new Circle(350,350, 2, this.color)
            this.leg4x = new Circle(350,350, 2, this.color)
            this.leg3link = new LineOP(this.body,this.leg3, this.color, 4)
            this.leg4link = new LineOP(this.body,this.leg4,this.color, 4)
            this.leg3xlink = new LineOP(this.leg3x,this.leg3,this.color, 2.5)
            this.leg4xlink = new LineOP(this.leg4x,this.leg4, this.color, 2.5)
            this.tonguelink = new LineOP(this.body,this.tongue, this.tongue.color, 2.5)
            this.combo = 0
            this.spindle = 1
            this.timeratio = .8
            this.tonguedis = 2.9
            this.tonguemom = 0
            this.scale = 1
            this.scores = []
            this.score = 0
        }
        draw(){
            for(let t = 0;t<this.scores.length;t++){
                this.scores[t].draw()
            }
            if(this.tonguedis < 3){
                this.tonguedis = 3
                if(keysPressed[' '] || keysPressed['e'] || keysPressed['l']){
                    this.tonguemom = this.guidedis*5
                }
            }
            this.tonguedis += this.tonguemom
            this.tonguedis *= .95
            this.tonguedis -= 1
            this.tonguemom *= .90
            this.body.move()
            if(keysPressed['w'] || !water.isPointInside(this.body)){
                if(keysPressed['w']){
                    this.timeratio = .92 + ((Math.cos(this.spindle))*.15)
                    this.spindle+=.1
                }
            }
            if( !water.isPointInside(this.body)){
                this.body.ymom += .08
            }

            this.guide.x = (Math.cos(this.angle)*this.guidedis)+this.body.x
            this.guide.y = (Math.sin(this.angle)*this.guidedis)+this.body.y
            this.tongue.x = (Math.cos(this.angle)*this.tonguedis)+this.body.x
            this.tongue.y = (Math.sin(this.angle)*this.tonguedis)+this.body.y

            this.tongue.draw()
            this.tonguelink.draw()
            this.body.draw()
            this.eye1.x = (Math.cos(this.angle-.58)*this.guidedis*1.1)+this.body.x
            this.eye1.y = (Math.sin(this.angle-.58)*this.guidedis*1.1)+this.body.y
            this.eye2.x = (Math.cos(this.angle+.58)*this.guidedis*1.1)+this.body.x
            this.eye2.y = (Math.sin(this.angle+.58)*this.guidedis*1.1)+this.body.y
            this.leg1.x = (Math.cos(this.angle-(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)+this.body.x
            this.leg1.y = (Math.sin(this.angle-(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)+this.body.y
            this.leg2.x = (Math.cos(this.angle+(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)+this.body.x
            this.leg2.y = (Math.sin(this.angle+(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)+this.body.y
            this.leg1x.x = (Math.cos(this.angle-(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)+this.body.x
            this.leg1x.y = (Math.sin(this.angle-(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)+this.body.y
            this.leg2x.x = (Math.cos(this.angle+(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)+this.body.x
            this.leg2x.y = (Math.sin(this.angle+(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)+this.body.y
            this.leg3.x = this.body.x-(Math.cos(this.angle-(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)
            this.leg3.y = this.body.y-(Math.sin(this.angle-(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)
            this.leg4.x =  this.body.x-(Math.cos(this.angle+(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)
            this.leg4.y = this.body.y-(Math.sin(this.angle+(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)
            this.leg3x.x =  this.body.x-(Math.cos(this.angle-(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)
            this.leg3x.y =  this.body.y-(Math.sin(this.angle-(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)
            this.leg4x.x =  this.body.x-(Math.cos(this.angle+(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)
            this.leg4x.y =this.body.y- (Math.sin(this.angle+(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)
            if(keysPressed['d']){
                this.angle+=.055
            }
            if(keysPressed['a']){
                this.angle-=.055
            }

            if(keysPressed['w'] && water.isPointInside(this.body)){
                this.combo = 0
                this.scores = []
            this.body.xmom = (this.body.xmom*.95)+(((this.guide.x-this.body.x)*1.45)*.07)
            this.body.ymom = (this.body.ymom*.95)+(((this.guide.y-this.body.y)*1.45)*.07)
            }else{
                if(water.isPointInside(this.body)){
                    this.body.xmom*=.98
                    this.body.ymom*=.98
                }
            }
            // this.guide.draw()
            this.leg1.draw()
            this.leg2.draw()
            this.leg1x.draw()
            this.leg2x.draw()
            this.leg1link.draw()
            this.leg2link.draw()
            this.leg1xlink.draw()
            this.leg2xlink.draw()
            this.leg3.draw()
            this.leg4.draw()
            this.leg3x.draw()
            this.leg4x.draw()
            this.leg3link.draw()
            this.leg4link.draw()
            this.leg3xlink.draw()
            this.leg4xlink.draw()
            this.tonguebeam = castBetween(this.body, this.tongue, (this.body.radius+1)*3, this.tongue.radius*1.41)
            this.tonguelink.width = this.tongue.radius
            for(let t = 0;t<flies.length;t++){
                if(flies[t].link.squareDistance() < (700*700)/tadpoles[0].scale){
                    if(this.tonguebeam.doesPerimeterTouch(flies[t].body)){
                        this.eat(flies[t], t)
                        t--
                    }else if(this.body.doesPerimeterTouch(flies[t].body)){
                        this.eat(flies[t], t)
                        t--
                    }
            }
            }
            if(floor.isPointInside(this.body)){
                this.body.ymom*=-1.5
                this.body.move()
            }


            this.foot1 = new BullFoot(this.leg1x, this.leg1xlink.angle(), .7)
            this.foot1.draw()

            this.foot1 = new BullFoot(this.leg2x, this.leg2xlink.angle(), .7)
            this.foot1.draw()

            this.foot1 = new BullFoot(this.leg3x, this.leg3xlink.angle(), .7)
            this.foot1.draw()

            this.foot1 = new BullFoot(this.leg4x, this.leg4xlink.angle(), .7)
            this.foot1.draw()

            this.eye1.draw()
            this.eye2.draw()
        }
        eat(fly,t){
            
            this.combo++
            this.score+=this.combo
            this.scores.push(new Text(fly.body.x, fly.body.y, this.combo))
            flies.splice(t,1)
            if(this.body.radius < 50){
                this.guidedis+= .12345*.28
                this.body.radius+= .12345*.7
                this.eye2.radius+= .12345*.03
                this.eye1.radius+= .12345*.03
                this.leg1.radius+= .12345*.15
                this.leg2.radius+= .12345*.15
                this.leg3.radius+= .12345*.15
                this.leg4.radius+= .12345*.15
                this.leg1x.radius+= .12345*.09
                this.leg2x.radius+= .12345*.09
                this.leg3x.radius+= .12345*.09
                this.leg4x.radius+= .12345*.09
                this.tongue.radius+= .12345*.13
    
                this.leg1link.width += .12345* .15
                this.leg2link.width += .12345* .15
                this.leg2xlink.width += .12345* .15
                this.leg1xlink.width += .12345* .15
    
                this.leg3link.width += .12345* .15
                this.leg4link.width += .12345* .15
                this.leg3xlink.width += .12345* .15
                this.leg4xlink.width += .12345* .15
                canvas_context.translate(tadpoles[0].body.x, tadpoles[0].body.y)
                canvas_context.scale(1/this.scale,1/this.scale)
                this.scale *= .9989
                canvas_context.scale(this.scale,this.scale)
                canvas_context.translate(-tadpoles[0].body.x, -tadpoles[0].body.y)

        flies.push(new Fly())
            }
        }
    }

    
    class GlideFrog{
        constructor(){
            this.color = getRandomColor()
            this.angle = 0
            this.body = new Circle(350, 350, 4, this.color)
            this.guide = new Circle(353, 350, 3, this.color)
            this.tongue = new Circle(353, 350, 3, getRandomColor())
            this.guidedis = 3
            this.links = []
            this.eye1 = new Circle(350,350, 1.1, 'black')
            this.eye2 = new Circle(350,350, 1.1, 'black')
            this.leg1 = new Circle(350,350, 3, this.color)
            this.leg2 = new Circle(350,350, 3, this.color)
            this.leg1x = new Circle(350,350, 5, this.color)
            this.leg2x = new Circle(350,350, 5, this.color)
            this.leg1link = new LineOP(this.body,this.leg1, this.color, 4)
            this.leg2link = new LineOP(this.body,this.leg2,this.color, 4)
            this.leg1xlink = new LineOP(this.leg1x,this.leg1,this.color, 3.5)
            this.leg2xlink = new LineOP(this.leg2x,this.leg2, this.color, 3.5)
            this.leg3 = new Circle(350,350, 3, this.color)
            this.leg4 = new Circle(350,350, 3, this.color)
            this.leg3x = new Circle(350,350, 5, this.color)
            this.leg4x = new Circle(350,350, 5, this.color)
            this.leg3link = new LineOP(this.body,this.leg3, this.color, 5)
            this.leg4link = new LineOP(this.body,this.leg4,this.color, 5)
            this.leg3xlink = new LineOP(this.leg3x,this.leg3,this.color, 3.5)
            this.leg4xlink = new LineOP(this.leg4x,this.leg4, this.color, 3.5)
            this.tonguelink = new LineOP(this.body,this.tongue, this.tongue.color, 2.5)
            this.combo = 0
            this.spindle = 1
            this.timeratio = .95
            this.tonguedis = 2.9
            this.tonguemom = 0
            this.scale = 1
            this.scores = []
            this.score = 0
        }
        draw(){
            for(let t = 0;t<this.scores.length;t++){
                this.scores[t].draw()
            }
            if(this.tonguedis < 3){
                this.tonguedis = 3
                if(keysPressed[' '] || keysPressed['e'] || keysPressed['l']){
                    this.tonguemom = this.guidedis*4
                }
            }
            this.tonguedis += this.tonguemom
            this.tonguedis *= .93
            this.tonguedis -= 1
            this.tonguemom *= .91
            this.body.move()
            if(keysPressed['w'] || !water.isPointInside(this.body)){
                if(keysPressed['w']){
                    if(water.isPointInside(this.body)){
                    this.timeratio = .95 + ((Math.cos(this.spindle))*.13)
                    this.spindle+=.1
                    }
                }
            }
            if( !water.isPointInside(this.body)){
                this.body.ymom += .08
                if(keysPressed['w']){
                this.body.ymom -= .05
                }
            }

            this.guide.x = (Math.cos(this.angle)*this.guidedis)+this.body.x
            this.guide.y = (Math.sin(this.angle)*this.guidedis)+this.body.y
            this.tongue.x = (Math.cos(this.angle)*this.tonguedis)+this.body.x
            this.tongue.y = (Math.sin(this.angle)*this.tonguedis)+this.body.y

            this.tongue.draw()
            this.tonguelink.draw()
            this.body.draw()
            this.eye1.x = (Math.cos(this.angle-.58)*this.guidedis*.8)+this.body.x
            this.eye1.y = (Math.sin(this.angle-.58)*this.guidedis*.8)+this.body.y
            this.eye2.x = (Math.cos(this.angle+.58)*this.guidedis*.8)+this.body.x
            this.eye2.y = (Math.sin(this.angle+.58)*this.guidedis*.8)+this.body.y
            this.leg1.x = (Math.cos(this.angle-(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)+this.body.x
            this.leg1.y = (Math.sin(this.angle-(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)+this.body.y
            this.leg2.x = (Math.cos(this.angle+(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)+this.body.x
            this.leg2.y = (Math.sin(this.angle+(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)+this.body.y
            this.leg1x.x = (Math.cos(this.angle-(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)+this.body.x
            this.leg1x.y = (Math.sin(this.angle-(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)+this.body.y
            this.leg2x.x = (Math.cos(this.angle+(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)+this.body.x
            this.leg2x.y = (Math.sin(this.angle+(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)+this.body.y
            this.leg3.x = this.body.x-(Math.cos(this.angle-(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)
            this.leg3.y = this.body.y-(Math.sin(this.angle-(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)
            this.leg4.x =  this.body.x-(Math.cos(this.angle+(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)
            this.leg4.y = this.body.y-(Math.sin(this.angle+(Math.PI*(.6666*this.timeratio)))*this.guidedis*4)
            this.leg3x.x =  this.body.x-(Math.cos(this.angle-(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)
            this.leg3x.y =  this.body.y-(Math.sin(this.angle-(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)
            this.leg4x.x =  this.body.x-(Math.cos(this.angle+(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)
            this.leg4x.y =this.body.y- (Math.sin(this.angle+(Math.PI*(.9*(this.timeratio*this.timeratio))))*this.guidedis*6)
            if(keysPressed['d']){
                this.angle+=.055
            }
            if(keysPressed['a']){
                this.angle-=.055
            }

            if(keysPressed['w'] && water.isPointInside(this.body)){
                this.combo = 0
                this.scores = []
            this.body.xmom = (this.body.xmom*.95)+(((this.guide.x-this.body.x)*1.45)*.07)
            this.body.ymom = (this.body.ymom*.95)+(((this.guide.y-this.body.y)*1.45)*.07)
            }else{
                if(water.isPointInside(this.body)){
                    this.body.xmom*=.98
                    this.body.ymom*=.98
                }
            }
            // this.guide.draw()
            this.leg1.draw()
            this.leg2.draw()
            this.leg1x.draw()
            this.leg2x.draw()
            this.leg1link.draw()
            this.leg2link.draw()
            this.leg1xlink.draw()
            this.leg2xlink.draw()
            this.leg3.draw()
            this.leg4.draw()
            this.leg3x.draw()
            this.leg4x.draw()
            this.leg3link.draw()
            this.leg4link.draw()
            this.leg3xlink.draw()
            this.leg4xlink.draw()
            this.tonguebeam = castBetween(this.body, this.tongue, (this.body.radius+2)*3.5, this.tongue.radius*1.41)
            this.tonguelink.width = this.tongue.radius
            for(let t = 0;t<flies.length;t++){
                if(flies[t].link.squareDistance() < (700*700)/tadpoles[0].scale){
                if(this.tonguebeam.doesPerimeterTouch(flies[t].body)){
                    this.eat(flies[t], t)
                    t--
                }
            }
            }
            if(floor.isPointInside(this.body)){
                this.body.ymom*=-1.5
                this.body.move()
            }


            this.foot1 = new GlideFoot(this.leg1x, this.leg1xlink.angle(), .5)
            this.foot1.draw()

            this.foot1 = new GlideFoot(this.leg2x, this.leg2xlink.angle(), .5)
            this.foot1.draw()

            this.foot1 = new GlideFoot(this.leg3x, this.leg3xlink.angle(), .5)
            this.foot1.draw()

            this.foot1 = new GlideFoot(this.leg4x, this.leg4xlink.angle(), .5)
            this.foot1.draw()

            this.eye1.draw()
            this.eye2.draw()
        }
        eat(fly,t){
            
            this.combo++
            this.score+=this.combo
            this.scores.push(new Text(fly.body.x, fly.body.y, this.combo))
            flies.splice(t,1)
            if(this.body.radius < 30){
                this.guidedis+= .12345*.31
                this.body.radius+= .12345*.28
                this.eye2.radius+= .12345*.03
                this.eye1.radius+= .12345*.03
                this.leg1.radius+= .12345*.15
                this.leg2.radius+= .12345*.15
                this.leg3.radius+= .12345*.15
                this.leg4.radius+= .12345*.15
                this.leg1x.radius+= .12345*.19
                this.leg2x.radius+= .12345*.19
                this.leg3x.radius+= .12345*.19
                this.leg4x.radius+= .12345*.19
                this.tongue.radius+= .12345*.19
    
                this.leg1link.width += .12345* .22
                this.leg2link.width += .12345* .22
                this.leg2xlink.width += .12345* .22
                this.leg1xlink.width += .12345* .22
    
                this.leg3link.width += .12345* .22
                this.leg4link.width += .12345* .22
                this.leg3xlink.width += .12345* .22
                this.leg4xlink.width += .12345* .22
                canvas_context.translate(tadpoles[0].body.x, tadpoles[0].body.y)
                canvas_context.scale(1/this.scale,1/this.scale)
                this.scale *= .9989
                canvas_context.scale(this.scale,this.scale)
                canvas_context.translate(-tadpoles[0].body.x, -tadpoles[0].body.y)

        flies.push(new Fly())
            }
        }
    }

    class Text{
        constructor(x,y,num){
            this.x = x
            this.y = y
            this.num = num
            this.color = `rgb(${255}, ${255-num*10}, ${num*2})`
        }
        draw(){
            canvas_context.fillStyle = this.color
            let size = 20/tadpoles[0].scale
            canvas_context.font = `${size}px arial`
            canvas_context.fillText(this.num, this.x, this.y)
        }
    }

    class Fly{
        constructor(){
            this.body = new Circle(-125300+ (Math.random()*250000), -16000+ (Math.random()*16350), 3, getRandomLightColor())
            this.link = new LineOP(this.body, tadpoles[0].body, "transparent", 0)
            this.mag = Math.random()*5
        }
        draw(){
            this.body.x+=(Math.random()-.5)*this.mag
            this.body.y+=(Math.random()-.5)*this.mag
            if(water.isPointInside(this.body)){

                this.body.y = -10
            }
            this.body.draw()
        }
    }

    let tadpoles = []
    tadpoles[0] = new GlideFrog()
    let flies = []    
    let floor = new Rectangle(-1000000, 2350, 2000000, 100000, "#FFFFAA")

    let timed = 0
    let water = new Rectangle(-1000000, 350, 2000000, 100000, "#00AAFF44")
    let grader = new RectangleGrad(-1000000, -100000, 2000000,200000, "red")

    let time = new Date()
    let moment = time.getTime()
    let buttonzenb = new Rectangle(100, 100, 190, 100, "#00ff00")
    let buttonzeng = new Rectangle(100, 250, 190, 100, "#00ff00")
    let buttonzenf = new Rectangle(100, 400, 190, 100, "#00ff00")
    let buttonzenp = new Rectangle(100, 550, 190, 100, "#00ff00")
    let buttontimeb = new Rectangle(490, 100, 190, 100, "red")
    let buttontimeg = new Rectangle(490, 250, 190, 100, "red")
    let buttontimef = new Rectangle(490, 400, 190, 100, "red")
    let buttontimep = new Rectangle(490, 550, 199, 100, "red")
    let scorer = 0

    let mute = 0
    function main() {
        if(booter.running == 0){
            return
        }
        windowspares[booter.index] = canvas
        // if(keysPressed['Escape']){
        //     canvas_context.clearRect(-1000000, -10000000, canvas.width*1000000, canvas.height*1000000)  
        //     timed = 0
        // }
        // if(mute == 0){
        //     song.play()
        // }else{
        //     song.pause()
        // }

        if(keysPressed['m']){
            mute = 1
        }
        if(keysPressed['p']){
            mute = 0
        }
        if(timed != 0){

            canvas_context.clearRect(-1000000, -10000000, canvas.width*1000000, canvas.height*1000000)  // refreshes the image



            grader.draw()
            gamepadAPI.update() //checks for button presses/stick movement on the connected controller)
            // // game code goes here
            for(let t = 0;t<tadpoles.length;t++){
                tadpoles[t].draw()
            }
            for(let t = 0;t<flies.length;t++){
                if(flies[t].link.squareDistance() < (700*700)/tadpoles[0].scale){
                    flies[t].draw()
                }
            }
            water.draw()
            floor.draw()
    
            canvas_context.fillStyle = "white"
            let size = 20/tadpoles[0].scale
            canvas_context.font = `${size}px arial`
            canvas_context.fillText(tadpoles[0].score, tadpoles[0].body.x-(330/tadpoles[0].scale), tadpoles[0].body.y-(330/tadpoles[0].scale))
    
            if(timed == 1){
                let time = new Date()
                if(time.getTime() - moment > 300000){
                    canvas_context.fillText("You got " + scorer, tadpoles[0].body.x-(330/tadpoles[0].scale), tadpoles[0].body.y-(310/tadpoles[0].scale))
                    
                }else{
                    scorer = tadpoles[0].score
                    canvas_context.fillText(Math.max(0, Math.round((300000 -(time.getTime() - moment))/1000)), tadpoles[0].body.x-(330/tadpoles[0].scale), tadpoles[0].body.y-(310/tadpoles[0].scale))
                }
            }
        }else{
            buttontimeb.draw()
            buttonzenb.draw()
            buttontimeg.draw()
            buttonzeng.draw()
            buttontimef.draw()
            buttonzenf.draw()
            buttontimep.draw()
            buttonzenp.draw()
            let size = 20/tadpoles[0].scale
            canvas_context.font = `${size}px arial`
            canvas_context.fillStyle = "black"
            canvas_context.fillText("Zen Bullfrog", 120, 150)
            canvas_context.fillStyle = "white"
            canvas_context.fillText("Timed Frog", 520, 450)
            canvas_context.fillStyle = "black"
            canvas_context.fillText("Zen Glidefrog", 120, 300)
            canvas_context.fillStyle = "white"
            canvas_context.fillText("Timed Glidefrog", 520, 300)
            canvas_context.fillStyle = "black"
            canvas_context.fillText("Zen Frog", 120, 450)
            canvas_context.fillStyle = "white"
            canvas_context.fillText("Timed Bullfrog", 520, 150)

            canvas_context.fillStyle = "black"
            canvas_context.fillText("Zen Pygmy Frog", 120, 600)
            canvas_context.fillStyle = "white"
            canvas_context.fillText("Timed Pygmy Frog", 510, 600)

        }
    }

            }else if(booter.index == 1){


            this.running = 1

    const squaretable = {} // this section of code is an optimization for use of the hypotenuse function on Line and LineOP objects
    for(let t = 0;t<1;t++){
        squaretable[`${t}`] = Math.sqrt(t)
        if(t > 999){
            t+=9
        }
    }
    const gamepadAPI = {
        controller: {},
        turbo: true,
        connect: function (evt) {
            if (navigator.getGamepads()[0] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[1] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[2] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[3] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            }
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] === null) {
                    continue;
                }
                if (!gamepads[i].connected) {
                    continue;
                }
            }
        },
        disconnect: function (evt) {
            gamepadAPI.turbo = false;
            delete gamepadAPI.controller;
        },
        update: function () {
            gamepadAPI.controller = navigator.getGamepads()[0]
            gamepadAPI.buttonsCache = [];// clear the buttons cache
            for (var k = 0; k < gamepadAPI.buttonsStatus.length; k++) {// move the buttons status from the previous frame to the cache
                gamepadAPI.buttonsCache[k] = gamepadAPI.buttonsStatus[k];
            }
            gamepadAPI.buttonsStatus = [];// clear the buttons status
            var c = gamepadAPI.controller || {}; // get the gamepad object
            var pressed = [];
            if (c.buttons) {
                for (var b = 0, t = c.buttons.length; b < t; b++) {// loop through buttons and push the pressed ones to the array
                    if (c.buttons[b].pressed) {
                        pressed.push(gamepadAPI.buttons[b]);
                    }
                }
            }
            var axes = [];
            if (c.axes) {
                for (var a = 0, x = c.axes.length; a < x; a++) {// loop through axes and push their values to the array
                    axes.push(c.axes[a].toFixed(2));
                }
            }
            gamepadAPI.axesStatus = axes;// assign received values
            gamepadAPI.buttonsStatus = pressed;
            // console.log(pressed); // return buttons for debugging purposes
            return pressed;
        },
        buttonPressed: function (button, hold) {
            var newPress = false;
            for (var i = 0, s = gamepadAPI.buttonsStatus.length; i < s; i++) {// loop through pressed buttons
                if (gamepadAPI.buttonsStatus[i] == button) {// if we found the button we're looking for...
                    newPress = true;// set the boolean variable to true
                    if (!hold) {// if we want to check the single press
                        for (var j = 0, p = gamepadAPI.buttonsCache.length; j < p; j++) {// loop through the cached states from the previous frame
                            if (gamepadAPI.buttonsCache[j] == button) { // if the button was already pressed, ignore new press
                                newPress = false;
                            }
                        }
                    }
                }
            }
            return newPress;
        },
        buttons: [
            'A', 'B', 'X', 'Y', 'LB', 'RB', 'Left-Trigger', 'Right-Trigger', 'Back', 'Start', 'Axis-Left', 'Axis-Right', 'DPad-Up', 'DPad-Down', 'DPad-Left', 'DPad-Right', "Power"
        ],
        buttonsCache: [],
        buttonsStatus: [],
        axesStatus: []
    };
    let canvas
    let canvas_context
    let keysPressed = {}
    let FLEX_engine
    // let TIP_engine = {}
    let XS_engine
    let YS_engine
    // TIP_engine.x = 350
    // TIP_engine.y = 350
    class Point {
        constructor(x, y) {
            this.x = x
            this.y = y
            this.radius = 0
        }
        pointDistance(point) {
            return (new LineOP(this, point, "transparent", 0)).hypotenuse()
        }
    }

    class Vector{ // vector math and physics if you prefer this over vector components on circles
        constructor(object = (new Point(0,0)), xmom = 0, ymom = 0){
            this.xmom = xmom
            this.ymom = ymom
            this.object = object
        }
        isToward(point){
            let link = new LineOP(this.object, point)
            let dis1 = link.sqrDis()
            let dummy = new Point(this.object.x+this.xmom, this.object.y+this.ymom)
            let link2 = new LineOP(dummy, point)
            let dis2 = link2.sqrDis()
            if(dis2 < dis1){
                return true
            }else{
                return false
            }
        }
        rotate(angleGoal){
            let link = new Line(this.xmom, this.ymom, 0,0)
            let length = link.hypotenuse()
            let x = (length * Math.cos(angleGoal))
            let y = (length * Math.sin(angleGoal))
            this.xmom = x
            this.ymom = y
        }
        magnitude(){
            return (new Line(this.xmom, this.ymom, 0,0)).hypotenuse()
        }
        normalize(size = 1){
            let magnitude = this.magnitude()
            this.xmom/=magnitude
            this.ymom/=magnitude
            this.xmom*=size
            this.ymom*=size
        }
        multiply(vect){
            let point = new Point(0,0)
            let end = new Point(this.xmom+vect.xmom, this.ymom+vect.ymom)
            return point.pointDistance(end)
        }
        add(vect){
            return new Vector(this.object, this.xmom+vect.xmom, this.ymom+vect.ymom)
        }
        subtract(vect){
            return new Vector(this.object, this.xmom-vect.xmom, this.ymom-vect.ymom)
        }
        divide(vect){
            return new Vector(this.object, this.xmom/vect.xmom, this.ymom/vect.ymom) //be careful with this, I don't think this is right
        }
        draw(){
            let dummy = new Point(this.object.x+this.xmom, this.object.y+this.ymom)
            let link = new LineOP(this.object, dummy, "#FFFFFF", 1)
            link.draw()
        }
    }
    class Line {
        constructor(x, y, x2, y2, color, width) {
            this.x1 = x
            this.y1 = y
            this.x2 = x2
            this.y2 = y2
            this.color = color
            this.width = width
        }
        angle() {
            return Math.atan2(this.y1 - this.y2, this.x1 - this.x2)
        }
        squareDistance() {
            let xdif = this.x1 - this.x2
            let ydif = this.y1 - this.y2
            let squareDistance = (xdif * xdif) + (ydif * ydif)
            return squareDistance
        }
        hypotenuse() {
            let xdif = this.x1 - this.x2
            let ydif = this.y1 - this.y2
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            if(hypotenuse < 10000000-1){
                if(hypotenuse > 1000){
                    return squaretable[`${Math.round(10*Math.round((hypotenuse*.1)))}`]
                }else{
                return squaretable[`${Math.round(hypotenuse)}`]
                }
            }else{
                return Math.sqrt(hypotenuse)
            }
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.x1, this.y1)
            canvas_context.lineTo(this.x2, this.y2)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class LineOP {
        constructor(object, target, color, width) {
            this.object = object
            this.target = target
            this.color = color
            this.width = width
        }
        squareDistance() {
            let xdif = this.object.x - this.target.x
            let ydif = this.object.y - this.target.y
            let squareDistance = (xdif * xdif) + (ydif * ydif)
            return squareDistance
        }
        hypotenuse() {
            let xdif = this.object.x - this.target.x
            let ydif = this.object.y - this.target.y
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            if(hypotenuse < 10000000-1){
                if(hypotenuse > 1000){
                    return squaretable[`${Math.round(10*Math.round((hypotenuse*.1)))}`]
                }else{
                return squaretable[`${Math.round(hypotenuse)}`]
                }
            }else{
                return Math.sqrt(hypotenuse)
            }
        }
        angle() {
            return Math.atan2(this.object.y - this.target.y, this.object.x - this.target.x)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.object.x, this.object.y)
            canvas_context.lineTo(this.target.x, this.target.y)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class Triangle {
        constructor(x, y, color, length, fill = 0, strokeWidth = 0, leg1Ratio = 1, leg2Ratio = 1, heightRatio = 1) {
            this.x = x
            this.y = y
            this.color = color
            this.length = length
            this.x1 = this.x + this.length * leg1Ratio
            this.x2 = this.x - this.length * leg2Ratio
            this.tip = this.y - this.length * heightRatio
            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
            this.fill = fill
            this.stroke = strokeWidth
        }
        draw() {
            canvas_context.strokeStyle = this.color
            canvas_context.stokeWidth = this.stroke
            canvas_context.beginPath()
            canvas_context.moveTo(this.x, this.y)
            canvas_context.lineTo(this.x1, this.y)
            canvas_context.lineTo(this.x, this.tip)
            canvas_context.lineTo(this.x2, this.y)
            canvas_context.lineTo(this.x, this.y)
            if (this.fill == 1) {
                canvas_context.fill()
            }
            canvas_context.stroke()
            canvas_context.closePath()
        }
        isPointInside(point) {
            if (point.x <= this.x1) {
                if (point.y >= this.tip) {
                    if (point.y <= this.y) {
                        if (point.x >= this.x2) {
                            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
                            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
                            this.basey = point.y - this.tip
                            this.basex = point.x - this.x
                            if (this.basex == 0) {
                                return true
                            }
                            this.slope = this.basey / this.basex
                            if (this.slope >= this.accept1) {
                                return true
                            } else if (this.slope <= this.accept2) {
                                return true
                            }
                        }
                    }
                }
            }
            return false
        }
    }
    class Rectangle {
        constructor(x, y, width, height, color, fill = 1, stroke = 0, strokeWidth = 1) {
            this.x = x
            this.y = y
            this.height = height
            this.width = width
            this.color = color
            this.xmom = 0
            this.ymom = 0
            this.stroke = stroke
            this.strokeWidth = strokeWidth
            this.fill = fill
        }
        draw() {
            canvas_context.fillStyle = this.color
            canvas_context.fillRect(this.x, this.y, this.width, this.height)
        }
        move() {
            this.x += this.xmom
            this.y += this.ymom
        }
        isPointInside(point) {
            if (point.x >= this.x) {
                if (point.y >= this.y) {
                    if (point.x <= this.x + this.width) {
                        if (point.y <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            if (point.x + point.radius >= this.x) {
                if (point.y + point.radius >= this.y) {
                    if (point.x - point.radius <= this.x + this.width) {
                        if (point.y - point.radius <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
    }
    class Circle {
        constructor(x, y, radius, color, xmom = 0, ymom = 0, friction = 1, reflect = 0, strokeWidth = 0, strokeColor = "transparent") {
            this.x = x
            this.y = y
            this.radius = radius
            this.color = color
            this.xmom = xmom
            this.ymom = ymom
            this.friction = friction
            this.reflect = reflect
            this.strokeWidth = strokeWidth
            this.strokeColor = strokeColor
        }
        draw() {
            canvas_context.lineWidth = this.strokeWidth
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath();
            if (this.radius > 0) {
                canvas_context.arc(this.x, this.y, this.radius, 0, (Math.PI * 2), true)
                canvas_context.fillStyle = this.color
                canvas_context.fill()
                canvas_context.stroke();
            } else {
                // console.log("The circle is below a radius of 0, and has not been drawn. The circle is:", this)
            }
        }

        moveloop() {
            if(this.x < 0){
                this.x = canvas.width-.0001
            }
            if(this.x > canvas.width){
                this.x = .001
            }
            if(this.y < 0){
                this.y = canvas.height-.0001
            }
            if(this.y > canvas.height){
                this.y = .001
            }
            this.x+=this.xmom
            this.y+=this.ymom
        }
        move() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
        }
        unmove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x -= this.xmom
            this.y -= this.ymom
        }
        frictiveMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
            this.xmom *= this.friction
            this.ymom *= this.friction
        }
        frictiveunMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.xmom /= this.friction
            this.ymom /= this.friction
            this.x -= this.xmom
            this.y -= this.ymom
        }
        isPointInside(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.radius * this.radius)) {
                return true
            }
            return false
        }
        doesPerimeterTouch(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= ((this.radius + point.radius) * (this.radius + point.radius))) {
                return true
            }
            return false
        }
    } 
    class CircleRing {
        constructor(x, y, radius, color, xmom = 0, ymom = 0, friction = 1, reflect = 0, strokeWidth = 0, strokeColor = "transparent") {
            this.x = x
            this.y = y
            this.radius = radius
            this.color = color
            this.xmom = xmom
            this.ymom = ymom
            this.friction = friction
            this.reflect = reflect
            this.strokeWidth = 10
            this.strokeColor = strokeColor
        }
        draw() {
            canvas_context.lineWidth = this.strokeWidth
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath();
            if (this.radius > 0) {
                canvas_context.arc(this.x, this.y, this.radius, 0, (Math.PI * 2), true)
                canvas_context.fillStyle = this.color
                canvas_context.fill()
                canvas_context.stroke();
            } else {
                console.log("The circle is below a radius of 0, and has not been drawn. The circle is:", this)
            }
        }
        move() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
        }
        unmove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x -= this.xmom
            this.y -= this.ymom
        }
        frictiveMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
            this.xmom *= this.friction
            this.ymom *= this.friction
        }
        frictiveunMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.xmom /= this.friction
            this.ymom /= this.friction
            this.x -= this.xmom
            this.y -= this.ymom
        }
        isPointInside(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.radius * this.radius)) {
                return true
            }
            return false
        }
        doesPerimeterTouch(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= ((this.radius + point.radius) * (this.radius + point.radius))) {
                return true
            }
            return false
        }
    } class Polygon {
        constructor(x, y, size, color, sides = 3, xmom = 0, ymom = 0, angle = 0, reflect = 0) {
            if (sides < 2) {
                sides = 2
            }
            this.reflect = reflect
            this.xmom = xmom
            this.ymom = ymom
            this.body = new Circle(x, y, size - (size * .293), "transparent")
            this.nodes = []
            this.angle = angle
            this.size = size
            this.color = color
            this.angleIncrement = (Math.PI * 2) / sides
            this.sides = sides
            for (let t = 0; t < sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
        }
        isPointInside(point) { // rough approximation
            this.body.radius = this.size - (this.size * .293)
            if (this.sides <= 2) {
                return false
            }
            this.areaY = point.y - this.body.y
            this.areaX = point.x - this.body.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.body.radius * this.body.radius)) {
                return true
            }
            return false
        }
        move() {
            if (this.reflect == 1) {
                if (this.body.x > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.body.x < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.body.x += this.xmom
            this.body.y += this.ymom
        }
        draw(nodes) {
            this.nodes = [...nodes]
            // this.nodes = []
            // this.angleIncrement = (Math.PI * 2) / this.sides
            // this.body.radius = this.size - (this.size * .293)
            // for (let t = 0; t < this.sides; t++) {
            //     let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
            //     this.nodes.push(node)
            //     this.angle += this.angleIncrement
            // }
            canvas_context.strokeStyle = this.color
            canvas_context.fillStyle = this.color
            canvas_context.lineWidth = 0
            canvas_context.beginPath()
            canvas_context.moveTo(this.nodes[0].x, this.nodes[0].y)
            for (let t = 1; t < this.nodes.length; t++) {
                canvas_context.lineTo(this.nodes[t].x, this.nodes[t].y)
            }
            canvas_context.lineTo(this.nodes[0].x, this.nodes[0].y)
            canvas_context.fill()
            canvas_context.stroke()
            canvas_context.closePath()
        }
    }
    class Shape {
        constructor(shapes) {
            this.shapes = shapes
        }
        draw() {
            for (let t = 0; t < this.shapes.length; t++) {
                this.shapes[t].draw()
            }
        }
        isPointInside(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].isPointInside(point)) {
                    return true
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].doesPerimeterTouch(point)) {
                    return true
                }
            }
            return false
        }
        innerShape(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].doesPerimeterTouch(point)) {
                    return this.shapes[t]
                }
            }
            return false
        }
        isInsideOf(box) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (box.isPointInside(this.shapes[t])) {
                    return true
                }
            }
            return false
        }
        adjustByFromDisplacement(x,y) {
            for (let t = 0; t < this.shapes.length; t++) {
                if(typeof this.shapes[t].fromRatio == "number"){
                    this.shapes[t].x+=x*this.shapes[t].fromRatio
                    this.shapes[t].y+=y*this.shapes[t].fromRatio
                }
            }
        }
        adjustByToDisplacement(x,y) {
            for (let t = 0; t < this.shapes.length; t++) {
                if(typeof this.shapes[t].toRatio == "number"){
                    this.shapes[t].x+=x*this.shapes[t].toRatio
                    this.shapes[t].y+=y*this.shapes[t].toRatio
                }
            }
        }
        mixIn(arr){
            for(let t = 0;t<arr.length;t++){
                for(let k = 0;k<arr[t].shapes.length;k++){
                    this.shapes.push(arr[t].shapes[k])
                }
            }
        }
        push(object) {
            this.shapes.push(object)
        }
    }

    class Spring {
        constructor(x, y, radius, color, body = 0, length = 1, gravity = 0, width = 1) {
            if (body == 0) {
                this.body = new Circle(x, y, radius, color)
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            } else {
                this.body = body
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            }
            this.gravity = gravity
            this.width = width
        }
        balance() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            if (this.beam.hypotenuse() < this.length) {
                this.body.xmom += (this.body.x - this.anchor.x) / this.length
                this.body.ymom += (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom -= (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom -= (this.body.y - this.anchor.y) / this.length
            } else {
                this.body.xmom -= (this.body.x - this.anchor.x) / this.length
                this.body.ymom -= (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom += (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom += (this.body.y - this.anchor.y) / this.length
            }
            let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
            this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
            this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
            this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
        }
        draw() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            this.beam.draw()
            this.body.draw()
            this.anchor.draw()
        }
        move() {
            this.anchor.ymom += this.gravity
            this.anchor.move()
        }

    }  
    class SpringOP {
        constructor(body, anchor, length, width = 3, color = body.color) {
            this.body = body
            this.anchor = anchor
            this.beam = new LineOP(body, anchor, color, width)
            this.length = length
        }
        balance() {
            if (this.beam.hypotenuse() < this.length) {
                this.body.xmom += ((this.body.x - this.anchor.x) / this.length) 
                this.body.ymom += ((this.body.y - this.anchor.y) / this.length) 
                this.anchor.xmom -= ((this.body.x - this.anchor.x) / this.length) 
                this.anchor.ymom -= ((this.body.y - this.anchor.y) / this.length) 
            } else if (this.beam.hypotenuse() > this.length) {
                this.body.xmom -= (this.body.x - this.anchor.x) / (this.length)
                this.body.ymom -= (this.body.y - this.anchor.y) / (this.length)
                this.anchor.xmom += (this.body.x - this.anchor.x) / (this.length)
                this.anchor.ymom += (this.body.y - this.anchor.y) / (this.length)
            }

            let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
            this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
            this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
            this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
        }
        draw() {
            this.beam.draw()
        }
        move() {
            //movement of SpringOP objects should be handled separate from their linkage, to allow for many connections, balance here with this object, move nodes independently
        }
    }

    class Color {
        constructor(baseColor, red = -1, green = -1, blue = -1, alpha = 1) {
            this.hue = baseColor
            if (red != -1 && green != -1 && blue != -1) {
                this.r = red
                this.g = green
                this.b = blue
                if (alpha != 1) {
                    if (alpha < 1) {
                        this.alpha = alpha
                    } else {
                        this.alpha = alpha / 255
                        if (this.alpha > 1) {
                            this.alpha = 1
                        }
                    }
                }
                if (this.r > 255) {
                    this.r = 255
                }
                if (this.g > 255) {
                    this.g = 255
                }
                if (this.b > 255) {
                    this.b = 255
                }
                if (this.r < 0) {
                    this.r = 0
                }
                if (this.g < 0) {
                    this.g = 0
                }
                if (this.b < 0) {
                    this.b = 0
                }
            } else {
                this.r = 0
                this.g = 0
                this.b = 0
            }
        }
        normalize() {
            if (this.r > 255) {
                this.r = 255
            }
            if (this.g > 255) {
                this.g = 255
            }
            if (this.b > 255) {
                this.b = 255
            }
            if (this.r < 0) {
                this.r = 0
            }
            if (this.g < 0) {
                this.g = 0
            }
            if (this.b < 0) {
                this.b = 0
            }
        }
        randomLight() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12) + 4)];
            }
            var color = new Color(hash, 55 + Math.random() * 200, 55 + Math.random() * 200, 55 + Math.random() * 200)
            return color;
        }
        randomDark() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12))];
            }
            var color = new Color(hash, Math.random() * 200, Math.random() * 200, Math.random() * 200)
            return color;
        }
        random() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 16))];
            }
            var color = new Color(hash, Math.random() * 255, Math.random() * 255, Math.random() * 255)
            return color;
        }
    }
    class Softbody { //buggy, spins in place
        constructor(x, y, radius, color, size, members = 10, memberLength = 5, force = 10, gravity = 0) {
            this.springs = []
            this.pin = new Circle(x, y, radius, color)
            this.points = []
            this.flop = 0
            let angle = 0
            this.size = size 
            let line = new Line((Math.cos(angle)*size), (Math.sin(angle)*size), (Math.cos(angle+ ((Math.PI*2)/members))*size), (Math.sin(angle+ ((Math.PI*2)/members))*size) )
            let distance = line.hypotenuse()
            for(let t =0;t<members;t++){
                let circ = new Circle(x+(Math.cos(angle)*size), y+(Math.sin(angle)*size), radius, color)
                circ.reflect = 1
                circ.bigbody = new Circle(x+(Math.cos(angle)*size), y+(Math.sin(angle)*size), distance, color)
                circ.draw()
                circ.touch = []
                this.points.push(circ)
                angle += ((Math.PI*2)/members)
            }

            for(let t =0;t<this.points.length;t++){
                for(let k =0;k<this.points.length;k++){
                    if(t!=k){
                        if(this.points[k].bigbody.doesPerimeterTouch(this.points[t])){
                        if(!this.points[k].touch.includes(t) && !this.points[t].touch.includes(k)){
                                let spring = new SpringOP(this.points[k], this.points[t], (size*Math.PI)/members, 2, color)
                                this.points[k].touch.push(t)
                                this.points[t].touch.push(k)
                                this.springs.push(spring)
                                spring.beam.draw()
                            }
                        }
                    }
                }
            }

            // console.log(this)

            // this.spring = new Spring(x, y, radius, color, this.pin, memberLength, gravity)
            // this.springs.push(this.spring)
            // for (let k = 0; k < members; k++) {
            //     this.spring = new Spring(x, y, radius, color, this.spring.anchor, memberLength, gravity)
            //     if (k < members - 1) {
            //         this.springs.push(this.spring)
            //     } else {
            //         this.spring.anchor = this.pin
            //         this.springs.push(this.spring)
            //     }
            // }
            this.forceConstant = force
            this.centroid = new Circle(0, 0, 10, "red")
        }
        circularize() {
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            this.angle = 0
            this.angleIncrement = (Math.PI * 2) / this.springs.length
            for (let t = 0; t < this.points.length; t++) {
                this.points[t].x = this.centroid.x + (Math.cos(this.angle) * this.forceConstant)
                this.points[t].y = this.centroid.y + (Math.sin(this.angle) * this.forceConstant)
                this.angle += this.angleIncrement 
            }
        }
        balance() {
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.points.length; s++) {
                this.xpoint += (this.points[s].x / this.points.length)
                this.ypoint += (this.points[s].y / this.points.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            // this.centroid.x += TIP_engine.x / this.points.length
            // this.centroid.y += TIP_engine.y / this.points.length
            for (let s = 0; s < this.points.length; s++) {
                this.link = new LineOP(this.points[s], this.centroid, 0, "transparent")
                if (this.link.hypotenuse() != 0) {

                    if(this.size < this.link.hypotenuse()){
                        this.points[s].xmom -= (Math.cos(this.link.angle())*(this.link.hypotenuse())) * this.forceConstant*.1
                        this.points[s].ymom -= (Math.sin(this.link.angle())*(this.link.hypotenuse())) * this.forceConstant*.1
                    }else{
                        this.points[s].xmom += (Math.cos(this.link.angle())*(this.link.hypotenuse())) * this.forceConstant*.1
                        this.points[s].ymom += (Math.sin(this.link.angle())*(this.link.hypotenuse())) * this.forceConstant*.1
                    }

                    // this.points[s].xmom += (((this.points[s].x - this.centroid.x) / (this.link.hypotenuse()))) * this.forceConstant
                    // this.points[s].ymom += (((this.points[s].y - this.centroid.y) / (this.link.hypotenuse()))) * this.forceConstant
                }
            }
            if(this.flop%2 == 0){
                for (let s =  0; s < this.springs.length; s++) {
                    this.springs[s].balance()
                }
            }else{
                for (let s = this.springs.length-1;s>=0; s--) {
                    this.springs[s].balance()
                }
            }
            for (let s = 0; s < this.points.length; s++) {
                this.points[s].move()
                this.points[s].draw()
            }
            for (let s =  0; s < this.springs.length; s++) {
                this.springs[s].draw()
            }
            this.centroid.draw()
        }
    }
    class Observer {
        constructor(x, y, radius, color, range = 100, rays = 10, angle = (Math.PI * .125)) {
            this.body = new Circle(x, y, radius, color)
            this.color = color
            this.ray = []
            this.rayrange = range
            this.globalangle = Math.PI
            this.gapangle = angle
            this.currentangle = 0
            this.obstacles = []
            this.raymake = rays
        }
        beam() {
            this.currentangle = this.gapangle / 2
            for (let k = 0; k < this.raymake; k++) {
                this.currentangle += (this.gapangle / Math.ceil(this.raymake / 2))
                let ray = new Circle(this.body.x, this.body.y, 1, "white", (((Math.cos(this.globalangle + this.currentangle)))), (((Math.sin(this.globalangle + this.currentangle)))))
                ray.collided = 0
                ray.lifespan = this.rayrange - 1
                this.ray.push(ray)
            }
            for (let f = 0; f < this.rayrange; f++) {
                for (let t = 0; t < this.ray.length; t++) {
                    if (this.ray[t].collided < 1) {
                        this.ray[t].move()
                        for (let q = 0; q < this.obstacles.length; q++) {
                            if (this.obstacles[q].isPointInside(this.ray[t])) {
                                this.ray[t].collided = 1
                            }
                        }
                    }
                }
            }
        }
        draw() {
            this.beam()
            this.body.draw()
            canvas_context.lineWidth = 1
            canvas_context.fillStyle = this.color
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath()
            canvas_context.moveTo(this.body.x, this.body.y)
            for (let y = 0; y < this.ray.length; y++) {
                canvas_context.lineTo(this.ray[y].x, this.ray[y].y)
                canvas_context.lineTo(this.body.x, this.body.y)
            }
            canvas_context.stroke()
            canvas_context.fill()
            this.ray = []
        }
    }
    function setUp(canvas_pass, style = "#000000") {
        canvas = canvas_pass
        canvas_context = canvas.getContext('2d');
        canvas.style.background = style
        booter.main = main
        document.addEventListener('keydown', (event) => {
            keysPressed[event.key] = true;
        });
        document.addEventListener('keyup', (event) => {
            delete keysPressed[event.key];
        });
        window.addEventListener('pointerdown', e => {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            // TIP_engine.x = XS_engine
            // TIP_engine.y = YS_engine
            // TIP_engine.body = TIP_engine
            // example usage: if(object.isPointInside(TIP_engine)){ take action }
        });
        window.addEventListener('pointermove', continued_stimuli);

        window.addEventListener('pointerup', e => {
            // window.removeEventListener("pointermove", continued_stimuli);
        })
        function continued_stimuli(e) {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            // TIP_engine.x = XS_engine
            // TIP_engine.y = YS_engine
            // TIP_engine.body = TIP_engine
        }
    }
    function gamepad_control(object, speed = 1) { // basic control for objects using the controler
//         console.log(gamepadAPI.axesStatus[1]*gamepadAPI.axesStatus[0]) //debugging
        if (typeof object.body != 'undefined') {
            if(typeof (gamepadAPI.axesStatus[1]) != 'undefined'){
                if(typeof (gamepadAPI.axesStatus[0]) != 'undefined'){
                object.body.x += (gamepadAPI.axesStatus[0] * speed)
                object.body.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        } else if (typeof object != 'undefined') {
            if(typeof (gamepadAPI.axesStatus[1]) != 'undefined'){
                if(typeof (gamepadAPI.axesStatus[0]) != 'undefined'){
                object.x += (gamepadAPI.axesStatus[0] * speed)
                object.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        }
    }
    function control(object, speed = 1) { // basic control for objects
        if (typeof object.body != 'undefined') {
            if (keysPressed['w']) {
                object.body.y -= speed
            }
            if (keysPressed['d']) {
                object.body.x += speed
            }
            if (keysPressed['s']) {
                object.body.y += speed
            }
            if (keysPressed['a']) {
                object.body.x -= speed
            }
        } else if (typeof object != 'undefined') {
            if (keysPressed['w']) {
                object.y -= speed
            }
            if (keysPressed['d']) {
                object.x += speed
            }
            if (keysPressed['s']) {
                object.y += speed
            }
            if (keysPressed['a']) {
                object.x -= speed
            }
        }
    }
    function getRandomLightColor() { // random color that will be visible on  black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12) + 4)];
        }
        return color;
    }
    function getRandomColor() { // random color
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 16) + 0)];
        }
        return color;
    }
    function getRandomDarkColor() {// color that will be visible on a black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 9))];
        }
        return color;
    }
    function castBetween(from, to, granularity = 10, radius = 1) { //creates a sort of beam hitbox between two points, with a granularity (number of members over distance), with a radius defined as well
            let limit = granularity
            let shape_array = []
            for (let t = 0; t < limit; t++) {
                let circ = new Circle((from.x * (t / limit)) + (to.x * ((limit - t) / limit)), (from.y * (t / limit)) + (to.y * ((limit - t) / limit)), radius, "red")
                circ.toRatio = t/limit
                circ.fromRatio = (limit-t)/limit
                shape_array.push(circ)
            }
            return (new Shape(shape_array))
    }

    let setup_canvas =  document.createElement("CANVAS"); //getting canvas from document
    setup_canvas.width = 1280
    setup_canvas.height = 720
    setup_canvas.hidden = true
    setUp(setup_canvas) // setting up canvas refrences, starting timer. 

    // object instantiation and creation happens here 

    class Eovlight {
        constructor(x,y, r,g,b,radius){
            this.r = r
            this.g = g
            this.b = b
            this.parent = {}
            this.children = []
            this.body = new Circle(x,y,radius,`rgb(${this.r}, ${this.g}, ${this.b})`, (Math.random()-.5), Math.random()-.5)
            this.health = (Math.random()*11)+100
            this.maxhealth = this.health
            this.attack = (Math.random()*1)+1
            this.healthbar = new Rectangle(this.body.x-this.body.radius, this.body.y-this.body.radius*1.5, this.body.radius*2, this.body.radius*.1, `rgb(${255-((this.health/this.maxhealth)*255)}, ${((this.health/this.maxhealth)*255)}, 0)`)
        }
        reproduce(){
            let eov = new Eovlight(this.body.x, this.body.y, this.r+((Math.random()-.5)*35),this.g+((Math.random()-.5)*35),this.b+((Math.random()-.5)*35),this.body.radius+((Math.random()-.4)*3.2))
            eov.attack = this.attack+((Math.random()-.6)*.2)
            eov.health = this.maxhealth+((Math.random()-.6)*20)
            eov.maxhealth = eov.health
            eov.parent = this

            // eov.body.xmom =( (eov.body.xmom *.4) + (this.body.xmom*.6))*1.4
            // eov.body.ymom = ((eov.body.ymom *.4) + (this.body.ymom*.6))*1.4
            this.children.push(eov)
            lights.push(eov)
            // console.log(lights)
        }
        rep(){

            if(this.repmark == 1){
                this.reproduce()
                this.repmark = 0
            }
        }
        draw(){
            for(let t = 0;t<lights.length;t++){
                if(this!=lights[t]){
                    if(this.children.includes(lights[t]) || lights[t] == this.parent || lights[t].parent == this.parent ){
                        continue
                    }
                    if(this.body.doesPerimeterTouch(lights[t].body)){
                        this.health-=lights[t].attack
                        if(this.health < 0){
                            lights[t].repmark = 1
                        }
                        lights[t].health -= this.attack
                        if(lights[t].health < 0){
                            this.repmark = 1
                        }
                    }
                }
    
            }
            for(let t = 0;t<foods.length;t++){
                    if(this.body.doesPerimeterTouch(foods[t])){
                        foods.splice(t,1)
                        this.reproduce()
                    }
            }
            
            if(this.health <= 0){
                this.marked = 1
            }

            if(this.health < this.maxhealth){
                this.health *= 1.01
            }
            this.healthbar = new Rectangle(this.body.x-this.body.radius, this.body.y-this.body.radius*1.5, (this.body.radius*2) *(this.health/this.maxhealth) , this.body.radius*.1, `rgb(${255-((this.health/this.maxhealth)*255)}, ${((this.health/this.maxhealth)*255)}, 0)`)

            canvas_context.font = '8px arial'
            canvas_context.fillStyle = "white"
            canvas_context.fillText(Math.round(this.health)+'/'+Math.round(this.maxhealth), this.body.x-this.body.radius, this.body.y-this.body.radius*1.9)
            canvas_context.fillText(Math.round((this.attack*10))/10, this.body.x-this.body.radius, this.body.y-this.body.radius*2.9)
            this.body.moveloop()
            this.body.draw()
            this.healthbar.draw()

        }
        clean(){

            if(this.health <= 0){
                this.marked = 1
            }

            if(this.marked == 1){
                lights.splice(lights.indexOf(this), 1)
            }
        }
    }
    

    let lights = []
    for(let t = 0;t<20;t++){
        lights.push(new Eovlight(Math.random()*canvas.width, Math.random()*canvas.height, Math.random()*255,Math.random()*255,Math.random()*255, (Math.random()*1)+8))
    }

    let foods = []

    for(let t = 0;t<20;t++){
        let food = new Circle(Math.random()*canvas.width, Math.random()*canvas.height, 3, "white")
        foods.push(food)
    }

    function main() {
        
        if(booter.running == 0){
            return
        }
        canvas_context.clearRect(0, 0, canvas.width, canvas.height)  // refreshes the image
        gamepadAPI.update() //checks for button presses/stick movement on the connected controller)
        // // game code goes here
        windowspares[booter.index] = canvas
        if(Math.random()<.05){

        let food = new Circle(Math.random()*canvas.width, Math.random()*canvas.height, 3, "white")
        foods.push(food)
        }
        for(let t = 0;t<foods.length;t++){
            foods[t].draw()
        }
        for(let t = 0;t<lights.length;t++){
            if(lights[t].body.radius < 1){
                lights[t].body.radius = 1
            }
            lights[t].draw()
        }
        for(let t = 0;t<lights.length;t++){
            if(Math.random()<.0100){
                lights[t].rep()
            }
        }
        for(let t = 0;t<lights.length;t++){
            lights[t].clean()
        }
   
    }
        }
    }

        print(){
            canvas_context.measureText(this.name)
            canvas_context.font = "10px arial"
            canvas_context.fillStyle = "#FFFFFF"
            let xdif = canvas_context.measureText(this.name).width
            canvas_context.fillText(this.name, this.body.x - xdif*.5, this.body.y-this.body.radius*1.1)
        }
        draw(){
            this.body.draw()

            if(this.running == 1){
                this.main()
                if(windowspares[this.index].width > 0){
                    canvas_context.drawImage(windowspares[this.index], 0, 0, windowspares[this.index].width, windowspares[this.index].height, this.window.x,this.window.y,this.window.width, this.window.height)
                    this.window.draw()
                }
            }
            if(this.marked == 1){
                this.move(TIP_engine)
                if(this.ran == 0){
                    this.ran = 1
                    this.run(this)
                    this.window = new Rectangle(100,100, 256, 144, "transparent")

                    if(this.index == 0){
                        this.window = new Rectangle(10,10, 700, 700, "transparent")

                    }
                }else{
                    this.running = 1
                }
            }
        }
    }



    let icons = []
    for(let t=  0;t<5;t++){
        let icon = new Icon(1100, 100+t*100)
        icon.index = t
        icons.push(icon)
    }

    function main() {
        canvas_context.clearRect(0, 0, canvas.width, canvas.height)  // refreshes the image
        gamepadAPI.update() //checks for button presses/stick movement on the connected controller)
        // // game code goes here
        for(let t = 0;t<icons.length;t++){
            icons[t].draw()
        }
        for(let t = 0;t<icons.length;t++){
            icons[t].print()
        }
    }
})
