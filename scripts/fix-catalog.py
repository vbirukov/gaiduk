import json

cat = json.load(open('/var/media/catalog.json'))

def resolve_section(folder_name):
    """Убирает годовые диапазоны из имени секции."""
    import re
    return re.sub(r'\s*\d{4}\s*[-–—]\s*\d{4}\s*$', '', folder_name).strip()

# Add sections to catalog
section_set = set()
for t in cat['tracks']:
    section = resolve_section(t['folder'])
    t['section'] = section
    section_set.add(section)

cat['sections'] = sorted(section_set)

# Write back
with open('/var/media/catalog.json', 'w') as f:
    json.dump(cat, f, ensure_ascii=False, indent=2)

print(f"Updated catalog.json: {len(cat['tracks'])} tracks, {len(cat['sections'])} sections")
for s in cat['sections']:
    count = sum(1 for t in cat['tracks'] if t['section'] == s)
    folders = sorted(set(t['folder'] for t in cat['tracks'] if t['section'] == s))
    print(f'  {s}: {count} tracks, {len(folders)} folders')