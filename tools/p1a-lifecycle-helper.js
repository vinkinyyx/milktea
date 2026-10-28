async page => {
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setFocusEmulationEnabled', { enabled:false });
  const state = await page.evaluate(() => ({ url:location.href, visibility:document.visibilityState, hasFocus:document.hasFocus() }));
  await session.detach();
  return { focusOverrideDisabled:true, state };
}
