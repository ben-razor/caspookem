import Phaser from 'phaser'

let gameOptions = {
 
    // water level, in % of screen height
    waterLevel: 60,
 
    // ball gravity
    ballGravity: 1600,
 
    // jump power
    ballPower: 800
}

export default class UnderwaterScene extends Phaser.Scene{
    constructor(){
        super("MainScene");
    }
    static onGameOver;
    static setGameOver(onGameOver) {
        UnderwaterScene.onGameOver = onGameOver;
    }
    requestRestart() {
        console.log('restart requested');
        UnderwaterScene.instance.locked = true;
    }
    setBallColor(color) {
        console.log(JSON.stringify(['sbc', color]));
        this.ball.tint = color;
        this.game.registry.tint = color;
    }
    static instance;
    preload(){
        UnderwaterScene.instance = this;
        this.load.setBaseURL('https://casper-game-1.storage.googleapis.com/')
        this.load.image("ball", "ball-white-1.png");
        this.load.image("water", "water.png");
    }
    create(){
        let game = this.game;
        this.deed = false;
        this.locked = false;
        this.setScore(0);

        // add water sprite
        this.water = this.physics.add.sprite(0, game.config.height / 100 * gameOptions.waterLevel, "water");
        this.water.body.allowGravity = false;
 
        // set registration point to top left pixel
        this.water.setOrigin(0, 0);
 
        // set display width to cover the entire game width
        this.water.displayWidth = game.config.width;
 
        // set display height to cover from water level to the bottom of the canvas
        this.water.displayHeight = game.config.height - this.water.y;

        // add ball sprite
        this.ball = this.physics.add.sprite(game.config.width / 2, game.config.height / 10, "ball");
        console.log(JSON.stringify(['reg tint', this.game.registry.tint]));
        
        if(this.game.registry.tint) {
            this.ball.tint = this.game.registry.tint;
        }
        this.ball.setCollideWorldBounds();
        this.ball.body.onWorldBounds = true;
        this.physics.add.overlap(this.ball, this.water, this.coll, null, this);

        // set ball ballGravity
        this.ball.body.gravity.y = gameOptions.ballGravity * (this.isUnderwater() ? -1 : 1)
 
        // listener for input, calls "jump" method
        this.input.on("pointerdown", this.jump, this);

        this.physics.world.on('worldbounds', this.onWorldBounds, this);

        this.events.on('resume', this.onResume, this);
    }

    onResume() {
        console.log(JSON.stringify(['resuming']));
    }

    onWorldBounds() {
        console.log('world bounds')
        this.doDeed();
    }

    coll() {
        console.log('collision!');
        this.doDeed();
    }

    doDeed() {
        if(!this.deed) {
            document.getElementById('deed-msg').style.display = 'block';
            this.deed = true;
            let score = this.score;
            this.setScore(0);
            this.scene.launch('PauseScene')
            this.scene.pause();

            if(UnderwaterScene.onGameOver) {
                UnderwaterScene.onGameOver({score});
            }
        }
    }

    doUndeed() {
        this.deed = false;
        document.getElementById('deed-msg').style.display = 'none';
    }
 
    // method to make ball jump
    jump(){
        // set ball velocity to positive or negative jump speed according to ball position
        this.ball.body.velocity.y = gameOptions.ballPower * (this.isUnderwater() ? 1 : -1);
        this.doUndeed();
        this.setScore(this.score + 1);
    }

    setScore(score) {
        this.score = score;
        document.getElementById('score').innerHTML = this.score;
    }
 
    // method to check if the ball is underwater
    isUnderwater(){
        let game = this.game;
        // true if ball y position is higher than water level
        return this.ball.y > game.config.height / 100 * gameOptions.waterLevel
    }
    update(){
        // determine next ball gravity
        let nextGravity = gameOptions.ballGravity * (this.isUnderwater() ? -1 : 1);
 
        // is next ball gravity different than current ball gravity?
        // this means we moved from land to water or from water to land
        if(nextGravity !== this.ball.body.gravity.y){
 
            // set ball ballGravity
            this.ball.body.gravity.y = nextGravity;
 
            // set ball velocity as if we just jumped
            this.ball.body.velocity.y = gameOptions.ballPower * (this.isUnderwater() ? 1 : -1);
        }
    }
}