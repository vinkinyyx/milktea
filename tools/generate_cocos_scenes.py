#!/usr/bin/env python3
"""Create minimal Cocos Creator 3.8 serialized scene assets for P1-A."""
import json
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "client" / "assets"
NAMESPACE = uuid.UUID("ceac51b4-a45c-4290-bce6-6642f74e6fe2")


def guid(name: str) -> str:
    return str(uuid.uuid5(NAMESPACE, name))


def vec3(x=0, y=0, z=0):
    return {"__type__": "cc.Vec3", "x": x, "y": y, "z": z}


def node(name, parent, children, components, position=(0, 0, 0)):
    x, y, z = position
    return {"__type__": "cc.Node", "_name": name, "_objFlags": 0, "_parent": {"__id__": parent},
            "_children": [{"__id__": i} for i in children], "_active": True,
            "_components": [{"__id__": i} for i in components], "_prefab": None,
            "_lpos": vec3(x, y, z), "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
            "_lscale": vec3(1, 1, 1), "_layer": 1073741824, "_euler": vec3(), "_id": guid(f"node:{name}")}


def custom_component(node_id: int, script_uuid: str):
    return {"__type__": script_uuid, "_name": "", "_objFlags": 0, "node": {"__id__": node_id},
            "_enabled": True, "__prefab": None}


def camera_component(node_id: int):
    return {"__type__": "cc.Camera", "_name": "", "_objFlags": 0, "node": {"__id__": node_id},
            "_enabled": True, "__prefab": None, "_projection": 1, "_priority": 0, "_fov": 45,
            "_fovAxis": 0, "_orthoHeight": 667, "_near": 1, "_far": 2000,
            "_color": {"__type__": "cc.Color", "r": 25, "g": 23, "b": 20, "a": 255},
            "_depth": 1, "_stencil": 0, "_clearFlags": 7,
            "_rect": {"__type__": "cc.Rect", "x": 0, "y": 0, "width": 1, "height": 1},
            "_aperture": 19, "_shutter": 7, "_iso": 0, "_screenScale": 1,
            "_visibility": 1822425087, "_targetTexture": None, "_id": guid("component:camera")}


def make_scene(scene_name: str, root_name: str, component_name: str):
    script_meta = ASSETS / "scripts" / ("bootstrap" if component_name == "AppRoot" else "debug") / (component_name + ".ts.meta")
    script_uuid = json.loads(script_meta.read_text(encoding="utf-8"))["uuid"]
    # Scene file object table uses __id__ indexes. Component refs point only to their node/script UUID.
    data = [
        {"__type__": "cc.SceneAsset", "_name": scene_name, "_objFlags": 0, "_native": "", "scene": {"__id__": 1}, "asyncLoadAssets": False},
        {"__type__": "cc.Scene", "_name": scene_name, "_objFlags": 0, "_parent": None,
         "_children": [{"__id__": 2}, {"__id__": 4}], "_active": True, "_components": [], "_prefab": None,
         "autoReleaseAssets": False, "_globals": {"__id__": 6}, "_id": guid(f"scene:{scene_name}")},
        node(root_name, 1, [], [3]),
        custom_component(2, script_uuid),
        node("Main Camera", 1, [], [5], (0, 0, 1000)),
        camera_component(4),
        {"__type__": "cc.SceneGlobals", "ambient": {"__id__": 7}, "shadows": {"__id__": 8}, "_skybox": {"__id__": 9}, "fog": {"__id__": 10}},
        {"__type__": "cc.AmbientInfo", "_skyColor": {"__type__": "cc.Color", "r": 51, "g": 128, "b": 204, "a": 1}, "_skyIllum": 20000, "_groundAlbedo": {"__type__": "cc.Color", "r": 51, "g": 51, "b": 51, "a": 255}},
        {"__type__": "cc.ShadowsInfo", "_type": 0, "_enabled": False, "_normal": vec3(0, 1, 0), "_distance": 0,
         "_shadowColor": {"__type__": "cc.Color", "r": 76, "g": 76, "b": 76, "a": 255}, "_autoAdapt": True, "_pcf": 0, "_bias": 0.00001,
         "_near": 1, "_far": 30, "_aspect": 1, "_orthoSize": 5, "_maxReceived": 4, "_size": {"__type__": "cc.Vec2", "x": 512, "y": 512}},
        {"__type__": "cc.SkyboxInfo", "_envmap": None, "_isRGBE": False, "_enabled": False, "_useIBL": False},
        {"__type__": "cc.FogInfo", "_type": 0, "_fogColor": {"__type__": "cc.Color", "r": 200, "g": 200, "b": 200, "a": 255},
         "_enabled": False, "_fogDensity": 0.3, "_fogStart": 0.5, "_fogEnd": 300, "_fogAtten": 5, "_fogTop": 1.5, "_fogRange": 1.2},
    ]
    return data


def write_meta(path: Path, importer: str) -> str:
    identifier = guid(path.relative_to(ASSETS).as_posix())
    meta = {"ver": "1.1.0", "importer": importer, "imported": True, "uuid": identifier,
            "files": [], "subMetas": {}, "userData": {}}
    path.with_name(path.name + ".meta").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return identifier


def main():
    for folder in (ASSETS / "scripts" / "bootstrap", ASSETS / "scripts" / "debug", ASSETS / "scripts" / "core", ASSETS / "scripts" / "physics", ASSETS / "resources", ASSETS / "resources" / "config", ASSETS / "scenes"):
        folder.mkdir(parents=True, exist_ok=True)
    for source in ASSETS.rglob("*.ts"):
        if not source.with_name(source.name + ".meta").exists(): write_meta(source, "typescript")
    for source in ASSETS.rglob("*.json"):
        if not source.with_name(source.name + ".meta").exists(): write_meta(source, "json")
    for folder in [ASSETS, *[item for item in ASSETS.rglob("*") if item.is_dir()]]:
        if not folder.with_name(folder.name + ".meta").exists(): write_meta(folder, "directory")
    app_uuid = json.loads((ASSETS / "scripts/bootstrap/AppRoot.ts.meta").read_text(encoding="utf-8"))["uuid"]
    lab_uuid = json.loads((ASSETS / "scripts/debug/PhysicsLab.ts.meta").read_text(encoding="utf-8"))["uuid"]
    for name, root, script_uuid in (("Boot", "BootRoot", app_uuid), ("PhysicsLab", "PhysicsLabRoot", lab_uuid)):
        output = ASSETS / "scenes" / f"{name}.scene"
        # Preserve intentional editor adjustments after first generation.
        if not output.exists(): output.write_text(json.dumps(make_scene(name, root, "AppRoot" if name == "Boot" else "PhysicsLab"), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        if not output.with_name(output.name + ".meta").exists(): write_meta(output, "scene")
    print("Cocos scene JSON and deterministic asset metadata generated")


if __name__ == "__main__":
    main()
