# 앱 아이콘·시작화면 만들기 (빌드 때 자동 실행)
import glob, math, re
from PIL import Image, ImageDraw
R = 'android/app/src/main/res/'
def spark(d, cx, cy, r, col):
    d.polygon([(cx + r*math.cos(a)**3, cy + r*math.sin(a)**3) for a in [2*math.pi*i/64 for i in range(64)]], fill=col)
def art(S, bg, k):
    s = S*4; im = Image.new('RGBA', (s, s), bg); d = ImageDraw.Draw(im); c = s/2; r = s*k
    spark(d, c-r*.12, c+r*.1, r*.85, '#FFFFFF'); spark(d, c+r*.6, c-r*.55, r*.34, '#FFFFFF'); spark(d, c-r*.66, c-r*.62, r*.18, '#FFFFFF')
    return im.resize((S, S), Image.LANCZOS)
for k, v in {'mdpi':48, 'hdpi':72, 'xhdpi':96, 'xxhdpi':144, 'xxxhdpi':192}.items():
    sq = art(v, '#5BB6E8', .42); sq.save(f'{R}mipmap-{k}/ic_launcher.png')
    m = Image.new('L', (v*4, v*4), 0); ImageDraw.Draw(m).ellipse((0, 0, v*4-1, v*4-1), fill=255); m = m.resize((v, v), Image.LANCZOS)
    rd = Image.new('RGBA', (v, v), (0, 0, 0, 0)); rd.paste(sq, (0, 0), m); rd.save(f'{R}mipmap-{k}/ic_launcher_round.png')
    art(int(v*108/48), (0, 0, 0, 0), .27).save(f'{R}mipmap-{k}/ic_launcher_foreground.png')
src = art(512, '#5BB6E8', .42).convert('RGB')
for f in glob.glob(R + 'drawable*/splash.png'):
    w, h = Image.open(f).size; im = Image.new('RGB', (w, h), '#5BB6E8'); s = int(min(w, h)*.35)
    im.paste(src.resize((s, s)), ((w-s)//2, (h-s)//2)); im.save(f)
p = R + 'values/ic_launcher_background.xml'; t = open(p).read(); open(p, 'w').write(re.sub(r'#[0-9A-Fa-f]{6}', '#5BB6E8', t))
print('icons ok')
