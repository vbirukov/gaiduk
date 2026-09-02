import json, re

cat = json.load(open('/var/media/catalog.json'))

def resolve_track_section(folder_name):
    cleaned = re.sub(r'\s*\d{4}\s*[-–—]\s*\d{4}\s*$', '', folder_name).strip()
    parts = [p.strip() for p in re.split(r'[/\\|\u2014\u2013-]+', cleaned) if p.strip()]
    return parts[0] if len(parts) > 1 else 'Каталог'

tracks = []
for t in cat['tracks']:
    section = resolve_track_section(t['folder'])
    tracks.append({**t, 'section': section})

sections = sorted(set(t['section'] for t in tracks))

for section in sections:
    section_folders = sorted(set(t['folder'] for t in tracks if t['section'] == section))
    print(f'\n=== Section: "{section}" ===')
    for folder in section_folders:
        matching = [t for t in tracks if t['section'] == section and t['folder'] == folder]
        print(f'  Folder: "{folder}" -> {len(matching)} tracks')

print('\n=== TEST: navigate to folder ===')
test_section = '01 RASTAMANSKIE SKAZKI'
test_folder = '01 RASTAMANSKIE SKAZKI 1995 - 1997'
matching = [t for t in tracks if t['section'] == test_section and t['folder'] == test_folder]
print(f'Section: "{test_section}", Folder: "{test_folder}" -> {len(matching)} tracks')