export class TimeTrigger {
  
  constructor(timeout, count=undefined) {
    this.countout = count;
    this.count = 0;
    this.timeout = timeout;
    this.time = 0;
    this.callbacks = [];
  }

  setCount(count) {
    this.countout =  count;
    this.count = 0;
  }

  setTimeout(timeout) {
    this.timeout = timeout;
    this.time = 0;
  }

  reset() {
    this.count = 0;
    this.time = 0;
  }

  update(dt) {
    this.time += dt;

    if(this.time > this.timeout) {
      if(this.countout === undefined || this.count++ < this.countout) {
        for(let obj of this.callbacks) {
          obj.timeTriggered(this.timeout, this.time)
          this.time = 0;
        }
      }
    }
  }

  addCallback(obj) {
    this.callbacks.push(obj);
  }
}