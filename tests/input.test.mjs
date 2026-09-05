import test from 'node:test';
import assert from 'node:assert/strict';
import {joystickAxes,bindJoystick} from '../dist/src/input.js';

test('joystick has a neutral zone and progressive, bounded controls',()=>{
  assert.equal(joystickAxes(.04,-.04).throttle,0);
  assert.equal(joystickAxes(.04,-.04).steer,0);
  const slow=joystickAxes(0,-.4),fast=joystickAxes(0,-.8);
  assert.ok(slow.throttle>0&&slow.throttle<fast.throttle&&fast.throttle<1);
  assert.equal(joystickAxes(0,-2).throttle,1);
  assert.equal(joystickAxes(0,2).throttle,-1);
  assert.equal(joystickAxes(2,0).steer,1);
  assert.equal(joystickAxes(-2,0).steer,-1);
  const diagonal=joystickAxes(3,-3);
  assert.ok(diagonal.throttle>0&&diagonal.steer>0);
  assert.ok(Math.hypot(diagonal.x,diagonal.y)<=1.00001);
});

// Exercise the actual pointer handlers, including cancellation and multi-touch ownership.
class Pad extends EventTarget{
  captured=new Set();thumb={style:{}};
  classList={add(){},remove(){}};
  querySelector(){return this.thumb;}
  getBoundingClientRect(){return {left:20,top:30,width:140,height:140};}
  setPointerCapture(id){this.captured.add(id);}
  hasPointerCapture(id){return this.captured.has(id);}
  releasePointerCapture(id){this.captured.delete(id);}
  send(type,id,x=0,y=0){const e=new Event(type,{cancelable:true});Object.assign(e,{pointerId:id,button:0,clientX:90+x*44.8,clientY:100+y*44.8});this.dispatchEvent(e);}
}
test('one finger controls both axes; a second finger cannot steal or release the joystick',()=>{
  const pad=new Pad(),stick=bindJoystick(pad);
  pad.send('pointerdown',1,.5,-.7);const first={...stick.value};
  pad.send('pointerdown',2,-1,1);pad.send('pointermove',2,-1,1);pad.send('pointerup',2);
  assert.deepEqual(stick.value,first);
  pad.send('pointermove',1,-1,-1);
  assert.ok(stick.value.steer<0&&stick.value.throttle>0);
  pad.send('pointerup',1);assert.equal(stick.value.throttle,0);assert.equal(stick.value.steer,0);
  assert.equal(pad.captured.size,0);
});
test('dragging outside stays bounded; cancellation, lost capture and pause clear input',()=>{
  for(const ending of ['pointercancel','lostpointercapture','reset']){
    const pad=new Pad(),stick=bindJoystick(pad);pad.send('pointerdown',1,0,-1);pad.send('pointermove',1,30,-30);
    assert.ok(Math.hypot(stick.value.x,stick.value.y)<=1.00001);
    if(ending==='reset')stick.reset();else pad.send(ending,1);
    pad.send('pointermove',1,1,-1);
    assert.equal(stick.value.throttle,0);assert.equal(stick.value.steer,0);
    pad.send('pointerdown',2,0,-1);assert.ok(stick.value.throttle>1-1e-10);
  }
});
