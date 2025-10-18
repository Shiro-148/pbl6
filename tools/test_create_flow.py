import requests

API = 'http://localhost:8080'  # backend default port for Spring Boot
MODEL = 'http://localhost:5000'

text = 'apple banana computer extraordinary'

print('Calling model classify...')
r = requests.post(f'{MODEL}/classify', json={'text': text})
print(r.status_code, r.text)

print('Create set...')
r2 = requests.post(f'{API}/api/sets', json={'title': 'Test Set from script', 'description': 'auto-created'})
print(r2.status_code, r2.text)
if r2.status_code == 201:
    setid = r2.json().get('id')
    print('Set id', setid)
    words = r.json().get('words', [])
    for w in words:
        front = w.get('word')
        back = w.get('level')
        print('Creating card', front)
        rc = requests.post(f'{API}/api/sets/{setid}/cards', json={'front': front, 'back': back})
        print(rc.status_code)
else:
    print('Failed to create set', r2.status_code)
