var game = {
    start: function(snake, treat, score, dir) {
        this.score = score;
        this.paused = false;
        this.blockSize = 10;
        this.area = $('#area')[0];
        this.context = this.area.getContext("2d");
        this.player = new Snake(this.blockSize, "#0033cc", snake, dir);
        this.treat = new Treat(this.blockSize, "red", this.area.width, this.area.height, treat);
        this.interval = setInterval(updateArea, 200);
        $('#start')[0].value = "End game";
        $('#start')[0].onclick = game.stop;
        window.addEventListener('keydown', function(e) {
            switch (e.keyCode) {
                case 37: case 38: case 39: case 40:
                    if (!game.paused) game.player.turn(e.keyCode);
                    break;
            }
        });
    },
    update: function() {
        if (!game.paused) this.player.move();
        this.context.clearRect(0, 0, area.width, area.height);
        this.player.draw();
        this.treat.draw(this.context);
        this.context.fillStyle = "black";
        this.context.fillText("Score: " + this.score, area.width - 60, area.height - 2);
    },
    stop: function() {
        clearInterval(game.interval);
        $('#start')[0].value = "New Game";
        $('#start')[0].onclick = startGame;
        $('#pause')[0].value = "Pause game";
        $('#pause')[0].disabled = true;
        $('#save')[0].disabled = true;
        submit_score(game.score);
        return 1;
    },
    newTreat: function() {
        this.treat = new Treat(this.blockSize, "red", this.area.width, this.area.height, []);
        this.score += 1;
    },
};

function startGame(snake, treat, score, dir) {
    game.start(typeof snake !== 'undefined' ? snake : [[10, 8], [9, 8], [8, 8]], typeof treat !== 'undefined' ? treat : [], typeof score !== 'undefined' ? score : 0, typeof dir !== 'undefined' ? dir : 39);
    $('#pause')[0].disabled = false;
	$('#load')[0].disabled = true;
}

function pauseGame() {
    if (!game.paused) {
        clearInterval(game.interval);
        $('#save')[0].disabled = false;
		$('#load')[0].disabled = false;
        $('#pause')[0].value = "Resume";
        game.paused = true;
    } else {
        game.interval = setInterval(updateArea, 200);
        $('#save')[0].disabled = true;
		$('#load')[0].disabled = true;
        $('#pause')[0].value = "Pause game";
        game.paused = false;
    }
}

function Treat(blockSize, color, w, h, c) {
    var x = c.length > 0 ? c[0] : Math.floor((Math.random() * (w / blockSize) - 1) + 1);
    var y = c.length > 0 ? c[1] : Math.floor((Math.random() * (h / blockSize) - 1) + 1);
    this.draw = function (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
    };
    this.getCord = function() {
        return [x, y];
    };
}

function Snake(blockSize, color, blocks, dir) {
    this.blockSize = blockSize;
    this.blocks = blocks;
    this.direction = dir;
    this.nextDirection = dir;

    this.move = function() {
        this.direction = this.nextDirection;
        var next = this.blocks[0].slice();
        switch (this.direction) {
            case 37:  // Left
                next[0] -= 1;
                break;
            case 38: // Up
                next[1] -= 1;
                break;
            case 39: // Right
                next[0] += 1;
                break;
            case 40: // Down
                next[1] += 1;
                break;
        }
        if(this.collide(next)) return;
        this.blocks.unshift(next);
        this.blocks.pop();
    };

    this.turn = function(dir) {
        switch(dir) {
            case 37: // Left
                if (this.direction != 39)
                    this.nextDirection = dir;
                break;
            case 38: // Up
                if (this.direction != 40)
                    this.nextDirection = dir;
                break;
            case 39: // Right
                if (this.direction != 37)
                    this.nextDirection = dir;
                break;
            case 40: // Down
                if (this.direction != 38)
                    this.nextDirection = dir;
                break;
        }
    };

    this.collide = function (block) {
        // Collide with the borders of the area
        if ((block[0] * blockSize) >= game.area.width) {
            return game.stop();
        } else if ((block[0]) < 0) {
            return game.stop();
        } else if ((block[1] * blockSize) >= game.area.height) {
            return game.stop();
        } else if ((block[1]) < 0) {
            return game.stop();
        }

        // Collide with itself
        for (var i = 0; i < this.blocks.length; i++) {
            if (this.blocks[i][0] === block[0] && this.blocks[i][1] == block[1])
                return game.stop();
        }

        // "Collide" with the treat
        var treat = game.treat.getCord();
        if (block[0] === treat[0] && block[1] == treat[1]) {
            game.newTreat();
            this.blocks.push(treat);
        }
    };

    this.drawBlock = function (c, p) {
        c.fillRect(blockSize * p[0], blockSize * p[1], blockSize, blockSize);
    };

    this.draw = function () {
        context = game.area.getContext("2d");
        context.fillStyle = color;
        for (var i = 0; i < this.blocks.length; i++) {
            this.drawBlock(context, this.blocks[i]);
        }
    };
}

function updateArea() {
    game.update();
}

// MESSAGES

function submit_score(score) {
    var msg = {
        "messageType": "SCORE",
        "score": score
    };
    window.parent.postMessage(msg, "*");
}

function save_game() {
    var msg = {
        "messageType": "SAVE",
        "gameState": {
            "snake": game.player.blocks,
            "treat": game.treat.getCord(),
            "score": game.score,
			"direction": game.player.direction,
        }
    };
    window.parent.postMessage(msg, "*");
}

function load_game() {
    var msg = {
        "messageType": "LOAD_REQUEST"
    };
    window.parent.postMessage(msg, "*");
}

function settings() {
	var msg = {
		"messageType": "SETTING",
		"options": {
			"width": 245,
			"height": 450,	
		}
	};
	window.parent.postMessage(msg, "*")
}
window.addEventListener("message", function(evt) {
    if (evt.data.messageType === "LOAD") {
        startGame(evt.data.gameState.snake, evt.data.gameState.treat, evt.data.gameState.score, evt.data.gameState.direction);
		pauseGame();
		game.update();
    }
});

// WSD PROJECT 2015-2016 - Aleksi, Antti, Veikko
