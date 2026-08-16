from pathlib import Path
from PIL import Image

root = Path('/home/ubuntu/az500-exam-practice')
assets = root / 'client/public/assets/ui'
for source in sorted(assets.glob('az500-*.png')):
    target = source.with_suffix('.webp')
    image = Image.open(source)
    if image.mode not in ('RGB', 'RGBA'):
        image = image.convert('RGBA')
    image.save(target, 'WEBP', quality=84, method=6)
    print(f'{source.name} -> {target.name} ({target.stat().st_size} bytes)')
