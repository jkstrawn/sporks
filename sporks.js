function Timer() {
	this.gameTime = 0;
	this.maxStep = 0.05;
	this.lastTime = 0;
}

Timer.prototype.tick = function() {
	var currentTime = Date.now();
	var deltaTime = (currentTime - this.lastTime) / 1000;
	this.lastTime = currentTime;
	
	var gameDelta = Math.min(deltaTime, this.maxStep);
	this.gameTime += gameDelta;
	return gameDelta;
}

function AssetManager() {
console.log("test2");
	this.successCount = 0;
	this.errorCount = 0;
	this.cache = {};
	this.downloadQueue = [];
}

AssetManager.prototype.queueDownload = function(path) {
	this.downloadQueue.push(path);
}

AssetManager.prototype.downloadAll = function(callback) {
	if (this.downloadQueue.length === 0) {
		callback();
	}
	
	for (var i = 0; i < this.downloadQueue.length; i++) {
		var path = this.downloadQueue[i];
		var img = new Image();
		var that = this;
		img.addEventListener("load", function() {
			console.log(this.src + ' is loaded');
			that.successCount += 1;
			if (that.isDone()) {
				callback();
			}
		}, false);
		img.addEventListener("error", function() {
			that.errorCount += 1;
			if (that.isDone()) {
				callback();
			}
		}, false);
		img.src = path;
		this.cache[path] = img;
	}
}

AssetManager.prototype.getAsset = function(path) {
	return this.cache[path];
}

AssetManager.prototype.isDone = function() {
	return (this.downloadQueue.length == this.successCount + this.errorCount);
}

function GameEngine() {
	this.entities = [];
	this.GUI = [];
	this.ctxFG = null;
	this.ctxBG = null;
	this.click = null;
	this.dblClick = null;
	this.key = [];
	this.keyPress = [];
	this.mouse = null;
	this.mouseTemp = null;
	this.mouseDownEvent = false;
	this.mouseUpEvent = false;
	this.mouseDown = false;
	this.timer = new Timer();
	this.width = null;
	this.height = null;
	this.hotkeys = [];
	this.sporkSpawnRate = 1;
	this.heartSpawnRate = 0.001;
	this.count = 0;
	this.bert = null;
	this.backGroundColor = "gray";
	this.numberOfHearts = 0;
	this.timeTotal = 0;
	this.FPS = 0;
}

GameEngine.prototype.init = function(ctxFG, ctxBG) {
	console.log('game initialized');
	this.ctxFG = ctxFG;
	this.ctxBG = ctxBG;
	this.width = WIDTH = this.ctxFG.canvas.width;
	this.height = HEIGHT = this.ctxFG.canvas.height;
	this.startInput();
	for(var i = 0; i < 4; i++) {
		this.hotkeys[i] = 0;
	}

	this.setHotkey(0, 37);
	this.setHotkey(1, 38);
	this.setHotkey(2, 39);
	this.setHotkey(3, 40);
	this.bert = this.addEntity(new Bert(this, 400, 400));
}

GameEngine.prototype.start = function() {
	console.log("starting game");
	var that = this;
	(function gameLoop() {
		that.loop();
		requestAnimFrame(gameLoop, that.ctxFG.canvas);
	})();
}

GameEngine.prototype.startInput = function() {
	var getXandY = function(e) {
		var x =  e.clientX - that.ctxFG.canvas.getBoundingClientRect().left;
		var y = e.clientY - that.ctxFG.canvas.getBoundingClientRect().top;
		return {x: x, y: y};
	}
	
	var that = this;
	
	this.ctxFG.canvas.addEventListener("click", function(e) {
		that.click = getXandY(e);
		e.stopPropagation();
		e.preventDefault();
	}, false);

	this.ctxFG.canvas.addEventListener("mousemove", function(e) {
		that.mouse = getXandY(e);
	}, false);
	
	this.ctxFG.canvas.addEventListener("mousedown", function(e) {
		that.mouseDownEvent = true;
		that.mouseDown = true;
		that.mouseTemp = that.mouse;
	}, false);	
	
	this.ctxFG.canvas.addEventListener("mouseup", function(e) {
		that.mouseDown = false;
		that.mouseUpEvent = true;
	}, false);
	
	this.ctxFG.canvas.addEventListener("dblclick", function(e) {
		//that.dblClick = true;

//*************************************************************************************************************
		that.dblclick = getXandY(e);
		e.stopPropagation();
		e.preventDefault();

//*************************************************************************************************************
	}, false);

	document.body.addEventListener("keydown", function(e) {
		if(that.getKey(e.keyCode) == -1) {
		//if the key is NOT already in the list then add it
			that.key.push(e.keyCode);
		}
	}, false);

	document.body.addEventListener("keyup", function(e) {
		var index = that.getKey(e.keyCode);
		if(index >= 0) {
		//if the key is in the list then remove it
			that.key.splice(index, 1);
		}
		that.keyPress.push(e.keyCode);
	}, false);
}

GameEngine.prototype.clickTest = function(x, y) {
	this.click = {x: x, y: y};
}

GameEngine.prototype.setHotkey = function(index, value) {
	this.hotkeys[index] = value;
}

GameEngine.prototype.addEntity = function(entity) {
	this.entities.push(entity);
	return entity;
}

GameEngine.prototype.getKey = function(keyCode) {
	for(var i = 0; i < this.key.length; i++) {
		if(this.key[i] == keyCode) {
			return i;
		}
	}
	return -1;
}

GameEngine.prototype.draw = function(callback) {
	this.ctxFG.clearRect(0, 0, this.ctxFG.canvas.width, this.ctxFG.canvas.height);
	this.ctxFG.save();

	//g_plasma.frame(this.ctxBG);
	
	for(var z = 0; z < 3; z++) {
	//Go through the lists 3 times and only draw them if they have the z index
		for (var i = 0; i < this.entities.length; i++) {
			if(this.entities[i].z == z) {
				this.entities[i].draw(this.ctxFG);
			}
		}
	}
	this.ctxFG.restore();

	if (callback) {
		callback(this);
	}
}

GameEngine.prototype.update = function() {
	var entitiesCount = this.entities.length;
	var dt = this.clockTick*1000;
	if (this.sporkSpawnRate < 40) {
		this.sporkSpawnRate += 0.01;
	}
	this.FPS++;
	this.timeTotal += dt;
	if (this.timeTotal > 1000) {
		$('#FPS').html("FPS: " + this.FPS);
		this.FPS = this.timeTotal = 0;
	}

	this.count += this.sporkSpawnRate * dt;

	this.heartSpawnRate = 0.001;
	if (this.bert.lives < 2) {
		this.heartSpawnRate *= 2;
	}
	if( Math.random() < this.heartSpawnRate && this.numberOfHearts == 0 && this.bert.lives < 4) {
		this.addEntity(new Heart(this, Math.random()*(this.width-50), -100))
		this.numberOfHearts++;
	}

	if (this.count > 3000) {
		this.count = 0;
		this.addEntity(new Spork(this, Math.random()*(this.width-50), -100))
	}

	//$('#entities').html("Entities: " + entitiesCount);
	//$('#spawnRate').html("Spawn Rate: " + this.sporkSpawnRate);
	
	//if a key has been released
	for(var i = 0; i < this.keyPress.length; i++) {
		switch(this.keyPress[i]) {
			case this.hotkeys[0]:
				this.bert.setDirectionHorizontal(0);
				break;
			case this.hotkeys[1]:
				this.bert.setDirectionVertical(0);
				break;
			case this.hotkeys[2]:
				this.bert.setDirectionHorizontal(0);
				break;
			case this.hotkeys[3]:
				this.bert.setDirectionVertical(0);
				break;
		}
	}
	
	//if there are keys being pressed
	for(var i = 0; i < this.key.length; i++) {
		//for each key in the list
		switch(this.key[i]) {
			case this.hotkeys[0]:
				this.bert.setDirectionHorizontal(-1);
				break;
			case this.hotkeys[1]:
				this.bert.setDirectionVertical(-1);
				break;
			case this.hotkeys[2]:
				this.bert.setDirectionHorizontal(1);
				break;
			case this.hotkeys[3]:
				this.bert.setDirectionVertical(1);
				break;
		}
	}


	for(var i = 0; i < entitiesCount; i++) {
	//for each entity update it and (if its a player) check if the mouse is over it
		var entity = this.entities[i];
		
		if(!entity.removeFromWorld) {
			entity.update(dt);
		}
	}
	
	for(var i = this.entities.length-1; i >= 0; --i) {
		if(this.entities[i].removeFromWorld) {
			this.entities[i].remove();
			this.entities.splice(i, 1);
		}
	}
	
	//if the mouse has moved while pressing down
	if(this.mouse && this.mouseDown && (this.mouse.x != this.mouseTemp.x || this.mouse.y != this.mouseTemp.y)) {
		var xMove = this.mouseTemp.x - this.mouse.x;
		var yMove = this.mouseTemp.y - this.mouse.y;

		this.mouseTemp = this.mouse;
	}

	//when the user has clicked in the game
	if(this.click) {
		/*
		for (var i = 0; i < 30; i++) {
			//this.addEntity(new Particle(this.mouse.x, this.mouse.y, "star"));
			this.addEntity(new ConfettiPaper(this.mouse.x, this.mouse.y));
		}
		for (var i = 0; i < 20; i++) {
			//this.addEntity(new Particle(this.mouse.x, this.mouse.y, "star"));
			this.addEntity(new ParticleStar(this.mouse.x, this.mouse.y));
		}
		*/
		this.addEntity(new Shroom(this, this.mouse.x, this.mouse.y));
	}
}

GameEngine.prototype.loop = function() {
	this.clockTick = this.timer.tick();
	this.update();
	this.draw();
	this.click = null;
	this.dblClick = false;
	this.mouseDownEvent = false;
	this.mouseUpEvent = false;
	this.keyPress = [];
}

//**************************************************************************************************************

function Entity(game, x, y) {
	this.game = game;
	this.x = x;
	this.y = y;
	this.w = 1;
	this.h = 1;
	this.oldX = x;
	this.oldY = y;
	this.removeFromWorld = false;
	this.z = 0;
	this.speed = 1;
	this.isConfinedToMap = false;
}

Entity.prototype.setXandY = function(x, y) {
	if (this.hitbox) {
		this.hitbox.x += x - this.x;
		this.hitbox.y += y - this.y;
	}
	this.oldX = this.x;
	this.oldY = this.y;
	this.x = x;
	this.y = y;
	if (this.isConfinedToMap) {
		if (this.hitbox.x + this.hitbox.w > this.game.width || this.hitbox.x < 0)
			this.setXandY(this.oldX, this.y)
		if (this.hitbox.y + this.hitbox.h > this.game.height || this.hitbox.y < 0)
			this.setXandY(this.x, this.oldY)
	}
}

Entity.prototype.isInsideEntity = function(x, y) {
	if(x >= this.x && x <= (this.x + this.w) && y >= this.y && y <= (this.y + this.h)) {
		return true;
	}
	return false;
}

Entity.prototype.update = function() {
}

Entity.prototype.draw = function(ctx) {
}

Entity.prototype.remove = function() {
}

Entity.prototype.onHit = function() {
}

function EntityWithSprite(game, x, y, _sprite){
	if(!_sprite) return;
	Entity.call(this, game, x, y);

	this.sprite = ASSET_MANAGER.getAsset(_sprite);
	this.w = this.sprite.width;
	this.h = this.sprite.height;
}

EntityWithSprite.prototype = new Entity();
EntityWithSprite.prototype.constructor = EntityWithSprite;

EntityWithSprite.prototype.draw = function(ctx) {
	var x = Math.round(this.x);
	var y = Math.round(this.y);
	ctx.drawImage(this.sprite, this.x, this.y);
/*
	if (this.hitbox) {
		ctx.strokeRect(this.hitbox.x, this.hitbox.y, this.hitbox.w, this.hitbox.h);
	}
*/
}


//***********************************************************************************************************************************

function HitBox(x, y, w, h) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h
}

HitBox.prototype.setXandY = function(x, y) {
	this.x = x;
	this.y = y;
}

HitBox.prototype.isOverlap = function(that) {
	if (this == that) return;
	if (this.x < that.x + that.w && this.x + this.w > that.x && this.y + this.h > that.y && this.y < that.y + that.h) {
		return true;
	}
	return false;
}

//***********************************************************************************************************************************

function Bert(game, x, y) {
	EntityWithSprite.call(this, game, x, y, 'images/bert1front.png');
	this.spriteBase = "images/bert";

	this.speed = 4/17;
	this.lives = 4;
	this.directionVertical = 0;
	this.directionHorizontal = 0;
	this.hitbox = new HitBox(this.x + Math.round(this.w*0.18), 
							this.y + Math.round(this.h*0.14), 
							this.w - Math.round(this.w*.18) - Math.round(this.w*.09), 
							this.h - Math.round(this.h*0.14) - Math.round(this.h*.03));
	this.isConfinedToMap = true;
	this.immuneTimer = 0;
	this.shrooms = false;
	this.bleed = 0;
}

Bert.prototype = new EntityWithSprite();
Bert.prototype.constructor = Bert;

Bert.prototype.update = function(dt) {
	//immunity after being hit by spork
	if (this.immuneTimer > 0) {
		this.immune = true;
		this.immuneTimer -= dt;
	} else {
		this.immune = false;
		this.shrooms = false;
	}

	//bleed bert
	if (this.bleed > 0) {
		this.bleed--;
		this.game.addEntity(new ParticleBlood(this.x+20, this.y+30));
	}

	//move bert
	if (this.directionHorizontal != 0) {
		this.setXandY(this.x + this.directionHorizontal*this.speed*dt, this.y);
	}
	if (this.directionVertical != 0) {
		this.setXandY(this.x, this.y +this.directionVertical*this.speed*dt);
	}

	//check to see if bert is hit by spork
	for (var i = this.game.entities.length - 1; i >= 0; i--) {
		_entity = this.game.entities[i]
		if (_entity.hitbox) {
		//if it has a hitbox, see if its collided		
			if (this.hitbox.isOverlap(_entity.hitbox)) {
				//call the onhit function for the entity you hit
				_entity.onHit();
				if (this.shrooms && getObjectClass(_entity) == "Spork") {
					//explode spork
					_entity.removeFromWorld = true;

					for (var k = 0; k < 30; k++) {
						this.game.addEntity(new ConfettiPaper(_entity.x+Math.random()*50, _entity.y+Math.random()*60));
					}
					for (var k = 0; k < 20; k++) {
						this.game.addEntity(new ParticleStar(_entity.x+Math.random()*50, _entity.y+Math.random()*60));
					}
				}
			}
		}
	};
}

Bert.prototype.changelives = function(change) {
	if (change == -1) {
		if (!this.immune) {
			this.lives--;
			
			for (var i = 0; i < 30; i++) {
				this.game.addEntity(new ParticleBlood(this.x+20, this.y+30));
			}
			
			this.bleed = 20;
			if (this.lives < 1) {
				this.lives = 1;
			}
			this.immuneTimer = 1000;
		}
	} else {
		this.lives += change;
		if (this.lives > 4) {
			this.lives = 4;
		}
	}
	this.setDirectionHorizontal(this.directionHorizontal);
}

Bert.prototype.setDirectionHorizontal = function(dir) {
	this.directionHorizontal = dir;
	if (dir == -1) {
		this.sprite = ASSET_MANAGER.getAsset(this.spriteBase + (5 - this.lives) + 'left.png');
	} else if (dir == 1) {
		this.sprite = ASSET_MANAGER.getAsset(this.spriteBase + (5 - this.lives) + 'right.png');
	} else {
		this.sprite = ASSET_MANAGER.getAsset(this.spriteBase + (5 - this.lives) + 'front.png');
	}
}

Bert.prototype.setDirectionVertical = function(dir) {
	this.directionVertical = dir;
}

//***********************************************************************************************************************************

function FallingItem(game, x, y, sprite) {
	EntityWithSprite.call(this, game, x, y, sprite);
	this.hitbox = new HitBox(this.x, this.y, this.w, this.h);
}

FallingItem.prototype = new EntityWithSprite();
FallingItem.prototype.constructor = FallingItem;

FallingItem.prototype.update = function(dt) {
	if (this.y > game.height) {
		this.removeFromWorld = true;
	}
	this.setXandY(this.x, this.y + this.speed*dt);
}

//***********************************************************************************************************************************

function Spork(game, x, y) {
	FallingItem.call(this, game, x, y, 'images/spork.png');
	this.speed = 4/17;
}

Spork.prototype = new FallingItem();
Spork.prototype.constructor = Spork;

Spork.prototype.onHit = function() {
	this.game.bert.changelives(-1);
}

function Heart(game, x, y) {
	FallingItem.call(this, game, x, y, 'images/heart.png');
	this.speed = 2/17;
}

Heart.prototype = new FallingItem();
Heart.prototype.constructor = Heart;

Heart.prototype.remove = function() {
	this.game.numberOfHearts--;
}

Heart.prototype.onHit = function() {
	this.game.bert.changelives(1);
	this.removeFromWorld = true;
}

function Shroom(game, x, y) {
	FallingItem.call(this, game, x, y, 'images/shroom.png');
	this.speed = 2/17;
}

Shroom.prototype = new FallingItem();
Shroom.prototype.constructor = Shroom;

Shroom.prototype.onHit = function() {
	this.game.bert.shrooms = true;
	this.game.bert.immuneTimer = 10000;
	this.removeFromWorld = true;
}

//****************************************************************************************************************

function Particle(x, y) {
	Entity.call(this, game, x, y);

	this.vx = 0;
	this.vy = 0;
	this.ax = 0;
	this.ay = 0;
}

Particle.prototype = new Entity();
Particle.prototype.constructor = Particle;

Particle.prototype.update = function(dt) {
	this.vx += this.ax * dt;
	this.vy += this.ay * dt;
	this.x  += this.vx * dt;
	this.y  += this.vy * dt;

	if (this.y > game.height) {
		this.removeFromWorld = true;
	}
}

Particle.prototype.draw = function(ctx) {
}

//********************************************************************************************************************************************
function ParticleBlood(x, y) {
	Particle.call(this, x, y);

	this.color = "red";
	var size = Math.random();
	this.w =  size * 2 + 3;
	this.h = 4;
	this.ax = 0;
	this.ay = .001;
	this.vx = (1 - size) * 0.4 + 0.1;
	this.vy = ((Math.random() * 0.5 - 0.5) + (Math.random() * 0.5 - 0.5)) / 2.0;
}

ParticleBlood.prototype = new Particle();
ParticleBlood.prototype.constructor = ParticleBlood;

ParticleBlood.prototype.draw = function(ctx) {
	ctx.save();
	//ctx.translate(5 / this.stretch, 0);
	//ctx.scale(this.stretch, 1);
	ctx.beginPath();
	ctx.arc(this.x, this.y, this.w, 0, 2 * Math.PI, false);
	ctx.fillStyle = this.color;
	ctx.fill();
	ctx.restore();
}

//********************************************************************************************************************************************
function ParticleStar(x, y) {
	Particle.call(this, x, y);

	this.w = 10;
	this.h = 10;
	this.ax = 0;
	this.ay = .001;
	this.vx = Math.random() * 0.3 - 0.15;
	this.vy = Math.random() * 0.4 - 0.3;
}

ParticleStar.prototype = new Particle();
ParticleStar.prototype.constructor = ParticleStar;

ParticleStar.prototype.draw = function(ctx) {
	ctx.save()
	ctx.translate(0.5,0.5);
	ctx.strokeStyle = "white";
	ctx.strokeRect(this.x, this.y, 1, 1);
	ctx.restore();
}

//********************************************************************************************************************************************
function ParticleConfetti(x, y) {
	Particle.call(this, x, y);

	this.color = 'rgb('+Math.floor(Math.random()*255)+', ' + Math.floor(Math.random()*255) + ', ' + Math.floor(Math.random()*255) + ')';
	this.w = 10;
	this.h = 10;
	this.ax = 0;
	this.ay = .001;
	this.vx = Math.random() * 0.8 - 0.4;
	this.vy = Math.random() * 0.6 - 0.5;
}

ParticleConfetti.prototype = new Particle();
ParticleConfetti.prototype.constructor = ParticleConfetti;

ParticleConfetti.prototype.draw = function(ctx) {
	ctx.save()
	ctx.translate(0.5,0.5);
	ctx.fillStyle = ctx.strokeStyle = this.color;
	ctx.beginPath();
	ctx.moveTo(this.x, this.y);  
	ctx.lineTo(this.x + this.w, this.y);  
	ctx.lineTo(this.x + this.w, this.y + this.h);
	ctx.lineTo(this.x, this.y + this.h);
	ctx.closePath();
	ctx.fill();
	ctx.restore();
}

ParticleConfetti.prototype.update = function(dt) {
	this.vx += this.ax * dt;
	this.vy += this.ay * dt;
	this.x  += this.vx * dt;
	this.y  += this.vy * dt;
	if (this.vy > 0.2) {
		this.vy = 0.2;
		this.vx *= 0.95;
	}

	if (this.y > game.height) {
		this.removeFromWorld = true;
	}
}

//**************************************************************************************************************
function Vector2(_x, _y) {
	this.x = _x, this.y = _y;
	this.Length = function () {
		return Math.sqrt(this.SqrLength());
	}
	this.SqrLength = function () {
		return this.x * this.x + this.y * this.y;
	}
	this.Equals = function (_vec0, _vec1) {
		return _vec0.x == _vec1.x && _vec0.y == _vec1.y;
	}
	this.Add = function (_vec) {
		this.x += _vec.x;
		this.y += _vec.y;
	}
	this.Sub = function (_vec) {
		this.x -= _vec.x;
		this.y -= _vec.y;
	}
	this.Div = function (_f) {
		this.x /= _f;
		this.y /= _f;
	}
	this.Mul = function (_f) {
		this.x *= _f;
		this.y *= _f;
	}
	this.Normalize = function () {
		var sqrLen = this.SqrLength();
		if (sqrLen != 0) {
			var factor = 1.0 / Math.sqrt(sqrLen);
			this.x *= factor;
			this.y *= factor;
		}
	}
	this.Normalized = function () {
		var sqrLen = this.SqrLength();
		if (sqrLen != 0) {
			var factor = 1.0 / Math.sqrt(sqrLen);
			return new Vector2(this.x * factor, this.y * factor);
		}
		return new Vector2(0, 0);
	}
}

function ConfettiPaper(_x, _y) {
	this.vx = Math.random() * 0.8 - 0.4;
	this.vy = Math.random() * 0.6 - 0.5;
	this.ax = 0;
	this.ay = .001;
	this.z = 1;
	this.pos = new Vector2(_x, _y);
	this.rotationSpeed = Math.random() * 600 + 800;
	this.angle = DEG_TO_RAD * Math.random() * 360;
	this.rotation = DEG_TO_RAD * Math.random() * 360;
	this.cosA = 1.0;
	this.size = 5.0;
	this.oscillationSpeed = Math.random() * 1.5 + 0.5;
	this.xSpeed = 40.0;
	this.ySpeed = Math.random() * 60 + 100.0;
	this.corners = new Array();
	this.time = Math.random();
	var ci = Math.round(Math.random() * (colors.length - 1));
	this.frontColor = colors[ci][0];
	this.backColor = colors[ci][1];
	for (var i = 0; i < 4; i++) {
		var dx = Math.cos(this.angle + DEG_TO_RAD * (i * 90 + 45));
		var dy = Math.sin(this.angle + DEG_TO_RAD * (i * 90 + 45));
		this.corners[i] = new Vector2(dx, dy);
	}
	this.update = function (dt) {
		if (this.vy < 0) {
			this.vx += this.ax * dt;
			this.vy += this.ay * dt;
			this.pos.x  += this.vx * dt;
			this.pos.y  += this.vy * dt;
		} else {	
			this.vx *= 0.9;
			this.pos.x  += this.vx * dt;
		dt = dt / 1000;
		this.time += dt;
		this.rotation += this.rotationSpeed * dt;
		this.cosA = Math.cos(DEG_TO_RAD * this.rotation);
		this.pos.x += Math.cos(this.time * this.oscillationSpeed) * this.xSpeed * dt
		this.pos.y += this.ySpeed * dt;
	}

		if (this.pos.y > game.height) {
			this.removeFromWorld = true;
		}
	}
	this.draw = function (ctx) {
		if (this.cosA > 0) {
			ctx.fillStyle = this.frontColor;
		} else {
			ctx.fillStyle = this.backColor;
		}
		ctx.beginPath();
		ctx.moveTo(this.pos.x + this.corners[0].x * this.size, this.pos.y + this.corners[0].y * this.size * this.cosA);
		for (var i = 1; i < 4; i++) {
			ctx.lineTo(this.pos.x + this.corners[i].x * this.size, this.pos.y + this.corners[i].y * this.size * this.cosA);
		}
		ctx.closePath();
		ctx.fill();
	}
	this.remove = function() {

	}
}

//*****************************************************************************************************************

function Plasma() {
	// generate some palettes
	function rgb(r,g,b)
	{
		 return "rgb(" + r.toString() + "," + g.toString() + "," + b.toString() + ")";
	}
	
	this.palettes = [];
	
	var palette = [];
	for (var i=0; i<256; i++)
	{
		 palette.push(rgb(i,i,i));
	}
	this.palettes.push(palette);
	
	palette = [];
	for (var i=0; i<128; i++)
	{
		 palette.push(rgb(i*2,i*2,i*2));
	}
	for (var i=0; i<128; i++)
	{
		 palette.push(rgb(255-(i*2),255-(i*2),255-(i*2)));
	}
	this.palettes.push(palette);
	
	palette = new Array(256);
	for (var i = 0; i < 64; i++)
	{
		 palette[i] = rgb(i << 2,255 - ((i << 2) + 1),64);
		 palette[i+64] = rgb(255,(i << 2) + 1,128);
		 palette[i+128] = rgb(255 - ((i << 2) + 1),255 - ((i << 2) + 1),192);
		 palette[i+192] = rgb(0,(i << 2) + 1,255);
	}
	this.palettes.push(palette);
	
	palette = [];
	for (var i = 0,r,g,b; i < 256; i++)
	{
		 r = ~~(128 + 128 * Sin(Math.PI * i / 32));
		 g = ~~(128 + 128 * Sin(Math.PI * i / 64));
		 b = ~~(128 + 128 * Sin(Math.PI * i / 128));
		 palette.push(rgb(r,g,b));
	}
	this.palettes.push(palette);
	
	palette = [];
	for (var i = 0,r,g,b; i < 256; i++)
	{
			r = ~~(Sin(0.3 * i) * 64 + 190),
			g = ~~(Sin(0.3 * i + 2) * 64 + 190),
			b = ~~(Sin(0.3 * i + 4) * 64 + 190);
			palette.push(rgb(r,g,b));
	}
	this.palettes.push(palette);
	
	// init public properties for the GUI controls
	this.CycleSpeed = 2;
	this.ShowFPS = true;
	this.PlasmaDensity = 80;
	this.TimeFunction = 512;
	this.PlasmaFunction = 1;
	this.Jitter = 7;
	this.Alpha = 0.1;
	this.PaletteIndex = 2;
	this.paletteoffset = 0;
}
 
Plasma.prototype.frame = function(ctx) {
	// init context and img data buffer
	var w = WIDTH, h = HEIGHT,                      // canvas width and height
		 pw = this.PlasmaDensity, ph = (pw * (h/w)),    // plasma source width and height
		 palette = this.palettes[this.PaletteIndex],
		 paletteoffset = this.paletteoffset+=this.CycleSpeed,
		 plasmafun = this.PlasmaFunction;
	// scale the plasma source to the canvas width/height
	var vpx = (w/pw), vpy = (h/ph);

	var dist = function dist(a, b, c, d)
	{
		return Sqrt((a - c) * (a - c) + (b - d) * (b - d));
	}

	var time = Date.now() / this.TimeFunction;

	var colour = function colour(x, y)
	{
		switch (plasmafun)
		{
			 case 0:
					return ((Sin(dist(x + time, y, 128.0, 128.0) / 8.0)
									+ Sin(dist(x - time, y, 64.0, 64.0) / 8.0)
									+ Sin(dist(x, y + time / 7, 192.0, 64) / 7.0)
									+ Sin(dist(x, y, 192.0, 100.0) / 8.0)) + 4) * 32;
					break;
			 case 1:
					return (128 + (128 * Sin(x * 0.0625)) +
									128 + (128 * Sin(y * 0.03125)) +
									128 + (128 * Sin(dist(x + time, y - time, w, h) * 0.125)) +
									128 + (128 * Sin(Sqrt(x * x + y * y) * 0.125)) ) * 0.25;
					break;
		}
	}

	ctx.save();
	ctx.globalAlpha = this.Alpha;
	var jitter = this.Jitter ? (-this.Jitter + (Math.random()*this.Jitter*2)) : 0;
	for (var y=0,x; y<ph; y++)
	{
		for (x=0; x<pw; x++)
		{
			 // map plasma pixels to canvas pixels using the virtual pixel size
			 ctx.fillStyle = palette[(~~colour(x, y) + paletteoffset) % 256];
			 ctx.fillRect(x * vpx + jitter, y * vpy + jitter, vpx, vpy);
		}
	}
	ctx.restore();
}

//****************************************************************************************************************

window.requestAnimFrame = (function() {
	  return  window.requestAnimationFrame       ||
			  window.webkitRequestAnimationFrame ||
			  window.mozRequestAnimationFrame    ||
			  window.oRequestAnimationFrame      ||
			  window.msRequestAnimationFrame     ||
			  function(/* function */ callback, /* DOMElement */ element){
				window.setTimeout(callback, 1000 / 60);
			  };
})();

var DEG_TO_RAD = Math.PI / 180;
var RAD_TO_DEG = 180 / Math.PI;
var RAD = Math.PI/180.0;
var Sin = Math.sin;
var Cos = Math.cos;
var Sqrt = Math.sqrt;
WIDTH = 100;
HEIGHT = 100;
var colors = [
	["#df0049", "#B2003A"],
	["#00CC00", "#00A300"],
	["#2bebbc", "#22BC96"],
	["#0000FF", "#0000CC"],
	["#FF3399", "#CC297A"],
	["#ffd200", "#E6BD00"]
];
var canvasFG, canvasBG, ctxFG, ctxBG, game, g_plasma;

var ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload('images/spork.png');
ASSET_MANAGER.queueDownload('images/heart.png');
ASSET_MANAGER.queueDownload('images/gift.png');
ASSET_MANAGER.queueDownload('images/shroom.png');
ASSET_MANAGER.queueDownload('images/bert1front.png');
ASSET_MANAGER.queueDownload('images/bert1left.png');
ASSET_MANAGER.queueDownload('images/bert1right.png');
ASSET_MANAGER.queueDownload('images/bert2front.png');
ASSET_MANAGER.queueDownload('images/bert2left.png');
ASSET_MANAGER.queueDownload('images/bert2right.png');
ASSET_MANAGER.queueDownload('images/bert3front.png');
ASSET_MANAGER.queueDownload('images/bert3left.png');
ASSET_MANAGER.queueDownload('images/bert3right.png');
ASSET_MANAGER.queueDownload('images/bert4front.png');
ASSET_MANAGER.queueDownload('images/bert4left.png');
ASSET_MANAGER.queueDownload('images/bert4right.png');

$(document).ready( function() {

	canvasFG = document.getElementById('surface');
	ctxFG = canvasFG.getContext('2d');
	//canvasBG = document.getElementById('background');
	//ctxBG = canvasBG.getContext('2d');
	game = new GameEngine();
	g_plasma = new Plasma();


	$(document).keypress(function(event) { return sendKeyStroke(event) });
	$(document).keydown(function(event) { return cancelBackspace(event) });
});

function sendKeyStroke (event) {
	return false;
}

function cancelBackspace (event) {
	if (event.keyCode == 8 || event.keyCode == 9) {
		return false;
	}
}

ASSET_MANAGER.downloadAll(function() {
	game.init(ctxFG, ctxBG);
	game.start();
});

function getObjectClass(obj) {
	if (obj && obj.constructor && obj.constructor.toString) {
		var arr = obj.constructor.toString().match(
			/function\s*(\w+)/);

		if (arr && arr.length == 2) {
			return arr[1];
		}
	}

	return undefined;
}