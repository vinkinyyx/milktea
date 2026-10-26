#!/usr/bin/env python3
"""Mirror the root TypeScript contract into Creator's asset database verbatim."""
import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "contracts" / "types.ts"
DESTINATION = ROOT / "client" / "assets" / "scripts" / "contracts" / "types.ts"


def main() -> int:
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--sync", action="store_true", help="copy the canonical contract bytes into client assets")
    group.add_argument("--check", action="store_true", help="verify exact byte equality")
    args = parser.parse_args()
    source = SOURCE.read_bytes()
    if args.sync:
        DESTINATION.parent.mkdir(parents=True, exist_ok=True)
        DESTINATION.write_bytes(source)
    if not DESTINATION.exists() or DESTINATION.read_bytes() != source:
        raise SystemExit("客户端类型合同镜像缺失或与 contracts/types.ts 不同；运行 python tools/sync_client_contracts.py --sync")
    print("客户端类型合同与 contracts/types.ts 逐字节一致")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
