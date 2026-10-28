async page => {
  return await page.evaluate(() => {
  const lab = cc.director.getScene().getChildByName('PhysicsLabRoot').getComponent('PhysicsLab');
  const probe = window.__p1aProbe.export();
  const frames = probe.frames;
  const count = predicate => frames.filter(predicate).length;
  const quantiles = key => {
    const values = frames.map(frame => frame[key]).filter(Number.isFinite).sort((a, b) => a - b);
    const at = q => values.length ? values[Math.min(values.length - 1, Math.floor(q * values.length))] : null;
    return { count: values.length, p50: at(0.50), p95: at(0.95), p99: at(0.99), max: at(1) };
  };
  return { metadata: probe.metadata, coverage: probe.coverage, tick: lab.clock.tick, stepCount: lab.adapter.stepCount,
    paused: lab.clock.paused, message: lab.message, entities: lab.adapter.entityCount,
    visibleFrames: count(frame => frame.visible === 1), hiddenFrames: count(frame => frame.visible === 0),
    focusFrames: count(frame => frame.hasFocus === 1), unfocusedFrames: count(frame => frame.hasFocus === 0),
    wallGapOver250ms: count(frame => frame.wallGapMs > 250), wallGapOver500ms: count(frame => frame.wallGapMs > 500),
    engineDtOver250ms: count(frame => frame.engineDtMs > 250), frames: Object.fromEntries(['wallGapMs','engineDtMs','steps','adapterMs','viewMs','frameWorkMs','probeMs'].map(key => [key, quantiles(key)])),
    firstFrames: frames.slice(0, 3), lastFrames: frames.slice(-5) };
  });
}
