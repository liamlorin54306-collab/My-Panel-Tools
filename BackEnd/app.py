from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

# ============================================================
#  CLÉ API GROQ (gratuite sur https://console.groq.com)
# ============================================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY")  # Mettre la clé Groq ici

# ============================================================
#  ROUTE : MÉTÉO
#  Utilise Open-Meteo (100% gratuit, pas de clé API)
# ============================================================

@app.route('/api/meteo')
def get_meteo():
    ville = request.args.get('ville', 'Paris')

    try:
        # ---------------- GEOLOCALISATION ----------------
        geo = requests.get(
            f'https://geocoding-api.open-meteo.com/v1/search?name={ville}&count=1&language=fr'
        ).json()

        if not geo.get('results'):
            return jsonify({'erreur': 'Ville introuvable'}), 404

        lat = geo['results'][0]['latitude']
        lon = geo['results'][0]['longitude']
        nom = geo['results'][0]['name']

        # ---------------- METEO ----------------
        meteo = requests.get(
            f'https://api.open-meteo.com/v1/forecast'
            f'?latitude={lat}&longitude={lon}'
            f'&current=temperature_2m,wind_speed_10m,weather_code'
        ).json()

        # Compatibilité ancienne / nouvelle API
        current = meteo.get('current') or meteo.get('current_weather')

        if not current:
            print("DEBUG METEO:", meteo)
            return jsonify({'erreur': 'Données météo indisponibles'}), 500

        # 🔥 FIX PRINCIPAL (bien indenté)
        temp = current.get('temperature_2m') or current.get('temperature')
        vent = current.get('wind_speed_10m') or current.get('windspeed')
        code = current.get('weather_code') or current.get('weathercode')

        # Sécurité si valeurs absentes
        if temp is None or vent is None:
            print("DEBUG CURRENT:", current)
            return jsonify({'erreur': 'Données météo incomplètes'}), 500

        # ---------------- CONDITIONS ----------------
        conditions = {
            0: 'Ciel dégagé',
            1: 'Principalement dégagé',
            2: 'Partiellement nuageux',
            3: 'Couvert',
            45: 'Brouillard',
            48: 'Brouillard givrant',
            51: 'Bruine légère',
            53: 'Bruine modérée',
            55: 'Bruine dense',
            61: 'Pluie légère',
            63: 'Pluie modérée',
            65: 'Pluie forte',
            71: 'Neige légère',
            73: 'Neige modérée',
            75: 'Neige forte',
            80: 'Averses légères',
            81: 'Averses modérées',
            82: 'Averses fortes',
            95: 'Orage',
            96: 'Orage avec grêle',
            99: 'Orage violent'
        }

        return jsonify({
            'ville': nom,
            'temperature': round(temp, 1),
            'vent': round(vent, 1),
            'condition': conditions.get(code, f'Code {code}')
        })

    except Exception as e:
        print("ERREUR METEO:", e)
        return jsonify({'erreur': str(e)}), 500

# ============================================================
#  ROUTE : MINI IA
#  Utilise Groq (gratuit, très rapide — modèle llama3)
#  Inscris-toi sur https://console.groq.com pour avoir ta clé
# ============================================================

@app.route('/api/ia', methods=['POST'])
def get_ia():
    data = request.get_json()
    message = data.get('message', '').strip()

    if not message:
        return jsonify({'erreur': 'Message vide'}), 400

    if not GROQ_API_KEY:
        return jsonify({'reponse': 'Clé API manquante'}), 500

    try:
        response = requests.post(
            'https://api.groq.com/openai/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {GROQ_API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'llama-3.3-70b-versatile',
                'messages': [
                    {"role": "system", "content": "Réponds en français, court."},
                    {"role": "user", "content": message}
                ],
                'max_tokens': 300
            }
        )

        print("STATUS:", response.status_code)
        print("REPONSE:", response.text)

        if response.status_code != 200:
            return jsonify({'reponse': f'Erreur API ({response.status_code})'}), 500

        data = response.json()
        texte = data['choices'][0]['message']['content']

        return jsonify({'reponse': texte})

    except Exception as e:
        print("ERREUR IA:", e)
        return jsonify({'reponse': f'Erreur serveur : {str(e)}'}), 500


# ============================================================
#  ROUTE : MOTEUR DE RECHERCHE
#  Utilise DuckDuckGo (gratuit, pas de clé API)
#  + résumé généré par l'IA Groq
# ============================================================

@app.route('/api/recherche', methods=['POST'])
def get_recherche():
    data  = request.get_json()
    query = data.get('query', '').strip()

    if not query:
        return jsonify({'erreur': 'Requête vide'}), 400

    try:
        # 🔥 Génération de résultats fiables
        resultats = [
            {
                'titre': f'Recherche Google : {query}',
                'extrait': 'Voir tous les résultats sur Google',
                'lien': f'https://www.google.com/search?q={query}'
            },
            {
                'titre': f'Wikipedia : {query}',
                'extrait': 'Article Wikipédia (source fiable)',
                'lien': f'https://fr.wikipedia.org/wiki/{query.replace(" ", "_")}'
            },
            {
                'titre': f'YouTube : {query}',
                'extrait': 'Vidéos liées à ta recherche',
                'lien': f'https://www.youtube.com/results?search_query={query}'
            },
            {
                'titre': f'Actualités : {query}',
                'extrait': 'Voir les news récentes',
                'lien': f'https://news.google.com/search?q={query}'
            },
            {
                'titre': f'GitHub : {query}',
                'extrait': 'Code et projets liés',
                'lien': f'https://github.com/search?q={query}'
            }
        ]

        # 🔥 Résumé simple (sans IA pour éviter bugs)
        resume = f"Résultats fiables pour : {query}"

        return jsonify({
            'resume': resume,
            'resultats': resultats
        })

    except Exception as e:
        return jsonify({
            'resume': f'Erreur : {str(e)}',
            'resultats': []
        }), 500



@app.route("/")
def home():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route("/<path:filename>")
def FrontEnd_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)



BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, '..', 'FrontEnd')

print("FRONTEND_DIR =", FRONTEND_DIR)

# ============================================================
#  LANCEMENT
# ============================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
