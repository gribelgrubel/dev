// Bouncing, animated Type
// Frederik Engelbrecht, 2020, für den Rundgang Finkenau SoSe 20
// Based upon https://www.html5canvastutorials.com/advanced/html5-canvas-bouncing-balls/

$(document).ready(function () {
    //var font = new FontFaceObserver('PX Grotesk', {style: "oblique"});
    var fontA = new FontFaceObserver('PX Grotesk', {style: "normal"});
    var fontB = new FontFaceObserver('PX Grotesk', {style: "oblique"});
    //font.load().then(function () {
    //console.log('Font is available');
    Promise.all([fontA.load(), fontB.load()]).then(function () {


    var canvas = document.querySelector('#animCanvas');
    var ctx = canvas.getContext('2d');

    var width = canvas.width = window.innerWidth;
    var height = canvas.height = window.innerHeight;
    //console.log(width +", "+ height);
    var delay = 200; //delay between words coming onto screen
    var colors = ["rgb(245,255,42)", "rgb(185,184,184)", "rgb(90,220,129)", "rgb(174,54,248)", "rgb(231,95,42)", "rgb(0,65,236)"];
    var words = ["the", "end(s)", "of", "the", "world", "?"];
    //words = ["the", "world"];
    var state = 0; //UNUSED; 0 ends; 1 galerie; 2 team; 3 see you soon;
    var wordCount = words.length;
    var word;
    var fontSize; //this is dynamic based on screen dimensions, filled in resizeCanvas()
    var targetFontSize; // the value to grow/shrink fontSize to
    var minFontSize; // the smallest the font should be, based on fontSize
    var maxFontSize;
    var letterSpacing = 0.8;   //was 0.85 - now narrower to account for some ausgleich with letterspacing per letterstyle
    var letterEasing = 0.05; //amount of easing when letters jump to new positions on edgeCollision
    var minLineWidth = height/500;  //was 1.5 for 1920x1080res
    var maxLineWidth = height/220; //was 4.0
    var scrollThreshold = 80;   //threshold after which font should change state from big/small and vice versa
    var portraitMode = 0;
    if (window.screen.width * window.devicePixelRatio > window.screen.height * window.devicePixelRatio) { //initialization, larger width
        fontSize = Math.round(height / 2);
        minFontSize = Math.round(fontSize / 4);
        maxFontSize = Math.round(fontSize);
        minLineWidth = height/500;
        maxLineWidth = height/220;
        portraitMode = 0;
    } else {    //initialization for canvas larger height
        fontSize = Math.round(width / 3.5);
        minFontSize = Math.round(fontSize / 3);
        maxFontSize = Math.round(fontSize);
        minLineWidth = height/400;
        maxLineWidth = height/250;
        portraitMode = 1;
    }
    //console.log("minLineWidth: "+minLineWidth+" maxLineWidth: "+maxLineWidth);
    var verticalOffsetMult = minFontSize / maxFontSize; // used for letter y-offset when scaling
    var fontStyle = "normal"; // normal or oblique, alternating on edgecollision
    ctx.font = "normal " + fontSize + "px PX Grotesk";  // only for font initialization
    ctx.strokeStyle = "black";
    var lineWidth = maxLineWidth;
    var targetLineWidth = maxLineWidth;
    var scroll; //gets scroll distance from top

    // function to generate random number
    function random(min, max) {
        var num = Math.floor(Math.random() * (max - min)) + min;
        // if min = 10 max = 15 random var = 0.1544465; it will return approzimately 10 because of math.floor
        return num;
    }

    function humanize(x) { //unused
        return x.toFixed(2).replace(/\?0*$/, '');
    }

    function getMinTextWidth(object) {
        var text;
        var localLetterSpacing = 1;
        if (object.hasOwnProperty("word")) { //if passed object is word
            text = object.word;
            localLetterSpacing = letterSpacing;
            //console.log(letterSpacing);
        } else if (object.hasOwnProperty("letter")) { //if passed object is letter
            text = object.letter;
        }
        //var minFontSize = minFontSize;
        var localFontStyle = object.fontStyle;
        ctx.font = localFontStyle + " " + minFontSize + "px PX Grotesk";
        ctx.fillText(text, 0, -height); //paint above canvas, out of sight
        var newMinTextWidth = Math.round(ctx.measureText(text).width * localLetterSpacing);
        //var newMinTextWidth = (Math.abs(ctx.measureText(text).actualBoundingBoxLeft) + Math.abs(ctx.measureText(text).actualBoundingBoxRight));  //uses bounding boxes
        //console.log("returned minTextWidth: "+newMinTextWidth);
        
        //DEV METHOD: adjust letterwidth individually (to adjust letter's right distance to next neighbor)
        switch (object.letter) {    // letters regardless of style
            case "l":
                newMinTextWidth -= (newMinTextWidth/100) * 10;
                break;
            case "(":
                newMinTextWidth -= (newMinTextWidth/100) * 30;
                break;
            case "s":
                newMinTextWidth -= (newMinTextWidth/100) * 20;
                break;
            }
        
        if (object.fontStyle == "normal") { // only normal-styled letters
            switch (object.letter) {
                case "l":
                    newMinTextWidth -= (newMinTextWidth/100) * 22;
                    break;
                case "w":
                    newMinTextWidth += (newMinTextWidth/100) * 8;
                    break;   
            }
            //newMinTextWidth += (newMinTextWidth/100) * 5;  //add some when next letter is pixel
            
        } else if (object.fontStyle == "oblique") { // only pixel-styled letters
            switch (object.letter) {
                case "d":
                    newMinTextWidth += (newMinTextWidth/100) * 5;
                    break;
                case "h":
                    newMinTextWidth += (newMinTextWidth/100) * 5;
                    break;
                case "w":
                    newMinTextWidth += (newMinTextWidth/100) * 10;
                    break;
                case "r":
                    newMinTextWidth += (newMinTextWidth/100) * 10;
                    break;
                case "(":
                    newMinTextWidth -= (newMinTextWidth/100) * 5;
                    break;
                case "s":
                    newMinTextWidth += (newMinTextWidth/100) * 15;
                    break;
                case "t":
                    newMinTextWidth -= (newMinTextWidth/100) * 5;
                    break;
                case "n":
                    newMinTextWidth += (newMinTextWidth/100) * 3;
                    break;
            }
            //newMaxTextWidth += Math.round((newMaxTextWidth/100) * 20);  //add some when next letter is normal   
        }
        
        return Math.round(newMinTextWidth);
    }

    function getMaxTextWidth(object) {
        var text;
        var localLetterSpacing = 1;
        if (object.hasOwnProperty("word")) {
            text = object.word;
            localLetterSpacing = letterSpacing;
        } else if (object.hasOwnProperty("letter")) {
            text = object.letter;
        }
        //var maxFontSize = maxFontSize;
        var localFontStyle = object.fontStyle;
        ctx.font = localFontStyle + " " + maxFontSize + "px PX Grotesk";
        ctx.fillText(text, 0, -height); //paint above canvas, out of sight
        var newMaxTextWidth = Math.round(ctx.measureText(text).width * localLetterSpacing);
        //console.log("returned maxTextWidth: "+newMaxTextWidth);
        
        //DEV METHOD: adjust letterwidth individually (to adjust letter's right distance to next neighbor)
        switch (object.letter) {    // letters regardless of style
            case "l":
                newMaxTextWidth -= (newMaxTextWidth/100) * 25;
                break;
            case "(":
                newMaxTextWidth -= (newMaxTextWidth/100) * 30;
                break;
            case "s":
                newMaxTextWidth -= (newMaxTextWidth/100) * 20;
                break;
            }
        
        if (object.fontStyle == "normal") { // only normal-styled letters
            switch (object.letter) {
                case "l":
                    newMaxTextWidth -= (newMaxTextWidth/100) * 22;
                    break;
                case "w":
                    newMaxTextWidth += (newMaxTextWidth/100) * 8;
                    break;   
            }
            //newMaxTextWidth -= Math.round((newMaxTextWidth/100) * 10);  //subtract some when next letter is pixel
            
        } else if (object.fontStyle == "oblique") { // only pixel-styled letters
            switch (object.letter) {
                case "h":
                    newMaxTextWidth += (newMaxTextWidth/100) * 5;
                    break;
                case "w":
                    newMaxTextWidth += (newMaxTextWidth/100) * 10;
                    break;
                case "r":
                    newMaxTextWidth += (newMaxTextWidth/100) * 5;
                    break;
                case "(":
                    newMaxTextWidth -= (newMaxTextWidth/100) * 5;
                    break;
                case "s":
                    newMaxTextWidth += (newMaxTextWidth/100) * 15;
                    break;
                case "t":
                    newMaxTextWidth -= (newMaxTextWidth/100) * 5;
                    break;
                case "n":
                    newMaxTextWidth += (newMaxTextWidth/100) * 3;
                    break;
            }
            //newMaxTextWidth += Math.round((newMaxTextWidth/100) * 20);  //add some when next letter is normal   
        }
        
        return Math.round(newMaxTextWidth);
    }

    // called after velocity inversion (edge detection), gets object's font style and toggles it
    function fontStyleChange(object) {
        //rewritten to apply to child letter object instead of word
        var letterCount = object.letters.length;
        for (n = 0; n < letterCount; n++) {
            var currLett = object.letters[n];
            var textStyle = currLett.fontStyle;
            if (textStyle == "normal") {
                textStyle = "oblique";
            } else {
                textStyle = "normal";
            }
            currLett.fontStyle = textStyle;
            //here we need to call the widthChange function to calculate new letter width for current style, and pass that to the word when it draws the letters
            currLett.minTextWidth = getMinTextWidth(currLett);
            currLett.maxTextWidth = getMaxTextWidth(currLett);
            
            //to prevent font from resetting to targetValue, ask scroll pos and instantly set value to new targetsize
            if (document.body.scrollTop > scrollThreshold || document.documentElement.scrollTop > scrollThreshold) {
                currLett.targetLetterWidth = currLett.minTextWidth;
                currLett.letterWidth = currLett.minTextWidth;
            } else if (document.body.scrollTop < scrollThreshold+1 || document.documentElement.scrollTop < scrollThreshold+1) {
                currLett.targetLetterWidth = currLett.maxTextWidth;
                currLett.letterWidth = currLett.maxTextWidth;
            }
            //console.log(currLett.letter + " " + currLett.minTextWidth + " " + currLett.maxTextWidth);
            //console.log(object.letters[n].letter+" mintextwidth: "+object.letters[n].minTextWidth);
        }
    }

    function letterPosChange(object) {
        var valueClamp = 2; //random num gets pulled from -valueClamp to valueClamlp range
        var letterCount = object.letters.length;
        var fontSizeMult = (fontSize * verticalOffsetMult) * 0.1; //scaling factor to account for min-max fontSize
        for (q = 0; q < letterCount; q++) {
            var currLett = object.letters[q];
            // below: disabled indiv letter randommove on eckenditsch
            // for x+y values: rounding to integers prevents inprecise vis and makes the animation look smooth!
            //currLett.newY = Math.round(random(-valueClamp * fontSizeMult, valueClamp * fontSizeMult));
            //currLett.newX = Math.round(random(-valueClamp/2 * fontSizeMult, valueClamp/2 * fontSizeMult)); //slightly smaller valuespace to keep readable
        }
    }

    //used on Ball words, calculates the child letters' width, sums them and returns the new width
    function widthChange(object, mode) {
        var letterWidthSum = []; //array to store all child letters' width
        var characterCount = object.characters.length;
        var newWidth; //this is the target width?
        var text = object.word;
        var arbitraryValue = 0.1; //subtracted from letterSpacing because the calculated with is a bit too large

        if (mode == "grow") {
            for (m = 0; m < characterCount; m++) {
                var currLetter = object.letters[m];
                newWidth = getMaxTextWidth(currLetter)*letterSpacing;
                //console.log(currLetter.letter+" growing to: "+newWidth);
                letterWidthSum.push(newWidth);
            }
        } else if (mode == "shrink") {
            for (m = 0; m < characterCount; m++) {
                var currLetter = object.letters[m];
                newWidth = getMinTextWidth(currLetter)*letterSpacing;
                //console.log(currLetter.letter+" shrinking to: "+newWidth);
                letterWidthSum.push(newWidth);
            }
        }
        var wordWidth = letterWidthSum.reduce(function (accumulator, currentValue) {
            return accumulator + currentValue
        }, 0) /** (letterSpacing - arbitraryValue)*/;
        //console.log("widthChange for "+object.word+" returns "+wordWidth);
        return wordWidth;
    }


    function Ball(identifier) {
        this.x = random(0, -width); //ONLY FOR INITIALIZATION;
        this.y = random(0 + fontSize/1.45, height); //was 0, height; but this makes things get stuck
        this.velX = random(-3, -3); //was -7,7; now only positive to make things slide in from beyond the left canvas border
        this.velY = random(-1, 1);
        // edge case 2 do: if (-1 < velocity < 1 )
        this.color = colors[identifier];
        this.size = 1; //lower left edge, only for dev purposes
        this.word = words[identifier];
        this.index = identifier;
        this.fontStyle = "normal";
        this.textWidth = Math.round(getMaxTextWidth(this)); // for initialization only
        this.targetTextWidth = Math.round(this.textWidth); // gets changed on scroll to grow/ shrink letter spacing & word boundaries
        this.minTextWidth = Math.round(getMinTextWidth(this));
        this.maxTextWidth = Math.round(getMaxTextWidth(this));

        if (!portraitMode) {
            this.x = -this.textWidth * 1.2; //was textWidth * 2; REAL spawn point outside of canvas based on final textWidth value
        } else {
            this.x = -this.textWidth * 2;
            this.velX = -2;
        }
        

        this.justSpawned = true;
        this.introState = true; // true when spawning for as long as the word is outside the canvas bounds, to prevent getting stuck in velocity switching
        this.timeCount = 0; //counting up to delay;

        // below: individual letters as child elements
        this.characters = Array.from(this.word); //split word array into single letters
        this.letters = []; //array to be filled with letter objects

        this.getLetters = function () {
            var charCount = this.characters.length;
            var LetterFontStyle;

            for (j = 0; j < charCount; j++) { //don't use same counter var as the parent loop where this gets called!
                var currChar = this.characters[j];
                if (j % 2 === 0) { // index is even
                    LetterFontStyle = "oblique";
                } else {
                    LetterFontStyle = "normal"
                }
                var letter = new Letter(currChar, /*this.color,*/ LetterFontStyle);
                this.letters.push(letter);
            }
            this.fontStyle = fontStyleChange(this);
            this.fontStyle = fontStyleChange(this);
        }
    }

        
    // single letter constructor, get created inside Ball word object
    function Letter(character, /*color,*/ localFontStyle) {
        this.x = 0; //relative to parent container origin: origin + this.margin + this.width
        this.y = 0; //random(-40, 40); //relative to parent container origin: origin + this.margin + this.height
        this.newX = this.x;
        this.newY = this.y;
        this.origY = this.y;
        this.velX = 0;
        this.velY = 0;
        this.margin; //maybe percentage of fontSize?
        //this.color = color //inherit container Ball color; needed?
        this.letter = character;
        this.fontStyle = localFontStyle;
        this.minTextWidth = getMinTextWidth(this);
        //console.log("min: "+this.minTextWidth);
        this.maxTextWidth = getMaxTextWidth(this);
        //console.log("max: "+this.maxTextWidth);
        this.letterWidth = this.maxTextWidth; //initial, since text starts big
        this.targetLetterWidth = this.maxTextWidth;
    }

        
    Letter.prototype.update = function () {
        if (this.letterWidth < this.targetLetterWidth) {
            this.letterWidth++;
            this.y = this.origY;
        } else if (this.letterWidth > this.targetLetterWidth) {
            this.letterWidth--;
            this.targetY = this.origY * verticalOffsetMult;
            if (this.y > this.targetY) {
                this.y = this.y * verticalOffsetMult;
            }
        }

        if (this.x < this.newX) {
            //var dx = this.newX-this.x;
            //this.x += dx*letterEasing;
            this.x++;
        } else if (this.x > this.newX) {
            //var dx = this.newX-this.x;
            //this.x -= dx*letterEasing;
            this.x--;
        }
        if (this.y < this.newY) {
            //this.y++;
            var dy = this.newY - this.y;
            this.y += dy * letterEasing;
        } else if (this.y > this.newY) {
            //this.y--;
            var dy = this.newY - this.y;
            this.y += dy * letterEasing; 
            //this.y -= dy * letterEasing; //this makes the letters fall down, offscreen - maybe useful for a remove animation?
        }
    }


    Ball.prototype.draw = function () {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        //ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI); //text origin: bottom left corner (canvas gets drawn from top left)
        //ctx.strokeRect(this.x, this.y - fontSize, this.textWidth, fontSize); //object boundaries
        ctx.fill();
        //ctx.font = this.fontStyle + " " + fontSize + "px PX Grotesk"; //works, but assigns single fontstyle to all letters
        ctx.lineWidth = lineWidth; //dynamic lineWidth depending on fontSize

        //NEW: FEATURING SINGLE LETTERS
        var textWidthSum = []; //collects letter widths to get new start x for next letter
        var letterCount = this.letters.length;
        for (k = 0; k < letterCount; k++) {
            var currLett = this.letters[k];
            ctx.font = currLett.fontStyle + " " + fontSize + "px PX Grotesk";
            var currX;
            currX = textWidthSum.reduce(function (accumulator, currentValue) {
                return accumulator + currentValue
            }, 0) /** letterSpacing*/; // sum of all current textWidthSum array values multiplied with letter-spacing
            //console.log("currX: "+currX);
            //console.log(textWidthSum);
            
            //below: letterposition + indiviudal offset, this looks jaggy, however, as soon as an edgebounce happens
            var finalX = this.x + currLett.x + currX;
            var finalY = this.y + currLett.y;
            ctx.fillText(
                currLett.letter,
                finalX,
                finalY
            );
            ctx.strokeText(currLett.letter, finalX, finalY);
            /*
            if (k % 2 === 0) { 
                ctx.strokeRect(finalX,finalY,currLett.letterWidth,-fontSize);
            } else {
                ctx.strokeRect(finalX,finalY+10,currLett.letterWidth,-fontSize);
            } */
            //ctx.strokeText(this.word, this.x, this.y);    //dev
            textWidthSum.push(currLett.letterWidth*letterSpacing); // after letter gets drawn, add it's width to textWidthSum
        }
        //below: working word draw
        /*
        ctx.fillText(this.word, this.x, this.y);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.strokeText(this.word, this.x, this.y);
        */
    }
    

    Ball.prototype.update = function () {
        //compare right wordedge and right screenborder
        if (this.justSpawned == true) {
            this.velX = -this.velX;
            this.fontStyle = fontStyleChange(this);
            this.fontStyle = fontStyleChange(this);
            this.fontStyle = fontStyleChange(this);
            this.justSpawned = false;
        }
        
        if ((this.x + this.textWidth) >= width) {
            this.velX = -(Math.abs(this.velX));
            this.velY = this.velY + random(-1, 1); //some randomness for the y-axis
            this.fontStyle = fontStyleChange(this);
            letterPosChange(this);
        }

        // compare left wordedge and left screenborder
        if ((this.x /* - this.textWidth*/ ) <= 0 && this.introState == false) {
            this.velX = Math.abs(this.velX);
            this.velY = this.velY + random(-1, 1); //some randomness for the y-axis
            this.fontStyle = fontStyleChange(this);
            letterPosChange(this);
        } else if (this.x > 2) {
            this.introState = false
        }

        // compare font baseline with bottom screenedge
        if ((this.y + this.size) >= height) {
            this.velY = -(Math.abs(this.velY));
            this.velX = this.velX + random(-1,1);    //some randomness for the x-axis
            this.fontStyle = fontStyleChange(this);
            letterPosChange(this);
        }

        // compare font height with top screenedge; font boundaries are larger than visuals, so reduce a bit
        if ((this.y - (fontSize / 1.5)) <= 0) {
            this.velY = Math.abs(this.velY);
            this.fontStyle = fontStyleChange(this);
            letterPosChange(this);
        }

        if (this.timeCount >= delay * this.index + 1) {
            this.x += this.velX;
            this.y += this.velY;
        } else {
            this.timeCount++;
            //console.log("timeCount: "+this.timeCount+ "; index: "+this.index);
        }

        if (fontSize > targetFontSize) {
            fontSize--;
        } else if (fontSize == targetFontSize) {
            targetFontSize = fontSize;
        } else if (fontSize < targetFontSize) {
            fontSize++;
        }

        //console.log(this.word+" textWidth: "+this.textWidth+" targetTextWidth: "+this.targetTextWidth);
        //below: works, but lags behind visible letter positions - increase? clamp value to even, then increase by two?
        if ( /*this.minTextWidth > */ this.textWidth > this.targetTextWidth) {
            this.textWidth--;
            this.textWidth = this.targetTextWidth;
        } else if (this.textWidth == this.targetTextWidth) {
            this.targetTextWidth = this.textWidth;
        } else if (this.textWidth < this.targetTextWidth) {
            this.textWidth++;
            this.textWidth = this.textWidth + 1.5;
            //this.textWidth = this.targetTextWidth;
        }

        if (lineWidth < targetLineWidth) {
            //lineWidth += 0.01;
            lineWidth = (lineWidth * 100 + 0.01 * 100) / 100;

        } else if (lineWidth == targetLineWidth) {
            lineWidth = targetLineWidth;
        } else if (lineWidth > targetLineWidth) {
            //lineWidth -= 0.01;
            lineWidth = (lineWidth * 100 - 0.01 * 100) / 100;
            lineWidth = lineWidth.toFixed(2);
        }
    }
    

    var balls = [];

    function loop() {
        ctx.clearRect(0, 0, width, height);

        while (balls.length < wordCount) {
            for (i = 0; i < wordCount; i++) {
                var ball = new Ball(i);
                ball.getLetters();
                //console.log(ball);
                balls.push(ball);
            }
        }

        for (i = 0; i < balls.length; i++) {
            balls[i].draw();
            balls[i].update();
            var ballLetters = balls[i].letters;
            var ballLetterCount = ballLetters.length;
            //console.log(ballLetters);
            for (ii = 0; ii < ballLetterCount; ii++) {
                ballLetters[ii].update();
            }
        }

        // this is shitty, but works mostly
        window.onscroll = function () {
            scrollFunction()
        };

        function scrollFunction() {
            if (document.body.scrollTop > scrollThreshold || document.documentElement.scrollTop > scrollThreshold) {
                targetFontSize = minFontSize;
                targetLineWidth = minLineWidth;

                for (i = 0; i < wordCount; i++) {
                    var currBall = balls[i];
                    var shrunkWidth = widthChange(currBall, "shrink");
                    //console.log("shrunk value: "+shrinktest);
                    //console.log("mintextiwdth: "+currBall.minTextWidth);
                    //around 5-7px difference between elements minWidth & widthChange return value
                    //currBall.targetTextWidth = currBall.minTextWidth;
                    currBall.targetTextWidth = Math.round(shrunkWidth);
                    //now calculate all of a words' letter widths
                    var currBallLetterLength = currBall.letters.length;
                    for (ii = 0; ii < currBallLetterLength; ii++) {
                        var currLetter = currBall.letters[ii];
                        //console.log("for "+currLetter.letter+" targetWidth is "+currLetter.targetLetterWidth);
                        //console.log(currLetter.letter+" minWidth is "+currLetter.minTextWidth);
                        currLetter.targetLetterWidth = currLetter.minTextWidth;
                    }
                }

            } else if (document.body.scrollTop < scrollThreshold+1 || document.documentElement.scrollTop < scrollThreshold+1) {
                targetFontSize = maxFontSize;
                targetLineWidth = maxLineWidth;

                for (i = 0; i < wordCount; i++) {
                    var currBall = balls[i];
                    var growWidth = widthChange(currBall, "grow");
                    currBall.targetTextWidth = Math.round(growWidth);
                    //currBall.targetTextWidth = currBall.maxTextWidth;
                    //now calculate all of a words' letter widths
                    var currBallLetterLength = currBall.letters.length;
                    for (ii = 0; ii < currBallLetterLength; ii++) {
                        var currLetter = currBall.letters[ii];
                        //console.log("for "+currLetter.letter+" targetWidth is "+currLetter.targetLetterWidth);
                        //console.log(currLetter.letter+" minWidth is "+currLetter.maxTextWidth);
                        currLetter.targetLetterWidth = currLetter.maxTextWidth;
                    }
                }
            }
        }

        requestAnimationFrame(loop);
    }

    loop();

    initialize();


    function initialize() {
        // Register an event listener to call the resizeCanvas() function each time the window is resized.
        window.addEventListener('resize', resizeCanvas, false);
        // Draw canvas border for the first time.
        resizeCanvas();
    }

    // Runs each time the DOM window resize event fires.
    // Resets the canvas dimensions to match window, then draws the new borders accordingly.
    function resizeCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;

        if (window.screen.width * window.devicePixelRatio > window.screen.height * window.devicePixelRatio) {
            //console.log("width is bigger");
            fontSize = Math.round(height / 2);
            minFontSize = Math.round(fontSize / 4);
            minLineWidth = height/500;
            maxLineWidth = height/220;
        } else {
            //console.log("height is bigger");
            fontSize = Math.round(width / 2);
            minFontSize = Math.round(fontSize / 4);
            minLineWidth = height/400;
            maxLineWidth = height/250;
        }
    }
        
}, function () {
  console.log('Font is not available');
});
    
});