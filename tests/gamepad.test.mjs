import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshot, stick, summarize, readGamepads, demoPad, makeReport } from '../dist/assets/js/gamepad.js';
test('normalizes invalid and out-of-range browser input without changing valid values', () => {
 const s = snapshot({id:'pad',index:2,mapping:'',axes:[NaN,2,-2,.12],buttons:[{value:3,pressed:true},{value:NaN,pressed:false},1]});
 assert.deepEqual(s.axes,[0,1,-1,.12]); assert.equal(s.mapping,'raw'); assert.equal(s.buttons[0].value,1); assert.equal(s.buttons[1].value,0); assert.equal(s.buttons[2].pressed,true);
});
test('radial offset preserves diagonal magnitude above 100%',()=>{assert.equal(stick([1,1],0).radial,Math.SQRT2);assert.equal(stick([0],0),null);assert.equal(stick([0,0],2),null);});
test('drift averages distance rather than canceling opposing offsets',()=>{const s=summarize([stick([.03,.04],0),stick([-.03,-.04],0)]);assert.equal(s.meanRadialOffset,.05);assert.equal(s.meanX,0);assert.equal(s.peakRadialOffset,.05);assert.equal(summarize([]),null);});
test('sparse gamepad arrays and disconnected entries are filtered',()=>{const p={connected:true,index:3};assert.deepEqual(readGamepads({getGamepads:()=>[null,,{connected:false},p]}).pads,[p]);});
test('unsupported and policy-blocked APIs produce actionable errors',()=>{assert.match(readGamepads({}).error,/does not expose/);assert.match(readGamepads({getGamepads(){throw Error('SecurityError')}}).error,/blocked/);});
test('demo stays within valid ranges over time',()=>{for(let t=0;t<20000;t+=177){const p=demoPad(t);assert.equal(p.buttons.length,17);assert.ok(p.axes.every(a=>a>=-1&&a<=1));assert.ok(p.buttons.every(b=>b.value>=0&&b.value<=1));}});
test('export marks simulated data and orders observed button indices numerically',()=>{const r=makeReport(snapshot(demoPad(0)),new Set([10,2,0]),null,true,.1);assert.equal(r.simulated,true);assert.deepEqual(r.buttonsObservedPressed,[0,2,10]);assert.equal(r.visualDeadzone,.1);assert.ok(JSON.parse(JSON.stringify(r)).controller);});
