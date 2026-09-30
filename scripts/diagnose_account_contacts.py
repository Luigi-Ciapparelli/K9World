#!/usr/bin/env python3
"""Read-only contact delivery checks. Prints booleans, never credentials/OTPs."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
from urllib.request import Request, urlopen

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--secrets', action='store_true', help='Read only the presence of expected Edge secrets via the logged-in Supabase CLI')
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[1]
    values = {}
    for name in ['.env', '.env.local', '.env.production', '.env.production.local']:
        file = repo / name
        if not file.is_file():
            continue
        for line in file.read_text().splitlines():
            match = re.match(r'^\s*(VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY)\s*=\s*(.*?)\s*$', line)
            if match:
                values[match[1]] = match[2].strip('"\'')
    for key in ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']:
        if os.environ.get(key):
            values[key] = os.environ[key]
    print('Controllo in sola lettura. Nessun account o recapito modificato.')
    try:
        url = values['VITE_SUPABASE_URL'].rstrip('/')
        if not re.fullmatch(r'https://[a-z0-9]+\.supabase\.co', url):
            raise ValueError('URL progetto non riconosciuto')
        response = json.load(urlopen(Request(url+'/auth/v1/settings', headers={'apikey':values['VITE_SUPABASE_ANON_KEY']}), timeout=15))
        print('Conferma automatica email:', response.get('mailer_autoconfirm'))
        print('Conferma automatica telefono:', response.get('phone_autoconfirm'))
        print('Registrazioni disabilitate:', response.get('disable_signup'))
        print('SMTP Auth: non ispezionabile da questa API pubblica; verificare nel pannello Supabase.')
    except Exception as error:
        print('Configurazione pubblica non letta:', type(error).__name__)
    if args.secrets:
        print('Controllo presenza configurazione invii Edge (massimo 60 secondi)…', flush=True)
        try:
            result = subprocess.run(['npx','--yes','supabase@2.118.0','secrets','list','--output','json'], cwd=repo, text=True, capture_output=True, timeout=60)
            if result.returncode:
                raise RuntimeError('CLI non disponibile o progetto non collegato')
            output = result.stdout
            for label, keys in [('Email',['RESEND_API_KEY','VERIFICATION_FROM_EMAIL'])]:
                missing = [key for key in keys if not re.search(r'\b'+key+r'\b', output)]
                print(label + ': ' + ('nomi dei secret presenti; consegna reale da provare' if not missing else 'mancano '+', '.join(missing)))
            print('Lancio senza SMS: Twilio non richiesto. Il nuovo endpoint invia SMS solo con CONTACT_SMS_ENABLED=true e tutte le credenziali presenti.')
            print('Flag SMS:', 'nome presente; il valore non viene letto da questa diagnosi' if 'CONTACT_SMS_ENABLED' in output else 'assente: SMS disattivati nel nuovo endpoint')
            print('Modalità sviluppo legacy:', 'nome del flag ancora presente; i nuovi endpoint lo ignorano' if 'ALLOW_VERIFICATION_DEV_CODE' in output else 'flag non trovato')
        except Exception as error:
            print('Presenza secret non verificata:', type(error).__name__)
    print('Non incollare password, chiavi API o codici ricevuti nella chat.')

if __name__ == '__main__':
    main()
