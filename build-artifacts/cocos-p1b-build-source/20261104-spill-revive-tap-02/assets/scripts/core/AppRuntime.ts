import { HostLifecycleCoordinator } from './HostLifecycleCoordinator';
import { RulesConfig } from './ConfigLoader';
import { CoordinateMapper } from '../physics/CoordinateMapper';

/** Runtime state shared by boot, diagnostics scenes, and the player scene. */
export class AppRuntime {
  static readonly buildId = '20261104-spill-revive-tap-02';
  static readonly configRulesHash = 'c4c93c79d0b1d1bfd0eb65ade281e3f7ef29ea95124c54a60bdcafde5d716d02';
  static rules: Readonly<RulesConfig> | null = null;
  static mapper: CoordinateMapper | null = null;
  static loadError: string | null = null;
  static startupInProgress = false;
  static startupToken = 0;
  static startupSequence = 0;
  static get backgrounded(): boolean { return HostLifecycleCoordinator.backgrounded; }
}



