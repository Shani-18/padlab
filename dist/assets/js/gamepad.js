/** Pure controller normalization and measurement helpers, independent of the DOM. */
export const LABELS = ['A / Cross','B / Circle','X / Square','Y / Triangle','LB / L1','RB / R1','LT / L2','RT / R2','View / Share','Menu / Options','L stick','R stick','D-pad up','D-pad down','D-pad left','D-pad right','Home'];
export function number(value, min = -1, max = 1) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : 0;
}
export function snapshot(pad) {
  return { id: String(pad.id), index: pad.index, mapping: pad.mapping === 'standard' ? 'standard' : 'raw',
    axes: Array.from(pad.axes, value => number(value)),
    buttons: Array.from(pad.buttons, b => ({ value: number(typeof b === 'number' ? b : b.value, 0, 1), pressed: typeof b === 'number' ? b > .5 : Boolean(b.pressed) })) };
}
export function stick(axes, offset) {
  if (axes.length < offset + 2) return null;
  const x = number(axes[offset]), y = number(axes[offset + 1]);
  return { x, y, radial: Math.hypot(x, y) };
}
export function summarize(samples) {
  if (!samples.length) return null;
  const mean = samples.reduce((sum, s) => sum + s.radial, 0) / samples.length;
  return { samples: samples.length, meanRadialOffset: mean, peakRadialOffset: Math.max(...samples.map(s => s.radial)), meanX: samples.reduce((sum, s) => sum + s.x, 0) / samples.length, meanY: samples.reduce((sum, s) => sum + s.y, 0) / samples.length };
}
export function readGamepads(nav) {
  if (typeof nav.getGamepads !== 'function') return { pads: [], error: 'This browser does not expose the Gamepad API. Try an up-to-date browser with gamepad support.' };
  try { return { pads: Array.from(nav.getGamepads()).filter(p => p && p.connected), error: null }; }
  catch { return { pads: [], error: 'Controller access is blocked. Open this page directly over HTTPS and check your browser permissions.' }; }
}
export function demoPad(now) {
  const t = now / 1000;
  return { id: 'Demo controller · simulated inputs', index: -1, connected: true, mapping: 'standard', axes: [Math.sin(t) * .6, Math.cos(t) * .6, Math.sin(t * .7) * .018, Math.cos(t * .7) * .014], buttons: Array.from({ length: 17 }, (_, i) => { const value = i === 6 ? (Math.sin(t) + 1) / 2 : i === 7 ? (Math.cos(t) + 1) / 2 : i === Math.floor(t) % 4 ? 1 : 0; return { value, pressed: value > .5 }; }) };
}
export function makeReport(state, seen, drift, isDemo, deadzone) {
  return { tool: 'PadLab', version: 1, exportedAt: new Date().toISOString(), simulated: isDemo, controller: state, buttonsObservedPressed: [...seen].sort((a, b) => a - b), drift, visualDeadzone: deadzone, measurementNotes: 'Raw browser-exposed inputs. Drift is sampled at browser frame cadence while sticks should be at rest. No hardware calibration, polling-rate or end-to-end latency measurement.' };
}
