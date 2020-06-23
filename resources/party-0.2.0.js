/* Copyright (c) 2012 - 2013 Kenneth Powers. Released under the MIT License. */ 
window.onload = function () {
    function e(e) {
        return Math.round(1e3 * e) / 1e3;
    }
    
    // tells the browser that you wish to perform an animation and requests that the browser calls a specified function to update an animation before the next repaint. The method takes a callback as an argument to be invoked before the repaint.
    window.requestAnimFrame = (function () {
        const e = 1e3 / 60;
        return (
            window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (t) {
                setTimeout(t, e);
            }
        );
    })();
    const t = document.getElementById("dance-floor"),
        n = t.getContext("2d"),
        i = document.getElementById("cursor-area"),
        o = i.getContext("2d"),
        instructions = document.getElementById("instructions"), //was "a", instructions container?
        l = instructions.getContext("2d"), //instructions text
        r = document.getElementById("cursors"),
        d = function (e, t, n, i) {
            return function (instructions) {
                o.drawImage(r, e, t, n, i, (-n * instructions) / 2, (-i * instructions) / 2, n * instructions, i * instructions);
            };
        },
        //is "s" the cursor image sheet?
        s = [
            d(331, 109, 62, 102),
            d(0, 0, 84, 121),
            d(86, 0, 80, 116),
            d(168, 0, 79, 116),
            d(249, 0, 80, 112),
            d(331, 0, 80, 107),
            d(0, 123, 80, 116),
            d(82, 123, 84, 112),
            d(168, 123, 76, 84),
            d(249, 114, 80, 107),
            d(0, 241, 84, 102),
            d(86, 241, 80, 88),
            d(168, 241, 84, 84),
            d(254, 241, 47, 78),
        ],
        c = 0.21,
        h = 0.01,
        f = 0.1,
        
        msg_title = "CURSOR DANCE PARTY!",  // was "u", title
        msg_noconnection = "No Connection...",     // was "w", displays if no connection?
        msg_loneclient = "Lame! There's nobody else here!\nYou should invite a friend!"; // was "m", displays only if no other client is connected?
    
    var g = { x: 0, y: 0, angle: 0, cursor: 0, scale: 0.3, rotations: 0 }, //cursor object
        v = !0,
        p = {},
        y = 0,  //maybe an array that saves all active partiers?
        x = !1,
        A = 0,
        E = "#697c28",  //backgroundcolor 1
        L = "#32463d",  //backgroundcolor 2
        R = function () {
            (A = Math.min(window.innerHeight, window.innerWidth) / 15), //get smaller screen dimension
                (t.width = window.innerWidth),
                (t.height = window.innerHeight),
                (n.textAlign = "center"),
                (n.textBaseline = "middle"),
                (n.font = A + "px Impact"),
                (i.width = window.innerWidth),
                (i.height = window.innerHeight),
                (instructions.width = window.innerWidth),
                (instructions.height = A);
                /*
                (l.fillStyle = "#fff"),
                (l.font = instructions.height / 2 + "px Impact"),
                (l.textAlign = "center"),
                (l.textBasline = "middle"),
                l.fillText("Use 0 - 9 and A - D to change your cursor! Click to spin! Scroll to change size!", instructions.width / 2, instructions.height / 2);*/
        };
    window.addEventListener("resize", R), R();
    
    var b = function () {
        if (x) {
            instructions.style.visibility = "visible";
            var e = E;
            (E = L), (L = e), (n.fillStyle = E), n.fillRect(0, 0, t.width, t.height), (n.fillStyle = L), n.fillText(msg_title, t.width / 2, t.height / 2);
        } /* else (instructions.style.visibility = "hidden"), (n.fillStyle = "#000"), n.fillRect(0, 0, t.width, t.height), (n.fillStyle = "#fff"), n.fillText(msg_noconnection, t.width / 2, t.height / 2); */
        setTimeout(b, 1e3);
    };
    
    b(),
        i.addEventListener("mousemove", function (t) {
            for (var n = i, o = 0, a = 0; n && "BODY" != n.tagName; ) (o += n.offsetTop), (a += n.offsetLeft), (n = n.offsetParent);
            (g.x = e((t.clientX - a + window.pageXOffset) / i.width)), (g.y = e((t.clientY - o + window.pageYOffset) / i.height)), (v = !0);
        })/*,*/;
        //below: function to change cursor icon
        /*
        document.addEventListener("keyup", function (e) {
            var t = e.keyCode;
            if (t >= 65)
                switch (t) {
                    case 65:
                        t = 11;
                        break;
                    case 83:
                        t = 12;
                        break;
                    case 68:
                        t = 13;
                }
            else t -= 48;
            t >= 0 && 13 >= t && ((g.cursor = t), (v = !0));
        }); */
        
    var I = function (e) {
            return (p[e] = []), (p[e].alpha = 0), y++, p[e];
        };
    
    // S is socket.io object?
    //var S = io.connect("rundgangsite.test"/*"http://www.cursordanceparty.com"*/);  //connect to http://www.cursordanceparty.com
    var S = io.connect("http://www.cursordanceparty.com");  //connect to socket.io node.js host server, here http://www.cursordanceparty.com
    S.on("connect", function () {
        (x = !0), T();  //if io connects to server above, set x to not null, then execute function T()
    }),
        S.on("disconnect", function () {
            x = !1;
        }),
        
        S.on("partier-joined", function (e) {
            I(e.id);
        }),
        
        S.on("partier-left", function (e) {
            (p[e.id].dying = !0), y--;
        }),
        
        S.on("mouse-coords", function (e) {
            (p[e.id] || I(e.id)).push(e.mouse);
        });
    
    var T = function () {
        x && v && (S.emit("mouse-coords", g), (v = !1));
    };
    i.addEventListener("mouseup", function () {
        g.rotations <= 100 && (g.rotations++, (v = !0));
    });
    
    /*
    var q = function (t) {
        var n = t.detail ? -1 * t.detail : t.wheelDelta;
        n > 0 ? (g.scale >= 1 || g.scale + f >= 1 ? (g.scale = 1) : (g.scale += f)) : 0 > n && (g.scale <= f || g.scale - f <= f ? (g.scale = f) : (g.scale -= f)),
            0 != n && (v = !0),
            (g.scale = e(g.scale)),
            t.stopPropagation(),
            t.preventDefault();
    }; */
    
    //listen to mouse scroll event (to resize cursor)
    //i.addEventListener && i.addEventListener("DOMMouseScroll", q), i.addEventListener && i.addEventListener("mousewheel", q), i.attachEvent && i.attachEvent("onmousewheel", q);
    var C = function (t) {
            void 0 != t.cursor &&
                (o.save(), o.translate(t.x * i.width, t.y * i.height), t.rotations > 0 && (t.angle >= 2 * Math.PI ? ((t.angle = 0), t.rotations--) : (o.rotate(t.angle), (t.angle = e(t.angle + c)))), s[t.cursor](t.scale), o.restore());
        },
        F = function () {
            C(g);
        },
        B = function () {
            for (var e in p) {
                var t = p[e];
                (o.globalAlpha = t.alpha), t.length > 1 ? C(t.shift()) : 1 == t.length && C(t[0]), t.dying ? (t.alpha - h <= 0 ? delete p[e] : (t.alpha -= h)) : t.alpha + h >= 1 ? (t.alpha = 1) : (t.alpha += h), (o.globalAlpha = 1);
            }
        },
        
        //below: function that displays msg_loneclient when no other client is connected?
        /*
        k = function () {
            0 == y && x && ((o.fillStyle = "#fff"), (o.font = A / 2 + "px Impact"), (o.textAlign = "center"), o.fillText(msg_loneclient, i.width / 2, A / 2));
        },*/
        
        //below: repaint whole screen canvas and call fucntions F, B, k, T
        D = function () {
            o.clearRect(0, 0, i.width, i.height), F(), B(), /*k(),*/ T(), requestAnimFrame(D);
        };
    requestAnimFrame(D);
};
