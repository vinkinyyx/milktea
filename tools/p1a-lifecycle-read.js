async page => page.evaluate(() => ({ visibility:document.visibilityState, hasFocus:document.hasFocus(),
  capture:window.__p1aHostCapture ?? [], lifecycle:window.__p1aLifecycle?.snapshot?.() ?? null,
  status:window.__p1aLab?.status?.() ?? null }))
