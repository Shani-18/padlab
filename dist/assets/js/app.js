import { LABELS, snapshot, stick, summarize, readGamepads, demoPad, makeReport } from './gamepad.js';

const $ = id => document.getElementById(id);
const ui = Object.fromEntries(['demo','device-name','device-hint','controller-select','connection','notice','mapping-label','diagram-caption','button-count','axis-count','mapping-stat','source-stat','button-grid','pressed-count','mapping-help','raw-axes','drift','drift-result','deadzone','deadzone-output','session-status','vibrate','reset','export'].map(id => [id, $(id)]));
let isDemo = false, selected = null, current = null, currentPad = null, identity = '', listKey = '', gridKey = '';
let seen = new Set(), drift = null, sample = null, animation = 0, previousRender = 0, hapticBusy = false, noticeUntil = 0;
let cells = [], rawAxisNodes = [];
const svgControls = [...document.querySelectorAll('[data-button]')];

function setText(node, text) { if (node.textContent !== text) node.textContent = text; }
function message(text, hold = 0) { setText(ui.notice, text); noticeUntil = performance.now() + hold; }
function clearSession(reason = '') {
  seen = new Set(); drift = null; sample = null;
  ui.drift.textContent = 'Run drift test →';
  ui['drift-result'].textContent = reason || (current ? 'Release both sticks before starting.' : 'Connect a controller to start.');
}
function populateButtons(state) {
  const key = `${state?.mapping}:${state?.buttons.length ?? 17}:${state?.axes.length ?? 0}`;
  if (gridKey === key) return;
  gridKey = key; cells = [];
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < (state?.buttons.length ?? 17); i++) {
    const cell = document.createElement('div'); cell.className = 'input-cell';
    const label = document.createElement('span');
    const isStandard = !state || state.mapping === 'standard';
    label.textContent = isStandard && LABELS[i] ? LABELS[i].split(' / ')[0] : `B${i}`;
    const sub = document.createElement('small'); sub.textContent = isStandard && LABELS[i]?.includes(' / ') ? LABELS[i].split(' / ')[1] : `Button ${i}`;
    label.append(sub);
    const value = document.createElement('output'); value.setAttribute('aria-live', 'off'); value.setAttribute('aria-label', `Button ${i} value`); value.textContent = '—';
    cell.append(label, value); fragment.append(cell); cells.push({ cell, value });
  }
  ui['button-grid'].replaceChildren(fragment);
  rawAxisNodes = [];
  ui['raw-axes'].replaceChildren();
  for (let i = 0; i < (state?.axes.length ?? 0); i++) {
    const node = document.createElement('span'); ui['raw-axes'].append(node); rawAxisNodes.push(node);
  }
  if (!state?.axes.length) ui['raw-axes'].textContent = 'No axis data available.';
}
function updateSelection(pads) {
  const key = `${isDemo}:${pads.map(p => `${p.index}:${p.id}`).join('|')}`;
  if (listKey === key) return;
  listKey = key;
  if (!isDemo && !pads.some(p => p.index === selected)) selected = pads[0]?.index ?? null;
  ui['controller-select'].replaceChildren();
  const choices = isDemo ? [{ index: -1, id: 'Demo controller (simulated)' }] : pads;
  if (!choices.length) ui['controller-select'].add(new Option('No controllers detected', ''));
  choices.forEach(p => ui['controller-select'].add(new Option(`${p.index < 0 ? 'Demo' : `Pad ${p.index + 1}`} · ${p.id}`, String(p.index))));
  ui['controller-select'].value = isDemo ? '-1' : selected === null ? '' : String(selected);
}
function drawStick(name, data) {
  $(name + '-dot').style.left = `${50 + (data?.x ?? 0) * 47}%`;
  $(name + '-dot').style.top = `${50 + (data?.y ?? 0) * 47}%`;
  $(name + '-dot').style.visibility = data ? 'visible' : 'hidden';
  $(name + '-x').textContent = data ? data.x.toFixed(3) : '—';
  $(name + '-y').textContent = data ? data.y.toFixed(3) : '—';
  $(name + '-offset').textContent = data ? `${(data.radial * 100).toFixed(1)}%` : '—';
  $(name + '-thumb').setAttribute('transform', `translate(${(data?.x ?? 0) * 7} ${(data?.y ?? 0) * 7})`);
}
function hasHaptics(pad) { return !isDemo && typeof pad?.vibrationActuator?.playEffect === 'function'; }
function render(pad, now, error) {
  const next = pad ? snapshot(pad) : null;
  const nextIdentity = pad ? `${isDemo}:${pad.index}:${pad.id}:${pad.mapping}:${pad.buttons.length}:${pad.axes.length}` : '';
  if (identity !== nextIdentity) {
    identity = nextIdentity; current = next;
    clearSession(pad ? '' : 'Controller disconnected or unavailable. Reconnect and press a button.');
  }
  current = next; currentPad = pad;
  populateButtons(next);
  const standard = next?.mapping === 'standard';
  ui['device-name'].textContent = next?.id ?? 'Connect your controller';
  ui['device-hint'].textContent = isDemo ? 'Preview mode — all readings are simulated, not hardware measurements.' : next ? `${next.buttons.length} buttons · ${next.axes.length} axes · ${standard ? 'Standard mapping' : 'Unmapped device: numbered inputs'}` : 'Use USB or Bluetooth, then press a controller button.';
  ui.connection.textContent = isDemo ? 'Demo mode' : next ? 'Connected' : 'Waiting for input';
  ui.connection.classList.toggle('connected', Boolean(next));
  ui['mapping-label'].textContent = standard ? 'Standard controller layout' : next ? 'Diagram inactive · raw inputs below' : 'Standard layout preview';
  ui['mapping-stat'].textContent = next ? next.mapping : '—';
  ui['button-count'].textContent = next?.buttons.length ?? '—';
  ui['axis-count'].textContent = next?.axes.length ?? '—';
  ui['source-stat'].textContent = isDemo ? 'Simulated' : next ? 'Gamepad API' : '—';
  ui['diagram-caption'].textContent = isDemo ? 'Demo running · connect a controller for real results' : next ? 'Live button feedback · standard layout reference' : 'Press any button to bring your controller to life';
  ui['mapping-help'].textContent = standard ? 'Browser standard mapping: axes 0/1 are the left stick; 2/3 are the right stick. Trigger buttons are 6/7. Values are browser-normalized, not electrical sensor readings.' : next ? 'This device has no standard mapping. Button numbers and raw axis values are shown as reported. Stick, trigger and diagram assignments are unavailable to avoid incorrect labels.' : 'Standard labels are a preview until a controller connects.';
  if (now >= noticeUntil) setText(ui.notice, error || (!window.isSecureContext ? 'Use HTTPS or localhost for controller access.' : isDemo ? 'DEMO MODE · Simulated inputs are for exploring the interface only.' : 'Your controller inputs stay in this browser. Nothing is uploaded.'));
  let pressed = 0;
  cells.forEach(({ cell, value }, i) => {
    const button = next?.buttons[i];
    if (button?.pressed) { seen.add(i); pressed++; }
    cell.classList.toggle('pressed', !!button?.pressed); cell.classList.toggle('seen', seen.has(i));
    value.textContent = button ? button.value.toFixed(2) : '—';
    cell.setAttribute('aria-label', `${standard && LABELS[i] ? LABELS[i] : `Button ${i}`}: ${button?.pressed ? 'pressed' : 'released'}, value ${button ? button.value.toFixed(2) : 'unavailable'}${seen.has(i) ? ', observed in this session' : ''}`);
  });
  ui['pressed-count'].textContent = `${pressed} pressed`;
  svgControls.forEach(el => el.classList.toggle('active', !!(standard && next.buttons[Number(el.dataset.button)]?.pressed)));
  const left = standard ? stick(next.axes, 0) : null, right = standard ? stick(next.axes, 2) : null;
  drawStick('left', left); drawStick('right', right);
  ['lt','rt'].forEach((name, i) => { const b = standard ? next.buttons[6 + i] : null; $(name + '-value').textContent = b ? b.value.toFixed(2) : '—'; $(name + '-meter').style.width = `${(b?.value ?? 0) * 100}%`; });
  rawAxisNodes.forEach((node, i) => { node.textContent = `Axis ${i}: ${next.axes[i].toFixed(4)}`; });
  ui.drift.disabled = !left || !right || !!sample;
  ui.export.disabled = !next;
  ui.vibrate.disabled = !hasHaptics(pad) || hapticBusy;
  ui.vibrate.title = hasHaptics(pad) ? 'Run a short 500 ms vibration pulse' : 'No supported vibration actuator exposed by this browser';
  ui['session-status'].textContent = next ? `${isDemo ? 'Demo · ' : ''}${seen.size} / ${next.buttons.length} buttons observed` : 'Ready when you are';
  if (sample && left && right) {
    sample.left.push(left); sample.right.push(right);
    const remaining = Math.max(0, 3000 - (now - sample.start));
    ui.drift.textContent = `Sampling… ${(remaining / 1000).toFixed(1)}s`;
    if (remaining === 0) {
      drift = { durationMs: now - sample.start, left: summarize(sample.left), right: summarize(sample.right), simulated: isDemo };
      const format = data => `${(data.meanRadialOffset * 100).toFixed(2)}% mean / ${(data.peakRadialOffset * 100).toFixed(2)}% peak`;
      ui['drift-result'].textContent = `${isDemo ? 'Simulated sample. ' : ''}Left: ${format(drift.left)}. Right: ${format(drift.right)}. Compare with your game’s deadzone; no universal pass/fail threshold.`;
      sample = null; ui.drift.textContent = 'Run drift test again →'; ui.drift.disabled = false;
    }
  }
}
function frame(now) {
  // Limit DOM updates to ~30 Hz; this is a UI cadence, not a hardware polling measurement.
  if (now - previousRender >= 32) {
    previousRender = now;
    const { pads, error } = readGamepads(navigator);
    updateSelection(pads);
    const pad = isDemo ? demoPad(now) : pads.find(p => p.index === selected) ?? null;
    render(pad, now, error);
  }
  animation = requestAnimationFrame(frame);
}
ui.demo.addEventListener('click', () => { isDemo = !isDemo; listKey = ''; ui.demo.textContent = isDemo ? 'Exit demo ↗' : 'Try demo ↗'; });
ui['controller-select'].addEventListener('change', event => { selected = Number(event.target.value); });
ui.deadzone.addEventListener('input', () => {
  const value = Number(ui.deadzone.value); ui['deadzone-output'].textContent = `${value}%`;
  for (const name of ['left','right']) { $(name + '-zone').style.width = `${value}%`; $(name + '-zone').style.height = `${value}%`; }
});
ui.drift.addEventListener('click', () => {
  if (!current || current.mapping !== 'standard' || current.axes.length < 4 || sample) return;
  drift = null; sample = { start: performance.now(), left: [], right: [] };
  ui.drift.disabled = true; ui['drift-result'].textContent = 'Sampling… keep both sticks untouched and this tab visible.';
});
ui.reset.addEventListener('click', () => { clearSession(); message('Session reset. Button coverage and drift measurements cleared.', 3500); });
ui.vibrate.addEventListener('click', async () => {
  if (!hasHaptics(currentPad) || hapticBusy) return;
  const actuator = currentPad.vibrationActuator;
  hapticBusy = true; ui.vibrate.disabled = true;
  try {
    const result = await actuator.playEffect('dual-rumble', { startDelay: 0, duration: 500, weakMagnitude: .5, strongMagnitude: .5 });
    message(result === 'complete' ? 'Vibration command completed. Confirm you felt both motors respond.' : `Vibration command returned ${String(result)}. Browser and device support may vary.`, 5000);
  } catch { message('Vibration could not run. This device, connection or browser may not support dual-rumble.', 5000); }
  finally { hapticBusy = false; }
});
ui.export.addEventListener('click', () => {
  if (!current) return;
  const report = makeReport(current, seen, drift, isDemo, Number(ui.deadzone.value) / 100);
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `padlab-${isDemo ? 'demo-' : ''}${new Date().toISOString().replaceAll(':','-')}.json`;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  message('Your JSON report has been prepared for download.', 3500);
});
window.addEventListener('gamepadconnected', () => { listKey = ''; });
window.addEventListener('gamepaddisconnected', event => { if (event.gamepad.index === selected) identity = 'disconnected'; listKey = ''; });
document.addEventListener('visibilitychange', () => {
  cancelAnimationFrame(animation);
  if (document.hidden && sample) { sample = null; ui['drift-result'].textContent = 'Sample canceled because this tab was hidden. Run the test again.'; ui.drift.textContent = 'Run drift test →'; }
  if (!document.hidden) animation = requestAnimationFrame(frame);
});
populateButtons(null);
animation = requestAnimationFrame(frame);
