let textSequenceFinished = false;
let fireworksStarted = false;

function startFireworks() {
    if (fireworksStarted) return;
    fireworksStarted = true;

    if (rainInterval) {
        clearInterval(rainInterval);
        rainInterval = null;
    }

    // 🧹 XÓA SẠCH nền Matrix
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    document.getElementById("rainCanvas").style.display = "none";
    document.querySelector(".canvas").style.display = "none";

    const fireCanvas = document.getElementById("fireCanvas");
    fireCanvas.style.display = "block";
    showNightView();

    if (window.initFireworks) {
        window.initFireworks();
    }
}



function showNightView() {
    const card = document.getElementById("tetCardWrapper");
    card.style.display = "flex";

    requestAnimationFrame(() => {
        card.style.opacity = "1";
    });
}


var S = {
    init: function () {
        S.Drawing.init('.canvas');
        document.body.classList.add('body--ready');
        S.UI.simulate(
          "#countdown 3|HAPPY|NEW YEAR|2026|❤️");
        S.Drawing.loop(function () {
            S.Shape.render();
        });
    }
};
S.Drawing = (function () {
    var canvas,
        context,
        renderFn,
        requestFrame = window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };
    return {
        init: function (el) {
            canvas = document.querySelector(el);
            context = canvas.getContext('2d');
            this.adjustCanvas();
            window.addEventListener('resize', function (e) {
                S.Drawing.adjustCanvas();
            });
        },
        loop: function (fn) {
            renderFn = !renderFn ? fn : renderFn;
            this.clearFrame();
            renderFn();
            requestFrame.call(window, this.loop.bind(this));
        },
        adjustCanvas: function () {

            const dpr = window.devicePixelRatio || 1;
            const width = window.innerWidth;
            const height = window.innerHeight;

            canvas.width = width * dpr;
            canvas.height = height * dpr;

            canvas.style.width = width + "px";
            canvas.style.height = height + "px";

            context.setTransform(1, 0, 0, 1, 0, 0); // reset scale
            context.scale(dpr, dpr);
        },

        clearFrame: function () {
            context.clearRect(0, 0, window.innerWidth, window.innerHeight);
        },

        getArea: function () {
            return {w: window.innerWidth, h: window.innerHeight};
        },

        drawCircle: function (p, c) {
            context.fillStyle = c.render();
            context.beginPath();
            context.arc(p.x, p.y, p.z, 0, 2 * Math.PI, true);
            context.closePath();
            context.fill();
        }
    };
}());
S.UI = (function () {
    var interval,
        currentAction,
        time,
        maxShapeSize = 30,
        sequence = [],
        cmd = '#';
    function formatTime(date) {
        var h = date.getHours(),
            m = date.getMinutes(),
            m = m < 10 ? '0' + m : m;
        return h + ':' + m;
    }
    function getValue(value) {
        return value && value.split(' ')[1];
    }
    function getAction(value) {
        value = value && value.split(' ')[0];
        return value && value[0] === cmd && value.substring(1);
    }
    function timedAction(fn, delay, max, reverse) {
        clearInterval(interval);
        currentAction = reverse ? max : 1;
        fn(currentAction);
        if (!max || (!reverse && currentAction < max) || (reverse && currentAction > 0)) {
            interval = setInterval(function () {
                currentAction = reverse ? currentAction - 1 : currentAction + 1;

                if (reverse && currentAction < 0) {
                    clearInterval(interval);
                    return;
                }

                fn(currentAction);
                if ((!reverse && max && currentAction === max) || (reverse && currentAction === 0)) {
                    clearInterval(interval);
                }
            }, delay);
        }
    }
    function performAction(value) {
        var action,
            value,
            current;
        sequence = typeof (value) === 'object' ? value : sequence.concat(value.split('|'));
        timedAction(function (index) {
            current = sequence.shift();
            action = getAction(current);
            value = getValue(current);
            switch (action) {
                case 'countdown':
                    value = parseInt(value) || 10;
                    value = value > 0 ? value : 10;
                    timedAction(function (index) {
                        if (index === 0) {
                            if (sequence.length === 0) {
                                clearInterval(interval);

                                textSequenceFinished = true;

                                setTimeout(function () {
                                    startFireworks();
                                }, 1500);
                            } else {
                                performAction(sequence);
                            }
                        } else {
                            S.Shape.switchShape(S.ShapeBuilder.letter(index), true);
                        }
                    }, 2000, value, true);
                    break;
                case 'rectangle':
                    value = value && value.split('x');
                    value = (value && value.length === 2) ? value : [maxShapeSize, maxShapeSize / 2];
                    S.Shape.switchShape(S.ShapeBuilder.rectangle(Math.min(maxShapeSize, parseInt(value[0])), Math.min(maxShapeSize, parseInt(value[1]))));
                    break;
                case 'circle':
                    value = parseInt(value) || maxShapeSize;
                    value = Math.min(value, maxShapeSize);
                    S.Shape.switchShape(S.ShapeBuilder.circle(value));
                    break;
                case 'time':
                    var t = formatTime(new Date());
                    if (sequence.length > 0) {
                        S.Shape.switchShape(S.ShapeBuilder.letter(t));
                    } else {
                        timedAction(function () {
                            t = formatTime(new Date());
                            if (t !== time) {
                                time = t;
                                S.Shape.switchShape(S.ShapeBuilder.letter(time));
                            }
                        }, 1000);
                    }
                    break;
                default:
                  S.Shape.switchShape(S.ShapeBuilder.letter(current[0] === cmd ? 'HacPai' : current));
            }
        }, 6000, sequence.length);
    }
    return {
        simulate: function (action) {
            performAction(action);
            return;
        }
    };
}());
S.Point = function (args) {
    this.x = args.x;
    this.y = args.y;
    this.z = args.z;
    this.a = args.a;
    this.h = args.h;
};
S.Color = function (r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
};
S.Color.prototype = {
    render: function () {
        return 'rgba(' + this.r + ',' + +this.g + ',' + this.b + ',' + this.a + ')';
    }
};
S.Dot = function (x, y) {
    this.p = new S.Point({
        x: x,
        y: y,
        z: 5,
        a: 1,
        h: 0
    });
    this.e = 0.07;
    this.s = true;
    this.c = new S.Color(255, 255, 255, this.p.a);
    this.t = this.clone();
    this.q = [];
};
S.Dot.prototype = {
    clone: function () {
        return new S.Point({
            x: this.x,
            y: this.y,
            z: this.z,
            a: this.a,
            h: this.h
        });
    },
    _draw: function () {
        this.c.a = this.p.a;
        S.Drawing.drawCircle(this.p, this.c);
    },
    _moveTowards: function (n) {
        var details = this.distanceTo(n, true),
            dx = details[0],
            dy = details[1],
            d = details[2],
            e = this.e * d;
        if (this.p.h === -1) {
            this.p.x = n.x;
            this.p.y = n.y;
            return true;
        }
        if (d > 1) {
            this.p.x -= ((dx / d) * e);
            this.p.y -= ((dy / d) * e);
        } else {
            if (this.p.h > 0) {
                this.p.h--;
            } else {
                return true;
            }
        }
        return false;
    },
    _update: function () {
        if (this._moveTowards(this.t)) {
            var p = this.q.shift();
            if (p) {
                this.t.x = p.x || this.p.x;
                this.t.y = p.y || this.p.y;
                this.t.z = p.z || this.p.z;
                this.t.a = p.a || this.p.a;
                this.p.h = p.h || 0;
            } else {
                if (this.s) {
                    this.p.x -= Math.sin(Math.random() * 3.142);
                    this.p.y -= Math.sin(Math.random() * 3.142);
                } else {
                    this.move(new S.Point({
                        x: this.p.x + (Math.random() * 50) - 25,
                        y: this.p.y + (Math.random() * 50) - 25
                    }));
                }
            }
        }
        let d = this.p.a - this.t.a;
        this.p.a = Math.max(0.1, this.p.a - (d * 0.05));
        d = this.p.z - this.t.z;
        this.p.z = Math.max(1, this.p.z - (d * 0.05));
    },
    distanceTo: function (n, details) {
        var dx = this.p.x - n.x,
            dy = this.p.y - n.y,
            d = Math.sqrt(dx * dx + dy * dy);
        return details ? [dx, dy, d] : d;
    },
    move: function (p, avoidStatic) {
        if (!avoidStatic || (avoidStatic && this.distanceTo(p) > 1)) {
            this.q.push(p);
        }
    },
    render: function () {
        this._update();
        this._draw();
    }
};
S.ShapeBuilder = (function () {
    var gap = 13,
        shapeCanvas = document.createElement('canvas'),
        shapeContext = shapeCanvas.getContext('2d'),
        fontSize = 500,
        fontFamily = 'Avenir, Helvetica Neue, Helvetica, Arial, sans-serif';
    function fit() {
        shapeCanvas.width = Math.floor(window.innerWidth / gap) * gap;
        shapeCanvas.height = Math.floor(window.innerHeight / gap) * gap;
        shapeContext.fillStyle = 'red';
        shapeContext.textBaseline = 'middle';
        shapeContext.textAlign = 'center';
    }
    function processCanvas() {
        var pixels = shapeContext.getImageData(0, 0, shapeCanvas.width, shapeCanvas.height).data;
        dots = [],
            pixels,
            x = 0,
            y = 0,
            fx = shapeCanvas.width,
            fy = shapeCanvas.height,
            w = 0,
            h = 0;
        for (var p = 0; p < pixels.length; p += (4 * gap)) {
            if (pixels[p + 3] > 0) {
                dots.push(new S.Point({
                    x: x,
                    y: y
                }));
                w = x > w ? x : w;
                h = y > h ? y : h;
                fx = x < fx ? x : fx;
                fy = y < fy ? y : fy;
            }
            x += gap;
            if (x >= shapeCanvas.width) {
                x = 0;
                y += gap;
                p += gap * 4 * shapeCanvas.width;
            }
        }
        return {dots: dots, w: w + fx, h: h + fy};
    }
    function setFontSize(s) {
        shapeContext.font = 'bold ' + s + 'px ' + fontFamily;
    }
    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
    function init() {
        fit();
        window.addEventListener('resize', fit);
    }
    // Init
    init();
    return {
        imageFile: function (url, callback) {
            var image = new Image(),
                a = S.Drawing.getArea();
            image.onload = function () {
                shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);
                shapeContext.drawImage(this, 0, 0, a.h * 0.6, a.h * 0.6);
                callback(processCanvas());
            };
            image.onerror = function () {
                callback(S.ShapeBuilder.letter('What?'));
            };
            image.src = url;
        },
        circle: function (d) {
            var r = Math.max(0, d) / 2;
            shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);
            shapeContext.beginPath();
            shapeContext.arc(r * gap, r * gap, r * gap, 0, 2 * Math.PI, false);
            shapeContext.fill();
            shapeContext.closePath();
            return processCanvas();
        },
        letter: function (l) {
            var s = 0;
            setFontSize(fontSize);
            s = Math.min(fontSize,
                (shapeCanvas.width / shapeContext.measureText(l).width) * 0.8 * fontSize,
                (shapeCanvas.height / fontSize) * (isNumber(l) ? 1 : 0.45) * fontSize);
            setFontSize(s);
            shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);
            shapeContext.fillText(l, shapeCanvas.width / 2, shapeCanvas.height / 2);
            return processCanvas();
        },
        rectangle: function (w, h) {
            var dots = [],
                width = gap * w,
                height = gap * h;
            for (var y = 0; y < height; y += gap) {
                for (var x = 0; x < width; x += gap) {
                    dots.push(new S.Point({
                        x: x,
                        y: y
                    }));
                }
            }
            return {dots: dots, w: width, h: height};
        }
    };
}());
S.Shape = (function () {
    var dots = [],
        width = 0,
        height = 0,
        cx = 0,
        cy = 0;
    function compensate() {
        var a = S.Drawing.getArea();
        cx = a.w / 2 - width / 2;
        cy = a.h / 2 - height / 2;
    }
    return {
        shuffleIdle: function () {
            var a = S.Drawing.getArea();
            for (var d = 0; d < dots.length; d++) {
                if (!dots[d].s) {
                    dots[d].move({
                        x: Math.random() * a.w,
                        y: Math.random() * a.h
                    });
                }
            }
        },
        switchShape: function (n, fast) {
            var size,
                a = S.Drawing.getArea();
            width = n.w;
            height = n.h;
            compensate();
            if (n.dots.length > dots.length) {
                size = n.dots.length - dots.length;
                for (var d = 1; d <= size; d++) {
                    dots.push(new S.Dot(a.w / 2, a.h / 2));
                }
            }
            var d = 0,
                i = 0;
            while (n.dots.length > 0) {
                i = Math.floor(Math.random() * n.dots.length);
                dots[d].e = fast ? 0.25 : (dots[d].s ? 0.14 : 0.11);
                if (dots[d].s) {
                    dots[d].move(new S.Point({
                        z: Math.random() * 20 + 10,
                        a: Math.random(),
                        h: 18
                    }));
                } else {
                    dots[d].move(new S.Point({
                        z: Math.random() * 5 + 5,
                        h: fast ? 18 : 30
                    }));
                }
                dots[d].s = true;
                dots[d].move(new S.Point({
                    x: n.dots[i].x + cx,
                    y: n.dots[i].y + cy,
                    a: 1,
                    z: 5,
                    h: 0
                }));
                n.dots = n.dots.slice(0, i).concat(n.dots.slice(i + 1));
                d++;
            }
            for (var i = d; i < dots.length; i++) {
                if (dots[i].s) {
                    dots[i].move(new S.Point({
                        z: Math.random() * 20 + 10,
                        a: Math.random(),
                        h: 20
                    }));
                    dots[i].s = false;
                    dots[i].e = 0.04;
                    dots[i].move(new S.Point({
                        x: Math.random() * a.w,
                        y: Math.random() * a.h,
                        a: 0.3, //.4
                        z: Math.random() * 4,
                        h: 0
                    }));
                }
            }
        },
        render: function () {
            for (var d = 0; d < dots.length; d++) {
                dots[d].render();
            }
        }
    };
}());
let effectsStarted = false;

const rainCanvas = document.getElementById("rainCanvas");
const textCanvas = document.querySelector(".canvas");


function startExperience(){
    const name = document.getElementById("usernameInput").value.trim();

    if(!name){
        alert("Vui lòng nhập tên 😊");
        return;
    }

    const nick = generateNickName(name);

    localStorage.setItem("tetUserName", name);
    localStorage.setItem("tetNickName", nick);

    // CẬP NHẬT MESSAGE NGAY
    showPersonalizedMessage();

    document.getElementById("startForm").style.display = "none";

    tryStartEffects();
}




const sound = document.getElementById('sound');

function playSound() {
    if (sound.paused) {
        sound.currentTime = 41;
        sound.play().catch((e) => {
        console.log('Phát nhạc bị chặn:', e);
        });
    }
}


/* ==== TET CARD CONTROL ==== */
function openBook(){
    document.getElementById("book").classList.add("open");
}

function closeBook(){
    document.getElementById("book").classList.remove("open");
}

const canvas = document.getElementById('rainCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    rainCanvas.width = window.innerWidth;
    rainCanvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('resize', setupRain);

window.addEventListener('orientationchange', resizeCanvas);
window.addEventListener('orientationchange', setupRain);


const letters = 'HAPPY NEW YEAR 2026'.split('');
const fontSize = 20;
let columns;
let drops;

function setupRain() {
    columns = Math.floor(window.innerWidth / fontSize);
    drops = Array(columns).fill(1);
}
setupRain();


let hue = 0;

function drawRainBackground() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = fontSize + 'px arial';

    hue += 2; 
    if (hue >= 360) hue = 0;

    for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)];
        ctx.fillStyle = `hsl(${(hue + i * 20) % 360}, 100%, 60%)`;
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height || Math.random() > 0.95) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}
let rainInterval = setInterval(drawRainBackground, 50);


/* ====== LOCAL STORAGE NAME ====== */

function saveName(){
    const name = document.getElementById("usernameInput").value.trim();

    if(!name){
        alert("Vui lòng nhập tên 😊");
        return;
    }

    const nick = generateNickName(name);

    localStorage.setItem("tetUserName", name);
    localStorage.setItem("tetNickName", nick);

    document.getElementById("nameForm").style.display = "none";
    showPersonalizedMessage();
}


function showPersonalizedMessage(){
    const name = localStorage.getItem("tetUserName");
    const nick = localStorage.getItem("tetNickName");
    const messageBox = document.getElementById("tetMessage");

    if(!name) return;

    let specialMessage = tetMessages[nick] || tetMessages["default"];

    messageBox.innerHTML = `
        <b>${specialMessage}</b><br><br>
    `;
}


function generateNickName(fullName){
    let words = fullName.trim().split(" ");
    let nick = "";

    for(let w of words){
        if(w.length > 0){
            nick += w[0].toLowerCase();
        }
    }

    return nick;
}

const tetMessages = {
    nmh: "Chúc cậu một năm mới vui vẻ,nhiều sức khỏe và may mắn,học tập tốt,vấn đáp không ngán một ai,kì tới tiếp tục đạt học bổng nhé 🌸🌸🌸",
    phg: "Năm mới phát tài phát lộc, thành công rực rỡ 🎆",
    lap: "Chúc cậu năm mới vui vẻ,nhiều sức khỏe,gặp nhiều may mắn ,tình yêu với châu bền chặt như keo sơn,bên nhau trọn đời và tiếp tục đồng hành cùng tớ🎉",
    ntmc:"Chúc Châu năm mới vui vẻ,nhiều sức khỏe,nhiều may mắn,làm ăn phát đạt để bao nuôi phương,tiếp tục làm quân sư cho Giang đến khi nào cưới vợ thì thôi :d :d :d  ",
    dhs: "Chúc chú năm mới học tốt học tốt học tốt học tốt học tốt học tốt học tốt học tốt học tốt học tốt học tốt học tốt học tốt học tốt học tốt.Hôm trước nhậu chú bảo chúc chú học tốt là đủ 🎉",
    ntko:"Chúc mẹ con năm mới vui vẻ,mạnh khỏe,nhiều sức khỏe và may mắn,có khách thuê nhà 🌸🌸🌸",
    phm:"Con chúc bố năm mới vui vẻ,mạnh khỏe,nhiều sức khỏe và may mắn, học sinh năm mới gấp 5 lần năm cũ,đánh golf trận nào thắng trận đó để có tiền mua bia và nịnh mẹ con 🌸🌸🌸",
    phs:"Em chúc anh năm mới vui vẻ,mạnh khỏe,nhiều sức khỏe và may mắn,công việc thành công thuận lời,có nhiều tiền để mua sữa cho cháu và uống bia có giờ giấc hơn 🌸🌸🌸",
    nhtn:"Em chúc chị năm mới vui vẻ,mạnh khỏe,nhiều sức khỏe về cả tinh thần và thể chất để chăm cháu ROSE,có công việc mới để cuối năm đưa bố mẹ đi SingaPore 🌸🌸🌸",
    nbm:"Chúc chú năm mới vui vẻ,mạnh khỏe,may mắn,học tập tốt và mọi điều thuận lợi🌸🌸🌸",
    lms:"Chúc chú năm mới vui vẻ,mạnh khỏe,may mắn,học tập tốt,tự tin hơn để có người yêu và anh em mình cứ rứa thôi chú nhể 🌸🌸🌸",
    nvh:"Chúc chú năm mới vui vẻ,mạnh khỏe,may mắn,học tập tốt và anh em mình năm sau làm chuyến nữa chú nhể 🌸🌸🌸",
    nvd:"Chúc chú năm mới vui vẻ,mạnh khỏe,may mắn,học tập tốt,ra hà nội gặp nhau nhiều hơn nhé chú 🌸🌸🌸",
    npd:"Chúc chú năm mới vui vẻ,mạnh khỏe,may mắn,học tập tốt,tình yêu lâu bền,trăm năm hạnh phúc và anh em mình cứ rứa thôi chú nhể 🌸🌸🌸",
    lmh:"Chúc bạn t năm mới vui vẻ,mạnh khỏe,học tập tốt để ra trường thống trị nền kinh tế miền bắc và tình yêu lâu dài nhé 🌸🌸🌸",
    dvm:"Chúc m năm mới vui vẻ,mạnh khỏe,may mắn,học tập tốt để ra trường làm chủ toàn bộ ngân hàng thanh hóa và năm mới gặp t nhiều hơn năm cũ🌸🌸🌸",
    lhh:"Chúc m năm mới vui vẻ,gặp nhiều may mắn,học tập tốt,mạnh khỏe,nhiều sức khỏe để đánh pick cùng t nhá!!!",
    ttk:"Chúc khang năm mới vui vẻ,gặp nhiều may mắn,học tập tốt mạnh khỏe,nhiều sức khỏe để đánh pick cùng t nhá",
    pts:"Chúc m năm mới vui vẻ,mạnh khỏe,may mắn,học tập tốt và kênh youtube sớm có video đầu 🌸🌸🌸",
    nvv:"Chúc bạn năm mới vui vẻ,mạnh khỏe,học tập tốt đạt nhiều A để được học bổng,tình yêu mãi bền lâu nhaaaa",
    ha:"Chúc em năm mới vui vẻ,mạnh khỏe,may mắn,học tập tốt để đạt IELTS 7.0 và anh em mình cứ thế thôi hẹ hẹ 🌸🌸🌸",
    th:"Chúc em năm mới vui vẻ,mạnh khỏe,may mắn,học tập tốt và anh em mình cứ thế thôi hẹ hẹ 🌸🌸🌸",
    ptlv:"Chúc chú năm mới vui vẻ,gặp nhiều may mắn,mạnh khỏe,nhiều sức khỏe để hết bệnh tất đau ốm và anh em mình cứ thế thôi hẹ hẹ 🌸🌸🌸",
    ntl:"Chúc Lâm một năm mới vui vẻ,mạnh khỏe,nhiều sức khỏe,học tập tốt để năm kì này đớp tiếp cái học bổng và đồng hành cùng giang trong những dự án sắp tới nhaaaa 🌸🌸🌸",
    ppd:"Chúc đối thủ của t năm mới vui vẻ,gặp nhiều may mắn,mạnh khỏe,bớt lười học và đồng hành cùng t trong những dự án sắp tới nhaaa 🌸🌸🌸",
    nmd:"Chúc đức năm mới vui vẻ,mạnh khỏe,nhiều sức khỏe,học tập tốt để đạt full A và tình yêu lâu bền nhaaaa 🌸🌸🌸",

    default: "An Khang - Thịnh Vượng - Vạn Sự Như Ý 🌸"
};

window.addEventListener("load", function(){
    const savedName = localStorage.getItem("tetUserName");

    if(savedName){
        document.getElementById("startForm").style.display = "none";
        showPersonalizedMessage();
        tryStartEffects();
    }
});


function tryStartEffects() {
    const startForm = document.getElementById("startForm");

    // Nếu form còn hiển thị thì KHÔNG chạy hiệu ứng
    if (startForm.style.display !== "none") return;

    rainCanvas.style.display = "block";
    textCanvas.style.display = "block";

    if (!effectsStarted) {
        effectsStarted = true;
        S.init();
        resizeCanvas();
        playSound();
    }
}
