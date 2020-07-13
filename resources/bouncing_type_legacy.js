// Bouncing, animated Type
// Frederik Engelbrecht, 2020, für den Rundgang Finkenau SoSe 20
// Based upon https://www.html5canvastutorials.com/advanced/html5-canvas-bouncing-balls/

    <script>
        $(document).ready(function() {
        
        var canvas = document.querySelector('#animCanvas');
        var ctx = canvas.getContext('2d');
        
        var width = canvas.width = window.innerWidth;
        var height = canvas.height = window.innerHeight;
        var delay = 200;   //delay between words coming onto screen
        var colors = ["rgb(245,255,42)", "rgb(185,184,184)", "rgb(90,220,129)", "rgb(174,54,248)", "rgb(231,95,42)", "rgb(0,65,236)"];
        var words = ["the", "end(s)", "of", "the", "world", "?"];
        var state = 0;  //UNUSED; 0 ends; 1 galerie; 2 team; 3 see you soon;
        var wordCount = words.length;
        var word;
        var fontSize; //this is dynamic based on screen dimensions, filled in resizeCanvas()
        var targetFontSize; // the value to grow/shrink fontSize to
        var minFontSize;    // the smallest the font should be, based on fontSize
        var maxFontSize;
        var letterSpacing = 0.85;
        var letterEasing = 0.05;    //amount of easing when letters jump to new positions on edgeCollision
        if (window.screen.width * window.devicePixelRatio > window.screen.height * window.devicePixelRatio) {   //initial size
                fontSize = Math.round(height / 2);
                minFontSize = Math.round(fontSize / 4);
                maxFontSize = Math.round(fontSize);
            } else {
                fontSize = Math.round(width / 3);
                minFontSize = Math.round(fontSize / 3);
                maxFontSize = Math.round(fontSize);
            }
        var verticalOffsetMult = minFontSize / maxFontSize; // used for letter y-offset when scaling
        var fontStyle = "normal"; // normal or oblique, alternating on edgecollision
        ctx.font = "normal " + fontSize + "px PX Grotesk";
        ctx.strokeStyle = "black";
        var minLineWidth = 1.5;
        var maxLineWidth = 3.0;
        var lineWidth = maxLineWidth;
        var targetLineWidth = maxLineWidth;
        var scroll; //gets scroll distance from top

        // function to generate random number
        function random(min, max) {
            var num = Math.floor(Math.random() * (max - min)) + min;
            // if min = 10 max = 15 random var = 0.1544465; it will return approzimately 10 because of math.floor
            return num;
        }
            
        function humanize(x){   //unused
          return x.toFixed(2).replace(/\?0*$/,'');
        }
 
        function getMinTextWidth(object) {
            var text;
            var localLetterSpacing = 1;
            if(object.hasOwnProperty("word")){  //if passed object is word
                text = object.word;
                localLetterSpacing = letterSpacing;
                //console.log(letterSpacing);
            } else if (object.hasOwnProperty("letter")) {   //if passed object is letter
                text = object.letter;
            }
            //var minFontSize = minFontSize;
            var fontStyle = object.fontStyle;
            ctx.font = fontStyle + " " + minFontSize + "px PX Grotesk";
            ctx.fillText(text, 0, 0);
            var newMinTextWidth = Math.round(ctx.measureText(text).width*localLetterSpacing);
            //console.log("returned minTextWidth: "+newMinTextWidth);
            return newMinTextWidth;
        }
        function getMaxTextWidth(object) {
            var text;
            var localLetterSpacing = 1;
            if(object.hasOwnProperty("word")){
                text = object.word;
                localLetterSpacing = letterSpacing;
            } else if (object.hasOwnProperty("letter")) {
                text = object.letter;
            }
            //var maxFontSize = maxFontSize;
            var fontStyle = object.fontStyle;
            ctx.font = fontStyle + " " + maxFontSize + "px PX Grotesk";
            ctx.fillText(text, 0, 0);
            var newMaxTextWidth = Math.round(ctx.measureText(text).width*localLetterSpacing);
            //console.log("returned maxTextWidth: "+newMaxTextWidth);
            return newMaxTextWidth;
        }
            
        // called after velocity inversion (edge detection), gets object's font style and inverts it
        function fontStyleChange(object) {
            //rewritten to apply to child letter object instead of word
            var letterCount = object.letters.length;
            for (n=0;n<letterCount;n++) {
                var currLett = object.letters[n];
                var textStyle = currLett.fontStyle;
                if (textStyle == "normal") {
                    textStyle = "oblique";
                } else {
                    textStyle = "normal";
                }
                currLett.fontStyle = textStyle;
            }
        }
            
        function letterPosChange(object) {
            var letterCount = object.letters.length;
            for (q=0;q<letterCount;q++) {
                var currLett = object.letters[q];
                var fontSizeMult = (fontSize * verticalOffsetMult)*0.1; //scaling factor to account for min-max fontSize
                currLett.newY = random(-5*fontSizeMult,5*fontSizeMult);
                currLett.newX = random(-2*fontSizeMult,2*fontSizeMult); //slightly smaller valuespace to keep readable
            }
        }
            
        //used on Ball words, calculates the child letters' width, sums them and returns the new width
        function widthChange(object, mode) {
            var letterWidthSum= []; //array to store all child letters' width
            var characterCount = object.characters.length;
            var newWidth;   //this is the target width?
            var text = object.word;
            var arbitraryValue = 0.1;   //subtracted from letterSpacing because the calculated with is a bit too large
            /*
            if (mode == "grow") {
                var fontStyle = object.fontStyle;
                ctx.font = fontStyle + " " + maxFontSize + "px PX Grotesk";
                ctx.fillText(text, 0, 0);
                var newMaxTextWidth = Math.round(ctx.measureText(text).width*letterSpacing);
                //var maxTextWidth = (Math.abs(ctx.measureText(text).actualBoundingBoxLeft) + Math.abs(ctx.measureText(text).actualBoundingBoxRight));
                //console.log("returned maxTextWidth: "+newMaxTextWidth);
                newWidth = newMaxTextWidth;
            } else if (mode == "shrink") {
                var fontStyle = object.fontStyle;
                ctx.font = fontStyle + " " + minFontSize + "px PX Grotesk";
                ctx.fillText(text, 0, 0);
                var newMinTextWidth = Math.round(ctx.measureText(text).width*(letterSpacing-0.1));
                //var maxTextWidth = (Math.abs(ctx.measureText(text).actualBoundingBoxLeft) + Math.abs(ctx.measureText(text).actualBoundingBoxRight));
                //console.log("returned maxTextWidth: "+newMaxTextWidth);
                newWidth = newMinTextWidth;
            }
            return newWidth;*/
            //below: method that sums every letter's width and multiplies that with letterPsacing value; but this is wider than the initialized width
            
            if (mode == "grow") {
                for (m=0;m<characterCount;m++) {
                    var currLetter = object.letters[m];
                    newWidth = getMaxTextWidth(currLetter);
                    //console.log(currLetter.letter+" growing to: "+newWidth);
                    letterWidthSum.push(newWidth); 
                }
            } else if (mode == "shrink") {
                for (m=0;m<characterCount;m++) {
                    var currLetter = object.letters[m];
                    newWidth = getMinTextWidth(currLetter);
                    //console.log(currLetter.letter+" shrinking to: "+newWidth);
                    letterWidthSum.push(newWidth); 
                }
            }
            var wordWidth = letterWidthSum.reduce(function (accumulator, currentValue) {
                    return accumulator + currentValue
                }, 0) * (letterSpacing-arbitraryValue);
            //console.log("widthChange for "+object.word+" returns "+wordWidth);
            return wordWidth;   //this works!
            
            //object.textWidth = wordWidth;
        }
            
        //below: unused
            /*
        function letterWidthChange(object, mode) {
            var mode = mode;
            var newWidth;   //this is the target width?
            if (mode == "grow") {
                object.targetLetterWidth = object.maxTextWidth;
                newWidth = object.maxTextWidth;
            } else if (mode == "shrink") {
                object.targetLetterWidth = object.minTextWidth;
                newWidth = object.minTextWidth;
            }
            //console.log("letterWidthchange new width:"+newWidth);
            return newWidth;
        }
        */

        function Ball(identifier) {
            this.x = random(0, -width);  //ONLY FOR INITIALIZATION; was 0, width; this spawns them only the first screen quarter, so no long word gets stuck
            this.y = random(0+fontSize, height); //was 0, height; but this makes thigns get stuck
            // move all things in from one side and out from another? this might help with creating intro & outro states
            this.velX = random(3, 3);  //was -7,7; now only positive to make things slide in from beyond the left canvas border
            this.velY = random(-3, 3);
            // edge case 2 do: if (-1 < velocity < 1 )
            this.color = colors[identifier];
            this.size = 1; //lower left edge, only for dev purposes
            this.word = words[identifier];
            this.index = identifier;
            this.fontStyle = "normal";
            this.textWidth = Math.round(getMaxTextWidth(this));    // for initialization only
            this.targetTextWidth = Math.round(this.textWidth);  // gets changed on scroll to grow/ shrink letter spacing & word boundaries
            this.minTextWidth = Math.round(getMinTextWidth(this));
            this.maxTextWidth = Math.round(getMaxTextWidth(this));
            
            this.x = -this.textWidth*1.4;   //REAL spawn point outside of canvas based on final textWidth value
            
            this.introState = true; // true when spawning for as long as the word is outside the canvas bounds, to prevent getting stuck in velocity switching
            this.timeCount = 0;  //counting up to delay;
            
            // below: individual letters as child elements
            this.characters = Array.from(this.word);   //split word array into single letters
            this.letters=[];    //array to be filled with letter objects

            this.getLetters = function() {
                var charCount = this.characters.length;
                var LetterFontStyle;
                
                for (j=0;j<charCount;j++) {    //don't use same countervar as the parent loop where this gets called!
                    if (j % 2 === 0) { // index is even
                        LetterFontStyle = "oblique"; 
                    } else { LetterFontStyle = "normal" }
                    var letter = new Letter(this.characters[j],this.color,LetterFontStyle);
                    this.letters.push(letter);     
                }
                //console.log(this.letters);
            }
            
            //below: widthChange as method, but needs to be function with parms
            /*
            this.widthChange = function() {
                var letterWidthSum= [];
                if (mode == grow) {
                    for (m=0;m<this.characters.length;m++) {
                        letterWidthSum.push(this.letters[m].maxTextWidth); 
                    }
                } else if (mode == shrink) {
                    var letterWidthSumMin= [];
                    for (m=0;m<this.characters.length;m++) {
                        letterWidthSum.push(this.letters[m].minTextWidth); 
                    }
                }
                var wordWidth = letterWidthSum.reduce(function (accumulator, currentValue) {
                      return accumulator + currentValue
                    }, 0) * letterSpacing;
                return wordWidth;
                this.textWidth = wordWidth;
            }
            */
            
            //this.textWidth = this.widthChange(); 
        }
        
        
        // this has to be nested inside the Ball constructor
        function Letter(character, color, localFontStyle) {
            this.x = 0;  //relative to parent container origin: origin + this.margin + this.width
            this.y = random(-40,40);  //relative to parent container origin: origin + this.margin + this.height
            this.newX = this.x;
            this.newY = this.y;
            this.origY = this.y;
            this.velX = 0;  
            this.velY = 0;
            this.margin; //maybe percentage of fontSize?
            this.color = color//inherit container Ball color; needed?
            this.letter = character;
            this.fontStyle = localFontStyle;
            this.minTextWidth = getMinTextWidth(this);
            //console.log("min: "+this.minTextWidth);
            this.maxTextWidth = getMaxTextWidth(this);
            //console.log("max: "+this.maxTextWidth);
            this.letterWidth = this.maxTextWidth;     //initial, since text starts big
            this.targetLetterWidth = this.maxTextWidth;
        }
        
        Letter.prototype.update = function() {
            if (this.letterWidth < this.targetLetterWidth) {
                this.letterWidth++;
                this.y = this.origY;
            } else if (this.letterWidth > this.targetLetterWidth) {
                this.letterWidth--;
                this.targetY = this.origY*verticalOffsetMult;
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
                var dy = this.newY-this.y;
                this.y += dy*letterEasing;
            } else if (this.y > this.newY) {
                //this.y--;
                var dy = this.newY-this.y;
                this.y += dy*letterEasing;  //this makes the letters fall down, offscreen - maybe useful for a remove animation?
            }
            //this is where things like individual letter movement get  calculated
            /* //fake code
            if (collision detected) {
                this.velX = Ball velX;
                this.velY = Ball velY;
                
                for (i=0; i<edgeTime; i++) {
                    //to make letter crouch together, this most likely needs the margin value, as well
                    this.x += velX;
                    this.y *= velY;
                }
            }
            */
        }
        
        Ball.prototype.draw = function() {
            ctx.beginPath();
            ctx.fillStyle = this.color;
            //ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI); //text origin: bottom left corner (canvas gets drawn from top left)
            //ctx.strokeRect(this.x, this.y - fontSize, this.textWidth, fontSize); //object boundaries
            //ctx.strokeRect(this.x, this.y - fontSize, this.textWidth, fontSize);
            ctx.fill();
            //ctx.font = this.fontStyle + " " + fontSize + "px PX Grotesk"; //works, but assigns single fontstyle to all letters
            ctx.lineWidth = lineWidth;  //has to be dynamic

            //NEW: FEATURING SINGLE LETTERS
            var textWidthSum = [];  //collects letter widths to get new start x for next letter
            var letterCount = this.letters.length;
            for (k = 0; k < letterCount; k++) {
                var currLett = this.letters[k];
                ctx.font = currLett.fontStyle + " " + fontSize + "px PX Grotesk";
                var currX;
                currX = textWidthSum.reduce(function (accumulator, currentValue) {
                  return accumulator + currentValue
                }, 0) * letterSpacing;  // sum of all current textWidthSum array values multiplied with letter-spacing
                //console.log("currX: "+currX);
                //console.log(textWidthSum);
                ctx.fillText(
                    currLett.letter, 
                    this.x + currLett.x + currX,
                    this.y + currLett.y
                );
                
                ctx.strokeText(currLett.letter, this.x + currLett.x + currX, this.y + currLett.y);
                /*
                ctx.strokeRect(this.x + this.letters[k].x + (this.letters[k].maxTextWidth) * k,
                               this.y + this.letters[k].y - fontSize, 
                               this.letters[k].maxTextWidth,
                               fontSize
                              ); //object boundaries
                */     
                //ctx.strokeText(this.word, this.x, this.y);    //dev
                //below: dont use maxTextWidth, use dynamic value!
                textWidthSum.push(currLett.letterWidth);    // after letter gets drawn, add it's width to textWidthSum
            }
            
            //below: working word draw
            /*
            ctx.fillText(this.word, this.x, this.y);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 4;
            ctx.strokeText(this.word, this.x, this.y);
            */
            
            //this.return
        }

        Ball.prototype.update = function() {
            //compare right wordedge and right screenborder
            if ((this.x + this.textWidth) >= width) {
                this.velX = -(Math.abs(this.velX));
                this.velY = this.velY + random(-1,1);   //some randomness for the y-axis
                this.fontStyle = fontStyleChange(this);
                letterPosChange(this);
            }
            
            // compare left wordedge and left screenborder
            if ((this.x/* - this.textWidth*/) <= 0 && this.introState==false) {
                this.velX = Math.abs(this.velX);
                this.fontStyle = fontStyleChange(this);
                letterPosChange(this);
            } else if (this.x > 2){
                this.introState = false
            }

            // compare font baseline with bottom screenedge
            if ((this.y + this.size) >= height) {
                this.velY = -(this.velY);
                this.fontStyle = fontStyleChange(this);
                letterPosChange(this);
            }

            // compare font height with top screenedge; font boundaries are larger than visuals, so reduce a bit
            if ((this.y - (fontSize/1.5)) <= 0) {
                this.velY = Math.abs(this.velY);
                this.fontStyle = fontStyleChange(this);
                letterPosChange(this);
            }

            if (this.timeCount >= delay * this.index+1) {
                this.x += this.velX;
                this.y += this.velY;
            } else {
                this.timeCount++;
                //console.log("timeCount: "+this.timeCount+ "; index: "+this.index);
            }
            
            if (fontSize > targetFontSize) {
                fontSize--;
            }  else if (fontSize == targetFontSize) {
                targetFontSize = fontSize;
            }  else if (fontSize < targetFontSize) {
                fontSize++;
            }
            
            //console.log(this.word+" textWidth: "+this.textWidth+" targetTextWidth: "+this.targetTextWidth);
            //below: works, but lags behind visible letter positions - increase? clamp value to even, then increase in two?
            if (/*this.minTextWidth > */this.textWidth > this.targetTextWidth) {
                this.textWidth--;
                this.textWidth = this.targetTextWidth;
            } else if (this.textWidth == this.targetTextWidth) {
                this.targetTextWidth = this.textWidth;
            } else if (this.textWidth < this.targetTextWidth) {
                this.textWidth++;
                this.textWidth = this.textWidth +1.5;
                //this.textWidth = this.targetTextWidth;
            }
            
            if (lineWidth < targetLineWidth) {
                //lineWidth += 0.01;
                lineWidth = (lineWidth * 100 + 0.01 * 100) / 100; 
                
            } else if (lineWidth == targetLineWidth){
                lineWidth = targetLineWidth;
            } else if (lineWidth > targetLineWidth) {
                //lineWidth -= 0.01;
                lineWidth = (lineWidth * 100 - 0.01 * 100) / 100; 
                lineWidth = lineWidth.toFixed(2);
            }
            //console.log(lineWidth);
            console.log("lineWidth: "+lineWidth+" targetLineWidth: "+targetLineWidth );
            /*
            if(scroll>0.1){
                fontSize = fontSize*scroll;
            }
            */
        }
        
        var balls = [];
        
        //below: seemingly unused by orig code?
        /*
        Ball.prototype.collisionDetect = function() {
            for (j = 0; j < balls.length; j++) {
                if ((!(this.x === balls[j].x && this.y === balls[j].y && this.velX === balls[j].velX && this.velY === balls[j].velY))) {
                    var dx = this.x - balls[j].x;
                    var dy = this.y - balls[j].y;
                    var distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < this.size + balls[j].size) {
                        balls[j].color = this.color = 'rgb(' + random(0, 255) + ',' + random(0, 255) + ',' + random(0, 255) + ')';
                    }
                }
            }
        }
        */

        
        function loop() {
            ctx.clearRect(0, 0, width, height);

            while (balls.length < wordCount) {
                for (i = 0; i < wordCount; i++) {
                    var ball = new Ball(i);
                    ball.getLetters();
                    //console.log(ball);
                    balls.push(ball);
                }
                /*
                for (i=0; i < wordCount; i++) { //this somehow only fills out two words' letters, why? 
                    //balls[i].getLetters();
                    console.log(balls[i]);
                }
                */
            }

            for (i = 0; i < balls.length; i++) {
                balls[i].draw();
                balls[i].update();
                var ballLetters = balls[i].letters;
                //console.log(ballLetters);
                for (ii=0;ii<ballLetters.length;ii++) {
                    ballLetters[ii].update();
                }
            }
            
            // this is shitty, but works mostly
            window.onscroll = function() {scrollFunction()};
            function scrollFunction() {
              if (document.body.scrollTop > 80 || document.documentElement.scrollTop > 80) {
                    targetFontSize = minFontSize;
                    targetLineWidth = minLineWidth;
                      
                    for (i=0;i<wordCount;i++){
                        var currBall = balls[i];
                        var shrunkWidth= widthChange(currBall, "shrink"); 
                        //console.log("shrunk value: "+shrinktest);
                        //console.log("mintextiwdth: "+currBall.minTextWidth);
                        //around 5-7px difference between elements minWidth & widthChange return value
                        //currBall.targetTextWidth = currBall.minTextWidth;
                        currBall.targetTextWidth = Math.round(shrunkWidth);
                        //now calculate all of a words' letter widths
                        var currBallLetterLength = currBall.letters.length;
                        for(ii=0;ii<currBallLetterLength;ii++) {
                            var currLetter = currBall.letters[ii];
                            //console.log("for "+currLetter.letter+" targetWidth is "+currLetter.targetLetterWidth);
                            //console.log(currLetter.letter+" minWidth is "+currLetter.minTextWidth);
                            currLetter.targetLetterWidth = currLetter.minTextWidth;
                        }
                    }
                      
              } else if (document.body.scrollTop < 81 || document.documentElement.scrollTop < 81) {
                    targetFontSize = maxFontSize;
                    targetLineWidth = maxLineWidth;
                  
                    for (i=0;i<wordCount;i++){
                        var currBall = balls[i];
                        var growWidth= widthChange(currBall, "grow"); 
                        currBall.targetTextWidth = Math.round(growWidth);
                        //currBall.targetTextWidth = currBall.maxTextWidth;
                        //now calculate all of a words' letter widths
                        var currBallLetterLength = currBall.letters.length;
                        for(ii=0;ii<currBallLetterLength;ii++) {
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
           // Register an event listener to call the resizeCanvas() function 
           // each time the window is resized.
           window.addEventListener('resize', resizeCanvas, false);
           // Draw canvas border for the first time.
           resizeCanvas();
        }
        
        // Runs each time the DOM window resize event fires.
        // Resets the canvas dimensions to match window,
        // then draws the new borders accordingly.
        function resizeCanvas() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            
            if (window.screen.width * window.devicePixelRatio > window.screen.height * window.devicePixelRatio) {
                //console.log("width is bigger");
                fontSize = Math.round(height / 2);
                minFontSize = Math.round(fontSize / 4);
            } else {
                //console.log("height is bigger");
                fontSize = Math.round(width / 2);
                minFontSize = Math.round(fontSize / 4);
            }
        }
             
        });
    </script>