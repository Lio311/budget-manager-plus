
params = ["Ramat Gan", "Tel Aviv", "Petah Tikva", "Rishon LeZion"]

with open("src/lib/israel-cities.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    for p in params:
        if f'"{p}"' in line:
            print(f"Found {p} at line {i+1}")
