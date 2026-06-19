import sqlite3
import json

print("Opening JMdict...")
import os
script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'jmdict-all-3.6.2.json')

with open(json_path, 'r', encoding='utf-8') as f:    data = json.load(f)  # this takes ~10 seconds, file is big

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
    # Extract what we need
    kanji    = entry['kanji'][0]['text'] if entry['kanji'] else None
    kana     = entry['kana'][0]['text']  if entry['kana']  else None
    
    # All English meanings joined
    meanings = '; '.join(
        g['text']
        for s in entry['sense']
        for g in s['gloss']
        if g['lang'] == 'eng'
    )
    
    # Part of speech from first sense
    pos = json.dumps(entry['sense'][0]['partOfSpeech'])
    
    # Is it a common word?
    is_common = int(
        any(k.get('common') for k in entry['kana']) or
        any(k.get('common') for k in entry['kanji'])
    )
    
    # Usually written in kana only?
    usually_kana = int(
        any('uk' in s.get('misc', []) for s in entry['sense'])
    )
    
    # Antonyms
    antonyms = json.dumps([
        a[0] for s in entry['sense'] for a in s['antonym']
    ])
    
    # Related words
    related = json.dumps([
        r[0] for s in entry['sense'] for r in s['related']
    ])
    
    # Domain (food, medicine, sport etc)
    domain = json.dumps([
        f for s in entry['sense'] for f in s['field']
    ])
    
    batch.append((
        entry['id'], kanji, kana, meanings,
        pos, is_common, usually_kana,
        antonyms, related, domain
    ))
    
    # Insert in batches of 1000 (way faster than one by one)
    if len(batch) == 1000:
        cursor.executemany(
            'INSERT OR IGNORE INTO words VALUES (?,?,?,?,?,?,?,?,?,?)',
            batch
        )
        batch = []

# Insert remaining
if batch:
    cursor.executemany(
        'INSERT OR IGNORE INTO words VALUES (?,?,?,?,?,?,?,?,?,?)',
        batch
    )

# This index makes lookups by kanji INSTANT
cursor.execute('CREATE INDEX IF NOT EXISTS idx_kanji ON words(kanji)')
cursor.execute('CREATE INDEX IF NOT EXISTS idx_kana  ON words(kana)')
cursor.execute('CREATE INDEX IF NOT EXISTS idx_common ON words(is_common)')

conn.commit()
conn.close()
print("Done! jmdict.db created")