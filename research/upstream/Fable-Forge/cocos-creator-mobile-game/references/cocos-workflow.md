# Cocos Creator Workflow Reference

## Inspect

- Locate `assets/`, `settings/`, `package.json`, `tsconfig.json`, and docs.
- Search for the visible feature text, node name, component class, manager, event name, and config key.
- In Cocos Creator projects, `.scene`, `.prefab`, and `.meta` files may contain editor wiring. Avoid hand-editing them unless the local project already does so safely.

## Implement

- Keep game state changes in the existing owner class.
- Keep UI-only display logic in the existing UI component.
- Reuse existing event names and dispatch style.
- Stop old tweens/timers before starting new countdowns.
- When adding revive/ad behavior, keep ad callback, state restoration, timer value, and UI feedback separate.

## Verify

Use available repo scripts first. Common checks:

```powershell
npm run typecheck
npm run build
git diff --check
```

If there are no scripts, at least inspect diffs and give Cocos Creator manual steps:

1. Open the project folder in Cocos Creator.
2. Open the affected scene.
3. Preview on the target device mode if available.
4. Trigger the changed flow twice, including restart/resume paths.

## Feature Notes

For feature documentation, prefer one concise dated entry:

```markdown
## 2026-05-27 Feature Name

- Goal: what the player-facing change does.
- Files: key scripts/configs touched.
- Behavior: success and edge cases.
- Verification: command or manual Cocos test.
```
