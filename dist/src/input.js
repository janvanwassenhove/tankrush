// Same analog values feed the simulation for touch and keyboard steering.
export function joystickAxes(x,y){
  const length=Math.hypot(x,y);
  if(length<=.1)return {steer:0,throttle:0,x:0,y:0};
  const extent=Math.min(1,length),strength=((extent-.1)/.9)**1.2;
  return {steer:x/length*strength,throttle:-y/length*strength,x:x/length*extent,y:y/length*extent};
}

export function bindJoystick(element){
  let pointer=null;
  const thumb=element.querySelector('.joystick-thumb');
  const controller={value:joystickAxes(0,0),reset};
  function reset(){
    const previous=pointer;pointer=null;
    controller.value=joystickAxes(0,0);
    thumb.style.transform='translate(0px,0px)';
    element.classList.remove('active');
    if(previous!==null&&element.hasPointerCapture(previous))element.releasePointerCapture(previous);
  }
  function move(event){
    if(event.pointerId!==pointer)return;
    const box=element.getBoundingClientRect(),radius=box.width*.32;
    controller.value=joystickAxes((event.clientX-box.left-box.width/2)/radius,(event.clientY-box.top-box.height/2)/radius);
    thumb.style.transform=`translate(${controller.value.x*radius}px,${controller.value.y*radius}px)`;
  }
  element.addEventListener('pointerdown',event=>{
    if(pointer!==null||event.button!==0)return;
    event.preventDefault();pointer=event.pointerId;
    element.setPointerCapture(pointer);element.classList.add('active');move(event);
  });
  element.addEventListener('pointermove',move);
  for(const type of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(type,event=>{if(event.pointerId===pointer)reset();});
  return controller;
}
