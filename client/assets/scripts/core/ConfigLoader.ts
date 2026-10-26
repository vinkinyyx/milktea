import { Result, StageId, Level } from '../contracts/types';

export interface RulesConfig {
  design_rules_version: string;
  viewport: { width_du: number; height_du: number; world_origin: string; du_per_spec_physics_unit: number };
  physics: {
    fixed_hz: number; gravity: { x: number; y: number }; density_relative: number;
    friction: number; restitution: number; linear_damping: number; angular_damping: number;
    max_linear_speed: number; max_angular_speed: number; velocity_iterations: number;
    position_iterations: number; max_catchup_steps: number; shape: string; sleep: boolean;
  };
  cup: { center_x_du: number; inner_bottom_y_du: number; inner_top_y_du: number; bottom_width_du: number; top_width_du: number; spawn_y_du: number; danger_line_y_du: number };
  drop: { spawn_levels: Array<{ level: number; weight: number }> };
  ingredients: Array<{ level: number; id: string; name: string; radius_du: number; merge_score: number; units: number }>;
  stages: Array<{ id: StageId; cup_width_scale: number }>;
}

export class ConfigLoader {
  static validate(raw: unknown): Result<Readonly<RulesConfig>> {
    try {
      if (!raw || typeof raw !== 'object') throw new Error('根配置必须是对象');
      const c = raw as RulesConfig;
      const finite = (value: number, path: string, min = -Infinity, max = Infinity) => {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`${path} 必须是 ${min}..${max} 范围内的有限数值`);
      };
      const required = (value: unknown, path: string) => { if (value === undefined || value === null) throw new Error(`缺少配置项 ${path}`); };
      required(c.design_rules_version, 'design_rules_version');
      for (const key of ['viewport', 'physics', 'cup', 'drop', 'ingredients', 'stages'] as const) required((c as any)[key], key);
      if (!c.physics.gravity || !c.drop || !Array.isArray(c.stages)) throw new Error('physics.gravity、drop、stages结构无效');
      if (c.viewport?.world_origin !== 'bottom_left') throw new Error('viewport.world_origin 必须为 bottom_left');
      finite(c.viewport.width_du, 'viewport.width_du', 1); finite(c.viewport.height_du, 'viewport.height_du', 1);
      finite(c.viewport.du_per_spec_physics_unit, 'viewport.du_per_spec_physics_unit', 0.0001);
      finite(c.physics.fixed_hz, 'physics.fixed_hz', 60, 60);
      for (const [path, n] of Object.entries({
        'physics.gravity.x': c.physics.gravity.x, 'physics.gravity.y': c.physics.gravity.y,
        'physics.density_relative': c.physics.density_relative, 'physics.friction': c.physics.friction,
        'physics.restitution': c.physics.restitution, 'physics.linear_damping': c.physics.linear_damping,
        'physics.angular_damping': c.physics.angular_damping, 'physics.max_linear_speed': c.physics.max_linear_speed,
        'physics.max_angular_speed': c.physics.max_angular_speed, 'physics.velocity_iterations': c.physics.velocity_iterations,
        'physics.position_iterations': c.physics.position_iterations, 'physics.max_catchup_steps': c.physics.max_catchup_steps,
      })) finite(n, path, path.endsWith('gravity.x') || path.endsWith('gravity.y') ? -Infinity : 0);
      if (c.physics.density_relative <= 0) throw new Error('physics.density_relative 必须大于0');
      if (c.physics.max_linear_speed <= 0 || c.physics.max_angular_speed <= 0) throw new Error('physics速度上限必须大于0');
      if (c.physics.restitution > 1) throw new Error('physics.restitution 必须在0..1之间');
      for (const key of ['velocity_iterations', 'position_iterations', 'max_catchup_steps'] as const) {
        if (!Number.isInteger(c.physics[key]) || c.physics[key] < 1) throw new Error(`physics.${key} 必须是正整数`);
      }
      if (c.physics.shape !== 'circle') throw new Error('physics.shape 当前阶段必须为 circle');
      if (!Array.isArray(c.ingredients) || c.ingredients.length !== 9) throw new Error('ingredients 必须正好包含九级');
      const ids = new Set<string>(); const levels = new Set<number>();
      for (const i of c.ingredients) {
        if (!i || typeof i.id !== 'string' || !i.id.trim() || ids.has(i.id)) throw new Error(`小料 ID 缺失或重复: ${i?.id}`);
        if (!Number.isInteger(i.level) || i.level < 1 || i.level > 9 || levels.has(i.level)) throw new Error(`小料等级缺失或重复: ${i.level}`);
        ids.add(i.id); levels.add(i.level); finite(i.radius_du, `ingredients.${i.id}.radius_du`, 0.01);
        finite(i.merge_score, `ingredients.${i.id}.merge_score`, 0); finite(i.units, `ingredients.${i.id}.units`, 1);
      }
      if (!Array.isArray(c.drop.spawn_levels) || c.drop.spawn_levels.length === 0) throw new Error('drop.spawn_levels 不能为空');
      let totalWeight = 0; const weightedLevels = new Set<number>();
      for (const item of c.drop.spawn_levels) {
        if (!levels.has(item.level)) throw new Error(`出料等级 ${item.level} 不存在`);
        if (weightedLevels.has(item.level)) throw new Error(`出料等级重复: ${item.level}`);
        weightedLevels.add(item.level);
        finite(item.weight, `drop.spawn_levels.${item.level}.weight`, 0); totalWeight += item.weight;
      }
      if (Math.abs(totalWeight - 100) > 1e-9) throw new Error(`出料权重合计必须为100，当前为 ${totalWeight}`);
      for (const [path, n] of Object.entries({ 'cup.center_x_du': c.cup.center_x_du, 'cup.inner_bottom_y_du': c.cup.inner_bottom_y_du,
        'cup.inner_top_y_du': c.cup.inner_top_y_du, 'cup.bottom_width_du': c.cup.bottom_width_du,
        'cup.top_width_du': c.cup.top_width_du, 'cup.spawn_y_du': c.cup.spawn_y_du, 'cup.danger_line_y_du': c.cup.danger_line_y_du })) finite(n, path, 0);
      if (c.cup.inner_top_y_du <= c.cup.inner_bottom_y_du || c.cup.bottom_width_du <= 0 || c.cup.top_width_du <= 0) throw new Error('杯体高度和宽度必须为正且高度递增');
      if (c.cup.spawn_y_du > c.viewport.height_du || c.cup.danger_line_y_du > c.viewport.height_du) throw new Error('投放高度和危险线必须位于设计视口内');
      if (!Array.isArray(c.stages) || c.stages.length < 1) throw new Error('stages 不能为空');
      const stageIds = new Set<string>(); const largestRadius = Math.max(...c.ingredients.map(i => i.radius_du));
      for (const s of c.stages) {
        if (!s.id || stageIds.has(s.id)) throw new Error(`stage ID缺失或重复: ${s.id}`);
        stageIds.add(s.id); finite(s.cup_width_scale, `stages.${s.id}.cup_width_scale`, 0.01, 4);
        if (c.cup.bottom_width_du * s.cup_width_scale < largestRadius * 2) throw new Error(`stages.${s.id} 最窄杯底放不下最高级小料`);
        for (const width of [c.cup.bottom_width_du, c.cup.top_width_du]) {
          if (c.cup.center_x_du - width * s.cup_width_scale / 2 < 0 || c.cup.center_x_du + width * s.cup_width_scale / 2 > c.viewport.width_du) {
            throw new Error(`stages.${s.id} 杯体宽度超出设计视口`);
          }
        }
      }
      return { ok: true, data: Object.freeze(c) };
    } catch (error) {
      return { ok: false, error: { code: 'CONFIG_INVALID', message: error instanceof Error ? error.message : String(error), retryable: true } };
    }
  }
}
