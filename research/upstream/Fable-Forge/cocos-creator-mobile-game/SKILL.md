---
name: cocos-creator-mobile-game
description: Use when working on Cocos Creator 3.x TypeScript mobile game projects or Cocos-targeted mobile narrative prototypes, including scene scripts, JSON/config data, ads and revive flows, countdowns, UI states, Cocos assets, WeChat mini-games, or Android release targets.
---

# Cocos Creator Mobile Game

## Overview

Use this skill for practical Cocos Creator 3.x + TypeScript work, especially mobile-first games. Keep changes small, inspect the existing scene/script structure first, and finish with verification instructions the user can run in Cocos Creator.

For project-specific patterns, read `references/cocos-workflow.md` when the task involves feature implementation, bug fixes, ads/revive flows, countdowns, Cocos scene wiring, or documentation updates.

## Workflow

1. Identify the project type and target platform.
   - Confirm whether the work is Cocos Creator 3.x, TypeScript, WeChat mini-game, Android, or prototype-only.
   - Find `assets/`, `settings/`, `package.json`, `tsconfig.json`, scene files, and nearby docs before editing.

2. Trace the existing implementation.
   - Search for the relevant component, scene node, event, config table, prefab, and manager class.
   - Prefer existing managers, event buses, constants, decorators, and UI binding patterns.
   - Do not assume Cocos editor node bindings from code alone; note when the user must bind or inspect nodes in the editor.

3. Make the narrowest code change.
   - Touch only the scripts, configs, and docs required for the requested feature.
   - Avoid broad refactors, speculative abstractions, or unrelated formatting.
   - Preserve existing Cocos lifecycle methods and naming style.

4. Update user-facing project notes when the change is a feature.
   - If a local feature-change document exists, append a concise dated entry.
   - If the user asks for one and none exists, create a single focused doc such as `docs/FEATURE_CHANGES.md`.

5. Verify with the best available checks.
   - Run TypeScript or project checks if available, such as `npm run typecheck`, `npm run build`, or repo-specific scripts.
   - Run `git diff --check` when editing text files.
   - If Cocos Creator is needed for final validation, provide exact scene and button steps for the user to test.

## Common Tasks

### Add or fix a gameplay feature

Start by locating state ownership: game manager, UI controller, level config, event dispatch, and restart/resume paths. Write down the success condition before editing, for example: "after rewarded ad revive, the remaining timer is exactly 30 seconds."

### Fix countdown, revive, ad, or state bugs

Check for duplicate timers, stale tweens, repeated event listeners, and ordering issues between state mutation and event dispatch. Cancel or stop old tweens before starting a replacement. When fixing revive logic, distinguish between:

- configured level duration
- current remaining time
- revive bonus duration
- UI animation countdown

### Implement from a design or prototype

Translate the prototype into Cocos scenes, nodes, components, and data. If the source is Figma or an image, treat it as visual guidance, then implement with Cocos UI primitives and existing project assets. Avoid turning a game screen into a generic web-app layout.

### Explain how to run

If the project is not a normal web app, do not suggest `npm run dev` unless the repo defines it. Prefer Cocos Creator instructions:

- open the project folder in Cocos Creator
- open the relevant `.scene`
- click Preview/Run
- test the exact interaction path

## Output Expectations

End with:

- changed files and what changed
- verification commands actually run, or why they were not run
- Cocos Creator manual test steps when editor validation is needed
- any editor-side binding or asset import that still needs user action
