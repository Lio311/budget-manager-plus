import json

with open('package.json', 'r') as f:
    data = json.load(f)

if 'build' in data['scripts']:
    data['scripts']['build'] = data['scripts']['build'].replace(' && prisma db push --accept-data-loss', '')

with open('package.json', 'w') as f:
    json.dump(data, f, indent=2)

