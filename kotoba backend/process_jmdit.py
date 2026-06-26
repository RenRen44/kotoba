import sqlite3
import json
import os
import urllib.request

print("Opening JMdict...")
script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'jmdict-all-3.6.2.json')

# Download if not present
if not os.path.exists(json_path):
    print("Downloading JMdict JSON...")
    url = "https://github.com/scriptin/jmdict-simplified/releases/download/3.6.2+20250415130237/jmdict-all-3.6.2.json.tgz"
    tgz_path = json_path + '.tgz'
    urllib.request.urlretrieve(url, tgz_path)
    print("Extracting...")
    import tarfile
    with tarfile.open(tgz_path, 'r:gz') as tar:
        tar.extractall(script_dir)
    os.remove(tgz_path)
    print("Done downloading.")

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Loaded {len(data['words'])} entries")

# Create database
conn = sqlite3.connect('jmdict.db')
cursor = conn.cursor()

# Create the table
cursor.execute('''
    CREATE TABLE IF NOT EXISTS words (
        id          TEXT PRIMARY KEY,
        kanji       TEXT,
        kana        TEXT,
        meanings    TEXT,
        pos         TEXT,
        is_common   INTEGER,
        usually_kana INTEGER,
        antonyms    TEXT,
        related     TEXT,
        domain      TEXT
    )
''')

print("Processing entries...")
batch = []

for entry in data['words']:
    kanji    = entry['kanji'][0]['text'] if entry['kanji'] else None
    kana     = entry['kana'][0]['text']  if entry['kana']  else None
    
    meanings = '; '.join(
        g['text']
        for s in entry['sense']
        for g in s['gloss']
        if g['lang'] == 'eng'
    )
    
    pos = json.dumps(entry['sense'][0]['partOfSpeech'])
    
    is_common = int(
        any(k.get('common') for k in entry['kana']) or
        any(k.get('common') for k in entry['kanji'])
    )
    
    usually_kana = int(
        any('uk' in s.get('misc', []) for s in entry['sense'])
    )
    
    antonyms = json.dumps([
        a[0] for s in entry['sense'] for a in s['antonym']
    ])
    
    related = json.dumps([
        r[0] for s in entry['sense'] for r in s['related']
    ])
    
    domain = json.dumps([
        f for s in entry['sense'] for f in s['field']
    ])
    
    batch.append((
        entry['id'], kanji, kana, meanings,
        pos, is_common, usually_kana,
        antonyms, related, domain
    ))
    
    if len(batch) == 1000:
        cursor.executemany(
            'INSERT OR IGNORE INTO words VALUES (?,?,?,?,?,?,?,?,?,?)',
            batch
        )
        batch = []

if batch:
    cursor.executemany(
        'INSERT OR IGNORE INTO words VALUES (?,?,?,?,?,?,?,?,?,?)',
        batch
    )

cursor.execute('CREATE INDEX IF NOT EXISTS idx_kanji ON words(kanji)')
cursor.execute('CREATE INDEX IF NOT EXISTS idx_kana  ON words(kana)')
cursor.execute('CREATE INDEX IF NOT EXISTS idx_common ON words(is_common)')

conn.commit()
conn.close()
print("Done! jmdict.db created")