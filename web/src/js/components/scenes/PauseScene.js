import Phaser from 'phaser'

export default class PauseScene extends Phaser.Scene{
    constructor(){
        super("PauseScene");
    }
    preload (){ }

    create () { 
      this.add.rectangle(this.game.config.width/2, this.game.config.height/2, 200, 200, 0xffff00);
      this.scene.bringToTop();
      this.input.on("pointerdown", this.unpause, this);
    }

    unpause() {
      console.log(JSON.stringify(['unpausing']));
      var theOtherScene = this.scene.get('MainScene');
      theOtherScene.scene.restart();
      this.scene.stop();
    }

    update() {
        
    }
}