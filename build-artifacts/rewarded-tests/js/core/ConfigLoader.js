"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigLoader = void 0;
class ConfigLoader {
    static validate(raw) {
        var _a;
        try {
            if (!raw || typeof raw !== 'object')
                throw new Error('根配置必须是对象');
            const c = raw;
            const finite = (value, path, min = -Infinity, max = Infinity) => {
                if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
                    throw new Error(`${path} 必须是 ${min}..${max} 范围内的有限数值`);
            };
            const required = (value, path) => { if (value === undefined || value === null)
                throw new Error(`缺少配置项 ${path}`); };
            required(c.design_rules_version, 'design_rules_version');
            for (const key of ['viewport', 'physics', 'cup', 'cup_motion', 'shake', 'auto_drop', 'spawn_jitter', 'drop', 'ingredients', 'stages'])
                required(c[key], key);
            if (!c.physics.gravity || !c.drop || !Array.isArray(c.stages))
                throw new Error('physics.gravity、drop、stages结构无效');
            if (((_a = c.viewport) === null || _a === void 0 ? void 0 : _a.world_origin) !== 'bottom_left')
                throw new Error('viewport.world_origin 必须为 bottom_left');
            finite(c.viewport.width_du, 'viewport.width_du', 1);
            finite(c.viewport.height_du, 'viewport.height_du', 1);
            finite(c.viewport.du_per_spec_physics_unit, 'viewport.du_per_spec_physics_unit', 0.0001);
            finite(c.physics.fixed_hz, 'physics.fixed_hz', 60, 60);
            for (const [path, n] of Object.entries({
                'physics.gravity.x': c.physics.gravity.x, 'physics.gravity.y': c.physics.gravity.y,
                'physics.density_relative': c.physics.density_relative, 'physics.friction': c.physics.friction,
                'physics.restitution': c.physics.restitution, 'physics.linear_damping': c.physics.linear_damping,
                'physics.angular_damping': c.physics.angular_damping, 'physics.max_linear_speed': c.physics.max_linear_speed,
                'physics.max_angular_speed': c.physics.max_angular_speed, 'physics.velocity_iterations': c.physics.velocity_iterations,
                'physics.position_iterations': c.physics.position_iterations, 'physics.max_catchup_steps': c.physics.max_catchup_steps,
            }))
                finite(n, path, path.endsWith('gravity.x') || path.endsWith('gravity.y') ? -Infinity : 0);
            if (c.physics.density_relative <= 0)
                throw new Error('physics.density_relative 必须大于0');
            if (c.physics.max_linear_speed <= 0 || c.physics.max_angular_speed <= 0)
                throw new Error('physics速度上限必须大于0');
            if (c.physics.restitution > 1)
                throw new Error('physics.restitution 必须在0..1之间');
            for (const key of ['velocity_iterations', 'position_iterations', 'max_catchup_steps']) {
                if (!Number.isInteger(c.physics[key]) || c.physics[key] < 1)
                    throw new Error(`physics.${key} 必须是正整数`);
            }
            if (c.physics.shape !== 'circle')
                throw new Error('physics.shape 当前阶段必须为 circle');
            if (!Array.isArray(c.ingredients) || c.ingredients.length !== 9)
                throw new Error('ingredients 必须正好包含九级');
            const ids = new Set();
            const levels = new Set();
            for (const i of c.ingredients) {
                if (!i || typeof i.id !== 'string' || !i.id.trim() || ids.has(i.id))
                    throw new Error(`小料 ID 缺失或重复: ${i === null || i === void 0 ? void 0 : i.id}`);
                if (!Number.isInteger(i.level) || i.level < 1 || i.level > 9 || levels.has(i.level))
                    throw new Error(`小料等级缺失或重复: ${i.level}`);
                ids.add(i.id);
                levels.add(i.level);
                finite(i.radius_du, `ingredients.${i.id}.radius_du`, 0.01);
                finite(i.merge_score, `ingredients.${i.id}.merge_score`, 0);
                finite(i.units, `ingredients.${i.id}.units`, 1);
            }
            if (!Array.isArray(c.drop.spawn_levels) || c.drop.spawn_levels.length === 0)
                throw new Error('drop.spawn_levels 不能为空');
            let totalWeight = 0;
            const weightedLevels = new Set();
            for (const item of c.drop.spawn_levels) {
                if (!levels.has(item.level))
                    throw new Error(`出料等级 ${item.level} 不存在`);
                if (weightedLevels.has(item.level))
                    throw new Error(`出料等级重复: ${item.level}`);
                weightedLevels.add(item.level);
                finite(item.weight, `drop.spawn_levels.${item.level}.weight`, 0);
                totalWeight += item.weight;
            }
            if (Math.abs(totalWeight - 100) > 1e-9)
                throw new Error(`出料权重合计必须为100，当前为 ${totalWeight}`);
            for (const [path, n] of Object.entries({ 'cup.center_x_du': c.cup.center_x_du, 'cup.inner_bottom_y_du': c.cup.inner_bottom_y_du,
                'cup.inner_top_y_du': c.cup.inner_top_y_du, 'cup.bottom_width_du': c.cup.bottom_width_du,
                'cup.top_width_du': c.cup.top_width_du, 'cup.spawn_y_du': c.cup.spawn_y_du, 'cup.danger_line_y_du': c.cup.danger_line_y_du }))
                finite(n, path, 0);
            if (c.cup.inner_top_y_du <= c.cup.inner_bottom_y_du || c.cup.bottom_width_du <= 0 || c.cup.top_width_du <= 0)
                throw new Error('杯体高度和宽度必须为正且高度递增');
            if (c.cup.spawn_y_du > c.viewport.height_du || c.cup.danger_line_y_du > c.viewport.height_du)
                throw new Error('投放高度和危险线必须位于设计视口内');
            for (const [key, value] of Object.entries(c.cup_motion))
                finite(value, `cup_motion.${key}`, key === 'input_gain' ? 0 : 0);
            if (c.cup_motion.max_offset_du <= 0 || c.cup_motion.max_speed_du_per_second <= 0 || c.cup_motion.acceleration_du_per_second2 <= 0)
                throw new Error('cup_motion参数必须大于0');
            for (const key of ['duration_seconds', 'cooldown_seconds', 'acceleration_amplitude', 'frequency_hz', 'visual_offset_max_du'])
                finite(c.shake[key], `shake.${key}`, 0);
            if (typeof c.shake.guaranteed_merge !== 'boolean')
                throw new Error('shake.guaranteed_merge必须是boolean');
            if (c.shake.duration_seconds <= 0 || c.shake.frequency_hz <= 0 || c.shake.visual_offset_max_du > 6)
                throw new Error('shake参数超出已验证边界');
            for (const [key, value] of Object.entries(c.auto_drop)) {
                finite(value, `auto_drop.${key}`, 1);
                if (!Number.isSafeInteger(value))
                    throw new Error(`auto_drop.${key}必须是安全整数`);
            }
            for (const key of ['x_offsets_du', 'vx_du_per_second']) {
                const values = c.spawn_jitter[key];
                if (!Array.isArray(values) || values.length < 2 || values.some(v => !Number.isFinite(v)))
                    throw new Error(`spawn_jitter.${key}无效`);
            }
            if (!Array.isArray(c.stages) || c.stages.length < 1)
                throw new Error('stages 不能为空');
            const stageIds = new Set();
            const largestRadius = Math.max(...c.ingredients.map(i => i.radius_du));
            for (const s of c.stages) {
                if (!s.id || stageIds.has(s.id))
                    throw new Error(`stage ID缺失或重复: ${s.id}`);
                stageIds.add(s.id);
                finite(s.cup_width_scale, `stages.${s.id}.cup_width_scale`, 0.01, 4);
                if (s.id === 'classic' && c.cup.bottom_width_du * s.cup_width_scale < largestRadius * 2)
                    throw new Error(`stages.${s.id} 杯底放不下最高级小料`);
                for (const width of [c.cup.bottom_width_du, c.cup.top_width_du]) {
                    if (c.cup.center_x_du - width * s.cup_width_scale / 2 < 0 || c.cup.center_x_du + width * s.cup_width_scale / 2 > c.viewport.width_du) {
                        throw new Error(`stages.${s.id} 杯体宽度超出设计视口`);
                    }
                }
            }
            return { ok: true, data: Object.freeze(c) };
        }
        catch (error) {
            return { ok: false, error: { code: 'CONFIG_INVALID', message: error instanceof Error ? error.message : String(error), retryable: true } };
        }
    }
}
exports.ConfigLoader = ConfigLoader;
