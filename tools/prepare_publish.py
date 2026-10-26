"""Package only this project's reviewable files. Never reads known secret/cached paths."""
from pathlib import Path
import argparse, base64, hashlib, json, zipfile
ROOT=Path(__file__).resolve().parents[1]
SKIP_DIRS={".git",".playwright-cli",".playwright","__pycache__","node_modules","library","temp","local","build","dist","coverage"}
def files():
    result=[]
    for p in ROOT.rglob("*"):
        if not p.is_file():continue
        rel=p.relative_to(ROOT)
        if any(x in SKIP_DIRS for x in rel.parts):continue
        n=p.name.lower()
        if n in ["thumbs.db",".ds_store"] or p.suffix.lower() in [".pyc",".log",".pem",".key"]:continue
        if n.startswith(".env") and n!=".env.example":continue
        if n in ["credentials.json","secrets.json","secrets.yaml","secrets.yml"]:continue
        result.append(p)
    return sorted(result,key=lambda p:p.relative_to(ROOT).as_posix())
def manifest():
    rows=[]
    for p in files():
        raw=p.read_bytes()
        rows.append(dict(path=p.relative_to(ROOT).as_posix(),size=len(raw),sha256=hashlib.sha256(raw).hexdigest(),
            git_blob_sha=hashlib.sha1(b"blob "+str(len(raw)).encode()+b"\0"+raw).hexdigest()))
    return rows
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--archive",action="store_true")
    parser.add_argument("--manifest",action="store_true")
    parser.add_argument("--payload")
    parser.add_argument("--offset",type=int,default=0)
    parser.add_argument("--length",type=int,default=12288)
    args=parser.parse_args()
    if args.archive:
        output=ROOT/"output/milktea-design-v0.2.zip"
        with zipfile.ZipFile(output,"w",zipfile.ZIP_DEFLATED,compresslevel=9) as z:
            for p in files():
                if p.suffix.lower()==".zip":continue
                z.write(p,p.relative_to(ROOT).as_posix())
        with zipfile.ZipFile(output) as z:assert z.testzip() is None
        print(json.dumps(dict(archive=output.name,bytes=output.stat().st_size,entries=len(z.infolist()))))
    if args.manifest:print(json.dumps(manifest(),ensure_ascii=True))
    if args.payload:
        p=(ROOT/args.payload).resolve()
        assert p.is_relative_to(ROOT) and p in files()
        assert 0<=args.offset and 1<=args.length<=24576
        raw=p.read_bytes()[args.offset:args.offset+args.length]
        print(json.dumps({"base64":base64.b64encode(raw).decode("ascii"),"bytes":len(raw)}))
if __name__=="__main__":main()

