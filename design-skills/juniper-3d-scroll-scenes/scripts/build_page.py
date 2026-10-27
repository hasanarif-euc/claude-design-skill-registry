"""Bundle a three.js scene and inline everything into one self-contained HTML file.

Usage:
  npx esbuild scene.js --bundle --minify --format=iife --target=es2020 --outfile=bundle.js
  python3 build_page.py --template page-template.html --bundle bundle.js \
      --assets assets/ --fonts fonts/ --logo logo.svg --out page.html

Placeholders in the template:
  {{a:NAME}}   -> data URI of assets/NAME.webp
  {{f:NAME}}   -> data URI of fonts/NAME.woff2
  {{logo}}     -> inline SVG wordmark (clip-path ids made unique per use)
  {{bundle}}   -> the minified scene bundle (inserted last, because minified
                  three.js can itself contain "{{")
"""
import argparse
import base64
import pathlib
import re


def data_uri(path: pathlib.Path, mime: str) -> str:
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--template", required=True)
    ap.add_argument("--bundle", required=True)
    ap.add_argument("--assets", default="assets")
    ap.add_argument("--fonts", default="fonts")
    ap.add_argument("--logo", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    html = pathlib.Path(a.template).read_text(encoding="utf-8")
    logo = pathlib.Path(a.logo).read_text(encoding="utf-8")
    clip_ids = set(re.findall(r'id="([^"]+)"', logo))
    count = [0]

    def inline_logo(_m):
        count[0] += 1
        out = logo
        for cid in clip_ids:
            out = out.replace(cid, f"{cid}-{count[0]}")
        return out

    html = re.sub(r"\{\{logo\}\}", inline_logo, html)
    html = re.sub(r"\{\{a:([a-z0-9-]+)\}\}", lambda m: data_uri(pathlib.Path(a.assets) / f"{m.group(1)}.webp", "image/webp"), html)
    html = re.sub(r"\{\{f:([a-z0-9-]+)\}\}", lambda m: data_uri(pathlib.Path(a.fonts) / f"{m.group(1)}.woff2", "font/woff2"), html)
    assert html.count("{{bundle}}") == 1, "template needs exactly one {{bundle}}"
    leftover = re.findall(r"\{\{(?!bundle)[^}]+\}\}", html)
    assert not leftover, f"unfilled placeholders: {leftover[:5]}"
    bundle = pathlib.Path(a.bundle).read_text(encoding="utf-8").replace("</script", "<\\/script")
    html = html.replace("{{bundle}}", bundle)
    pathlib.Path(a.out).write_text(html, encoding="utf-8")
    print(f"{a.out}: {len(html) // 1024} KB")


if __name__ == "__main__":
    main()
