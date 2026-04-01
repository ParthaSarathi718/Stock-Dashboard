import urllib.request as req
import json
import urllib.error

data = json.dumps({'username': 'debug_user', 'password': 'pwd'}).encode()
request = req.Request('http://127.0.0.1:8000/api/v1/register', data=data, headers={'Content-Type': 'application/json'}, method='POST')

try:
    response = req.urlopen(request)
    print("Code:", response.getcode())
    print("Body:", response.read().decode())
except urllib.error.HTTPError as e:
    print("Error Code:", e.code)
    print("Error Body:", e.read().decode())
except Exception as e:
    print("Connection Issue:", str(e))
