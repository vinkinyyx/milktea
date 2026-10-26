#!/usr/bin/env python3
"""Copy the single source config into Cocos resources and validate it."""
import argparse
import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "config" / "design-baseline.json"
DESTINATION = ROOT / "client" / "assets" / "resources" / "config" / "design-baseline.json"


def validate(config: dict) -> None:
    viewport = config.get("viewport", {})
    if viewport.get("world_origin") != "bottom_left":
        raise ValueError("viewport.world_origin 必须是bottom_left")
    for key in ("width_du", "height_du"):
        finite(viewport.get(key), f"viewport.{key}", 1)
    finite(viewport.get("du_per_spec_physics_unit"), "viewport.du_per_spec_physics_unit", 0.0001)
    ingredients = config.get("ingredients")
    if not isinstance(ingredients, list) or len(ingredients) != 9:
        raise ValueError("ingredients 必须正好包含九级")
    ids, levels = set(), set()
    for item in ingredients:
        if not isinstance(item.get("id"), str) or not item["id"].strip() or item["id"] in ids:
            raise ValueError(f"小料 ID 缺失或重复：{item.get('id')}")
        if item.get("level") in levels or isinstance(item.get("level"), bool) or not isinstance(item.get("level"), int) or not 1 <= item["level"] <= 9:
            raise ValueError(f"小料等级缺失或重复：{item.get('level')}")
        ids.add(item["id"])
        levels.add(item["level"])
        finite(item.get("radius_du"), f"ingredients.{item['id']}.radius_du", 0.01)
        finite(item.get("merge_score"), f"ingredients.{item['id']}.merge_score", 0)
        finite(item.get("units"), f"ingredients.{item['id']}.units", 1)
    weights = config.get("drop", {}).get("spawn_levels", [])
    if not weights:
        raise ValueError("drop.spawn_levels 不能为空")
    weighted_levels = set()
    for item in weights:
        if isinstance(item.get("level"), bool) or item.get("level") not in levels:
            raise ValueError(f"出料等级不存在：{item.get('level')}")
        if item["level"] in weighted_levels:
            raise ValueError(f"出料等级重复：{item['level']}")
        weighted_levels.add(item["level"])
        finite(item.get("weight"), f"drop.spawn_levels.{item.get('level')}.weight", 0)
    total = sum(item["weight"] for item in weights)
    if not math.isclose(total, 100, abs_tol=1e-9):
        raise ValueError(f"出料权重合计必须为100，当前为{total}")
    cup = config.get("cup", {})
    for key in ("center_x_du", "inner_bottom_y_du", "inner_top_y_du", "bottom_width_du", "top_width_du", "spawn_y_du", "danger_line_y_du"):
        finite(cup.get(key), f"cup.{key}", 0)
    if cup["inner_top_y_du"] <= cup["inner_bottom_y_du"] or cup["bottom_width_du"] <= 0 or cup["top_width_du"] <= 0:
        raise ValueError("杯体尺寸必须为正且杯口高于杯底")
    if cup["spawn_y_du"] > viewport["height_du"] or cup["danger_line_y_du"] > viewport["height_du"]:
        raise ValueError("投放高度和危险线必须位于设计视口内")
    largest_radius = max(item["radius_du"] for item in ingredients)
    stage_ids = set()
    stages = config.get("stages", [])
    if not stages:
        raise ValueError("stages 不能为空")
    for stage in stages:
        stage_id = stage.get("id")
        if not stage_id or stage_id in stage_ids:
            raise ValueError(f"stage ID 缺失或重复：{stage_id}")
        stage_ids.add(stage_id)
        finite(stage.get("cup_width_scale"), f"stages.{stage_id}.cup_width_scale", 0, exclusive=True)
        scale = stage["cup_width_scale"]
        if scale > 4:
            raise ValueError(f"stages.{stage_id}.cup_width_scale 必须不大于4")
        if cup["bottom_width_du"] * scale < largest_radius * 2:
            raise ValueError(f"stages.{stage_id} 最窄杯底放不下最高级小料")
        for width in (cup["bottom_width_du"], cup["top_width_du"]):
            if cup["center_x_du"] - width * scale / 2 < 0 or cup["center_x_du"] + width * scale / 2 > viewport["width_du"]:
                raise ValueError(f"stages.{stage_id} 杯体超出设计视口")
    physics = config.get("physics", {})
    finite(physics.get("fixed_hz"), "physics.fixed_hz", 0, exclusive=True)
    if physics["fixed_hz"] != 60:
        raise ValueError("physics.fixed_hz 本阶段必须为60")
    for key in ("density_relative", "max_linear_speed", "max_angular_speed"):
        finite(physics.get(key), f"physics.{key}", 0, exclusive=True)
    for key in ("friction", "restitution", "linear_damping", "angular_damping"):
        finite(physics.get(key), f"physics.{key}", 0)
    for key in ("velocity_iterations", "position_iterations", "max_catchup_steps"):
        finite(physics.get(key), f"physics.{key}", 0, exclusive=True)
    for key in ("velocity_iterations", "position_iterations", "max_catchup_steps"):
        if not isinstance(physics[key], int):
            raise ValueError(f"physics.{key} 必须为整数")
    if not 0 <= physics["restitution"] <= 1:
        raise ValueError("physics.restitution 必须在0..1之间")
    if physics.get("shape") != "circle":
        raise ValueError("physics.shape 当前阶段必须为circle")
    if not isinstance(physics.get("sleep"), bool):
        raise ValueError("physics.sleep 必须是boolean")
    for key in ("x", "y"):
        finite(physics.get("gravity", {}).get(key), f"physics.gravity.{key}", -math.inf)
    for key, value in walk_numbers(config):
        if not math.isfinite(value):
            raise ValueError(f"{key} 必须为有限数值")


def finite(value, path: str, minimum: float, exclusive: bool = False) -> None:
    invalid_minimum = value <= minimum if exclusive and isinstance(value, (float, int)) else value < minimum if isinstance(value, (float, int)) else True
    if not isinstance(value, (float, int)) or isinstance(value, bool) or not math.isfinite(value) or invalid_minimum:
        relation = "大于" if exclusive else "不小于"
        raise ValueError(f"{path} 必须是{relation}{minimum}的有限数值")


def walk_numbers(value, path=""):
    if isinstance(value, dict):
        for key, child in value.items():
            yield from walk_numbers(child, f"{path}.{key}" if path else key)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from walk_numbers(child, f"{path}[{index}]")
    elif isinstance(value, (float, int)) and not isinstance(value, bool):
        yield path, value


def main() -> int:
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--sync", action="store_true", help="validate and copy exact source bytes")
    group.add_argument("--check", action="store_true", help="validate and verify byte-identical copy")
    args = parser.parse_args()
    raw = SOURCE.read_bytes()
    config = json.loads(raw)
    validate(config)
    if args.sync:
        DESTINATION.parent.mkdir(parents=True, exist_ok=True)
        DESTINATION.write_bytes(raw)
    if not DESTINATION.exists() or SOURCE.read_bytes() != DESTINATION.read_bytes():
        raise SystemExit("配置副本不存在或与根配置不同步；请运行 python tools/sync_design_config.py --sync")
    digest = hashlib.sha256(raw).hexdigest()
    print(f"配置有效，SHA-256={digest}，根配置与Cocos资源逐字节一致")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
