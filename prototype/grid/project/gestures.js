/* ===================================================================
   GESTURES — Rhino's mouse, plus touch. PROTOTYPE (prototype/grid/project).

   Turns pointer and wheel input on one element into intents; the sheet
   decides what each intent means (a flat sheet treats orbit as pan).

     right-drag            orbit(dx, dy)
     shift + right-drag    pan(dx, dy)
     ctrl + right-drag     zoom(factor, x, y)   (vertical drag, about the press point)
     middle-drag           pan(dx, dy)
     left-drag             pan(dx, dy)          (trackpads have no right-drag)
     left-click / tap      pick(x, y)           (no movement past SLOP)
     wheel / trackpad pinch zoom(factor, x, y)  (to the cursor)
     touch, one finger     pan
     touch, two fingers    orbit (centroid motion), roll (twist), zoom (pinch)
     mouse move, no button hover(x, y), leave()

   x, y are css px relative to the element. The context menu is suppressed
   over the element. Presses that start on a button or link are left to
   that control's own click.
   =================================================================== */

const SLOP = 5;                     /* px of travel before a press becomes a drag */
const WHEEL_K = 0.0015;             /* zoom per wheel pixel */
const PINCH_WHEEL_K = 0.01;         /* trackpad pinch arrives as ctrl+wheel with small deltas */
const CTRL_DRAG_K = 0.006;          /* zoom per px of ctrl+right-drag */

export function attachGestures(el, h) {
  if (!el) throw new Error('gestures: element missing');
  const need = ['orbit', 'pan', 'zoom', 'roll', 'pick', 'hover', 'leave', 'begin'];
  for (const k of need) if (typeof h[k] !== 'function') throw new Error(`gestures: handler "${k}" missing`);

  const pointers = new Map();       /* pointerId -> { x, y, type } */
  let mouse = null;                 /* { id, button, x0, y0, x, y, dragging, onControl } */
  let touch = null;                 /* { cx, cy, dist, angle, moved, x0, y0, tapId } */

  const local = (e) => {
    const r = el.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const onControl = (e) => !!(e.target && e.target.closest && e.target.closest('button, a, input, select, textarea'));

  function touchFrame() {
    const pts = [...pointers.values()];
    if (pts.length < 2) {
      const p = pts[0];
      return { cx: p.x, cy: p.y, dist: 0, angle: 0 };
    }
    const [a, b] = pts;
    return {
      cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2,
      dist: Math.hypot(b.x - a.x, b.y - a.y),
      angle: Math.atan2(b.y - a.y, b.x - a.x),
    };
  }

  function onDown(e) {
    const [x, y] = local(e);
    if (e.pointerType === 'mouse') {
      if (mouse) return;                                    /* chorded buttons: keep the first */
      mouse = { id: e.pointerId, button: e.button, x0: x, y0: y, x, y, dragging: false, onControl: onControl(e) };
      if (mouse.onControl && e.button === 0) { mouse = null; return; }
      if (e.button === 1 || e.button === 2) e.preventDefault();   /* no autoscroll, no menu */
      try { el.setPointerCapture(e.pointerId); } catch { /* capture is a nicety */ }
      return;
    }
    /* touch and pen */
    if (pointers.size >= 2) return;                         /* a third finger is ignored */
    pointers.set(e.pointerId, { x, y });
    try { el.setPointerCapture(e.pointerId); } catch { /* as above */ }
    const f = touchFrame();
    if (pointers.size === 1) {
      touch = { ...f, moved: false, x0: x, y0: y, tapId: e.pointerId, tapOk: !onControl(e) };
    } else {
      touch = { ...f, moved: true, x0: f.cx, y0: f.cy, tapId: null, tapOk: false };
    }
    h.begin();
  }

  function onMove(e) {
    const [x, y] = local(e);
    if (e.pointerType === 'mouse') {
      if (!mouse || e.pointerId !== mouse.id) {
        /* over a title or bubble, that control owns the highlight */
        if (e.buttons === 0 && !onControl(e)) h.hover(x, y);
        return;
      }
      const dx = x - mouse.x, dy = y - mouse.y;
      if (!mouse.dragging && Math.hypot(x - mouse.x0, y - mouse.y0) > SLOP) {
        mouse.dragging = true;
        h.begin();
      }
      mouse.x = x; mouse.y = y;
      if (!mouse.dragging) return;
      if (mouse.button === 2) {
        if (e.shiftKey) h.pan(dx, dy);
        else if (e.ctrlKey || e.metaKey) h.zoom(Math.exp(-dy * CTRL_DRAG_K), mouse.x0, mouse.y0);
        else h.orbit(dx, dy);
      } else {
        h.pan(dx, dy);                                      /* left or middle */
      }
      return;
    }
    if (!pointers.has(e.pointerId) || !touch) return;
    pointers.get(e.pointerId).x = x;
    pointers.get(e.pointerId).y = y;
    const f = touchFrame();
    if (pointers.size === 1) {
      if (!touch.moved && Math.hypot(x - touch.x0, y - touch.y0) > SLOP) touch.moved = true;
      if (touch.moved) h.pan(f.cx - touch.cx, f.cy - touch.cy);
    } else {
      h.orbit(f.cx - touch.cx, f.cy - touch.cy);
      if (touch.dist > 0 && f.dist > 0) h.zoom(f.dist / touch.dist, f.cx, f.cy);
      let da = f.angle - touch.angle;
      if (da > Math.PI) da -= 2 * Math.PI;
      if (da < -Math.PI) da += 2 * Math.PI;
      if (Math.abs(da) > 1e-4) h.roll(da, f.cx, f.cy);
    }
    Object.assign(touch, { cx: f.cx, cy: f.cy, dist: f.dist, angle: f.angle });
  }

  function onUp(e) {
    const [x, y] = local(e);
    if (e.pointerType === 'mouse') {
      if (!mouse || e.pointerId !== mouse.id) return;
      const m = mouse;
      mouse = null;
      try { el.releasePointerCapture(e.pointerId); } catch { /* already released */ }
      if (e.type === 'pointerup' && !m.dragging && m.button === 0 && !m.onControl) h.pick(x, y);
      return;
    }
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    try { el.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    if (!touch) return;
    if (e.type === 'pointerup' && pointers.size === 0 && !touch.moved && touch.tapOk && touch.tapId === e.pointerId) {
      h.pick(x, y);
    }
    if (pointers.size === 0) { touch = null; return; }
    /* two fingers became one: rebase so the remaining finger does not jump */
    const f = touchFrame();
    touch = { ...f, moved: true, x0: f.cx, y0: f.cy, tapId: null, tapOk: false };
  }

  function onWheel(e) {
    e.preventDefault();
    const [x, y] = local(e);
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1;
    const dy = e.deltaY * unit;
    const k = e.ctrlKey ? PINCH_WHEEL_K : WHEEL_K;
    h.begin();
    h.zoom(Math.exp(-dy * k), x, y);
  }

  const onContext = (e) => e.preventDefault();
  const onLeave = (e) => { if (e.pointerType === 'mouse' && !mouse) h.leave(); };

  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
  el.addEventListener('pointerleave', onLeave);
  el.addEventListener('wheel', onWheel, { passive: false });
  el.addEventListener('contextmenu', onContext);

  return function detach() {
    el.removeEventListener('pointerdown', onDown);
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerup', onUp);
    el.removeEventListener('pointercancel', onUp);
    el.removeEventListener('pointerleave', onLeave);
    el.removeEventListener('wheel', onWheel);
    el.removeEventListener('contextmenu', onContext);
  };
}
