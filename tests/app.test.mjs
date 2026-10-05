import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import * as helpers from '../dist/assets/js/gamepad.js';
const source = (await readFile(new URL('../dist/assets/js/app.js',import.meta.url),'utf8')).replace(/^import .*;\n/,'');
class Element {
 constructor(){this.textContent='';this.children=[];this.style={};this.attrs={};this.listeners={};this.disabled=false;this.value='';this.classes=new Set();this.classList={toggle:(name,on)=>on?this.classes.add(name):this.classes.delete(name)};this.dataset={};}
 append(...nodes){this.children.push(...nodes)}
 replaceChildren(...nodes){this.children=nodes}
 setAttribute(k,v){this.attrs[k]=v}
 addEventListener(k,fn){this.listeners[k]=fn}
 add(node){this.children.push(node)}
 click(){this.clicked=true;return this.listeners.click?.({target:this})}
 remove(){}
}
function harness(){
 const nodes=new Map(),listeners={},windowListeners={};let now=0,callback=null,pads=[],downloads=[];
 const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id)};
 const document={hidden:false,getElementById:get,querySelectorAll:()=>[],createElement:()=>new Element(),createDocumentFragment:()=>new Element(),body:new Element(),addEventListener:(k,fn)=>listeners[k]=fn};
 get('deadzone').value='10';
 const context={...helpers,document,navigator:{getGamepads:()=>pads},window:{isSecureContext:true,addEventListener:(k,fn)=>windowListeners[k]=fn},performance:{now:()=>now},requestAnimationFrame:fn=>{callback=fn;return 1},cancelAnimationFrame:()=>{callback=null},Option:class extends Element{constructor(text,value){super();this.textContent=text;this.value=value}},Blob,URL:{createObjectURL:b=>{downloads.push(b);return 'blob:test'},revokeObjectURL:()=>{}},setTimeout:fn=>fn(),console};
 vm.runInNewContext(source,context);
 return {get,document,listeners,windowListeners,context,downloads,pads:value=>pads=value,tick:(delta=40)=>{now+=delta;assert.ok(callback,'animation loop exists');callback(now)},click:id=>get(id).click()};
}
function pad(index=0,options={}){return {id:`Test ${index}`,index,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false})),...options};}
test('empty state, hot-plug, sparse index and disconnect clear old readings',()=>{const h=harness();h.tick();assert.equal(h.get('export').disabled,true);const p=pad(3);p.buttons[0]={value:1,pressed:true};h.pads([null,null,null,p]);h.tick();assert.equal(h.get('device-name').textContent,'Test 3');assert.equal(h.get('pressed-count').textContent,'1 pressed');h.pads([]);h.tick();assert.equal(h.get('left-x').textContent,'—');assert.equal(h.get('export').disabled,true);assert.equal(h.get('lt-meter').style.width,'0%');});
test('switching controllers clears coverage and changes axes',()=>{const h=harness();const a=pad(0),b=pad(2,{axes:[.5,0,0,0]});a.buttons[1].pressed=true;h.pads([a,b]);h.tick();h.get('controller-select').listeners.change({target:{value:'2'}});h.tick();assert.equal(h.get('left-x').textContent,'0.500');assert.equal(h.get('session-status').textContent,'0 / 17 buttons observed');});
test('unknown mappings preserve raw data and disable invented stick assignments',()=>{const h=harness();h.pads([pad(0,{mapping:'',axes:[.7,.4]})]);h.tick();assert.equal(h.get('left-x').textContent,'—');assert.equal(h.get('drift').disabled,true);assert.match(h.get('mapping-help').textContent,/no standard mapping/);assert.equal(h.get('raw-axes').children[0].textContent,'Axis 0: 0.7000');});
test('three-second drift sample computes known fixed offsets and exports results',async()=>{const h=harness();h.pads([pad(0,{axes:[.03,.04,0,0]})]);h.tick();h.click('drift');for(let i=0;i<76;i++)h.tick();assert.match(h.get('drift-result').textContent,/Left: 5.00% mean \/ 5.00% peak/);h.click('export');const report=JSON.parse(await h.downloads[0].text());assert.equal(report.drift.left.meanRadialOffset.toFixed(2),'0.05');assert.equal(report.simulated,false);});
test('hiding tab cancels sample and resumes a single loop',()=>{const h=harness();h.pads([pad()]);h.tick();h.click('drift');h.document.hidden=true;h.listeners.visibilitychange();assert.match(h.get('drift-result').textContent,/canceled/);h.document.hidden=false;h.listeners.visibilitychange();h.tick();assert.equal(h.get('drift').disabled,false);});
test('reset clears stored sample and coverage',()=>{const h=harness();h.pads([pad()]);h.tick();h.click('drift');h.click('reset');h.tick();assert.equal(h.get('drift').disabled,false);assert.match(h.get('notice').textContent,/Session reset/);});
test('demo is explicitly labeled and export cannot be mistaken for physical data',async()=>{const h=harness();h.click('demo');h.tick();assert.equal(h.get('connection').textContent,'Demo mode');assert.equal(h.get('vibrate').disabled,true);h.click('export');assert.equal(JSON.parse(await h.downloads[0].text()).simulated,true);h.click('demo');h.tick();assert.equal(h.get('export').disabled,true);});
test('vibration success and rejection have user-facing feedback',async()=>{const h=harness();let called;const p=pad(0,{vibrationActuator:{playEffect:async(...args)=>{called=args;return 'complete'}}});h.pads([p]);h.tick();await h.click('vibrate');assert.equal(called[0],'dual-rumble');assert.equal(called[1].duration,500);assert.match(h.get('notice').textContent,/command completed/);p.vibrationActuator.playEffect=async()=>{throw Error('Unsupported')};h.tick();await h.click('vibrate');assert.match(h.get('notice').textContent,/could not run/);});
test('blocked API is rendered without terminating animation',()=>{const h=harness();h.context.navigator.getGamepads=()=>{throw Error('Security')};h.tick();assert.match(h.get('notice').textContent,/blocked/);h.tick();});
test('deadzone adjusts reference circle without filtering raw inputs',()=>{const h=harness();h.pads([pad(0,{axes:[.02,.01,0,0]})]);h.tick();h.get('deadzone').value='25';h.get('deadzone').listeners.input();h.tick();assert.equal(h.get('left-zone').style.width,'25%');assert.equal(h.get('left-x').textContent,'0.020');});
