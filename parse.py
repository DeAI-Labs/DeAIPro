import sys

with open('/home/ciarrai/Documents/DeAI/dashboard-new.html', 'r', encoding='utf-8') as f:
    content = f.read()

style_start = content.find('<style>')
style_end = content.find('</style>')
if style_start != -1 and style_end != -1:
    style_content = content[style_start+7:style_end]
    print(f"Style length: {len(style_content)}")
    with open('dashboard_style.css', 'w', encoding='utf-8') as f:
        f.write(style_content)

body_start = content.find('<body>')
script_start = content.find('<script>', body_start)
if script_start != -1:
    body_content = content[body_start+6:script_start].strip()
else:
    body_content = content[body_start+6:content.find('</body>')].strip()

print(f"Body length: {len(body_content)}")
with open('dashboard_body.html', 'w', encoding='utf-8') as f:
    f.write(body_content)

scripts = []
idx = 0
while True:
    idx = content.find('<script', idx)
    if idx == -1: break
    end_tag = content.find('</script>', idx)
    if end_tag != -1:
        scripts.append(content[idx:end_tag+9])
        idx = end_tag + 9
    else:
        break

print(f"Total scripts found: {len(scripts)}")
for i, s in enumerate(scripts):
    print(f"Script {i} length: {len(s)}")
    if 'src=' not in s:
        start_idx = s.find('>') + 1
        with open(f'dashboard_script_{i}.js', 'w', encoding='utf-8') as f:
            f.write(s[start_idx:-9])

