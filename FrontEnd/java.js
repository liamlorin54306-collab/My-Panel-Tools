// ============================================================
//  DASHBOARD - java.js
// ============================================================

const API = 'https://my-panel-tools.onrender.com/api'

console.log("API utilisée :", API)

// ============================================================
//  SYSTÈME DE POPUPS
// ============================================================

function ouvrirPopup(id) {
    fermerTout()
    const popup   = document.getElementById(id)
    const overlay = document.getElementById('overlay')
    if (!popup) return
    overlay.style.display = 'block'
    popup.style.display   = 'block'
}

function fermerTout() {
    document.querySelectorAll('.popup').forEach(p => p.style.display = 'none')
    const overlay = document.getElementById('overlay')
    if (overlay) overlay.style.display = 'none'
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fermerTout()
})

// ============================================================
//  ONGLETS CONVERTISSEUR
//  Le paramètre btn reçoit le bouton cliqué directement
// ============================================================

function switchTab(tab, btn) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('actif'))
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('actif'))
    document.getElementById('tab-' + tab).classList.add('actif')
    btn.classList.add('actif')
}

// ============================================================
//  CONVERTISSEUR ARGENT
//  API Frankfurter — gratuite, pas de clé, temps réel
// ============================================================

async function convertirArgent() {
    const montant = parseFloat(document.getElementById('conv-montant').value)
    const de      = document.getElementById('conv-de').value
    const vers    = document.getElementById('conv-vers').value
    const el      = document.getElementById('conv-resultat')
    const elTaux  = document.getElementById('conv-taux')

    if (!montant || montant <= 0) {
        el.textContent = 'Entrez un montant valide'
        return
    }
    if (de === vers) {
        el.textContent   = montant.toFixed(2) + ' ' + de
        elTaux.textContent = 'Même devise'
        return
    }

    el.textContent     = 'Chargement...'
    elTaux.textContent = ''

    try {
        const res  = await fetch(`https://api.frankfurter.app/latest?from=${de}&to=${vers}`)
        const data = await res.json()
        const taux = data.rates[vers]

        if (!taux) throw new Error('Taux introuvable')

        el.textContent     = `${montant.toFixed(2)} ${de} = ${(montant * taux).toFixed(2)} ${vers}`
        elTaux.textContent = `Taux : 1 ${de} = ${taux} ${vers}`
    } catch(e) {
        el.textContent = 'Erreur de connexion'
    }
}

// ============================================================
//  CONVERTISSEUR MESURES — 100% local, aucune API
// ============================================================

const formulesConversion = {
    'km-miles': v => ({ r: v * 0.621371,   label: 'miles' }),
    'miles-km': v => ({ r: v * 1.60934,    label: 'km' }),
    'm-ft':     v => ({ r: v * 3.28084,    label: 'pieds' }),
    'ft-m':     v => ({ r: v / 3.28084,    label: 'm' }),
    'cm-in':    v => ({ r: v * 0.393701,   label: 'pouces' }),
    'in-cm':    v => ({ r: v * 2.54,       label: 'cm' }),
    'l-gal':    v => ({ r: v * 0.264172,   label: 'gallons' }),
    'gal-l':    v => ({ r: v * 3.78541,    label: 'litres' }),
    'kg-lbs':   v => ({ r: v * 2.20462,    label: 'livres' }),
    'lbs-kg':   v => ({ r: v * 0.453592,   label: 'kg' }),
    'g-oz':     v => ({ r: v * 0.035274,   label: 'onces' }),
    'oz-g':     v => ({ r: v * 28.3495,    label: 'g' }),
    'c-f':      v => ({ r: v * 9/5 + 32,   label: '°F' }),
    'f-c':      v => ({ r: (v-32) * 5/9,   label: '°C' }),
    'c-k':      v => ({ r: v + 273.15,     label: 'K' }),
}

function convertirMesure() {
    const valeur = parseFloat(document.getElementById('mesure-valeur').value)
    const type   = document.getElementById('mesure-type').value
    const el     = document.getElementById('mesure-resultat')

    if (isNaN(valeur)) { el.textContent = 'Entrez une valeur'; return }

    const { r, label } = formulesConversion[type](valeur)
    el.textContent = `${valeur} → ${parseFloat(r.toFixed(4))} ${label}`
}

// ============================================================
//  CONVERTISSEUR ARGENT
//  API Frankfurter (gratuite, temps réel)
//  Devises supportées : EUR, USD, GBP, JPY, CHF, CAD, AUD, CNY, MXN
//  Fallback local si pas de connexion
// ============================================================

// Taux de secours (mis à jour manuellement si besoin)
const TAUX_FALLBACK = {
    EUR: { USD:1.08, GBP:0.85, JPY:162, CHF:0.97, CAD:1.47, AUD:1.64, CNY:7.82, MXN:20.1 },
    USD: { EUR:0.92, GBP:0.79, JPY:150, CHF:0.90, CAD:1.36, AUD:1.52, CNY:7.24, MXN:18.6 },
    GBP: { EUR:1.17, USD:1.27, JPY:190, CHF:1.14, CAD:1.73, AUD:1.93, CNY:9.19, MXN:23.6 },
    JPY: { EUR:0.0062, USD:0.0067, GBP:0.0053, CHF:0.006, CAD:0.009, AUD:0.01, CNY:0.048, MXN:0.12 },
    CHF: { EUR:1.03, USD:1.11, GBP:0.88, JPY:167, CAD:1.52, AUD:1.69, CNY:8.07, MXN:20.7 },
    CAD: { EUR:0.68, USD:0.73, GBP:0.58, JPY:110, CHF:0.66, AUD:1.11, CNY:5.31, MXN:13.6 },
    AUD: { EUR:0.61, USD:0.66, GBP:0.52, JPY:99,  CHF:0.59, CAD:0.90, CNY:4.78, MXN:12.2 },
    CNY: { EUR:0.13, USD:0.14, GBP:0.11, JPY:20.7,CHF:0.12, CAD:0.19, AUD:0.21, MXN:2.56 },
    MXN: { EUR:0.05, USD:0.054,GBP:0.042,JPY:8.1, CHF:0.048,CAD:0.073,AUD:0.082,CNY:0.39 }
}

async function convertirArgent() {
    const montant = parseFloat(document.getElementById('conv-montant').value)
    const de      = document.getElementById('conv-de').value
    const vers    = document.getElementById('conv-vers').value
    const el      = document.getElementById('conv-resultat')
    const elTaux  = document.getElementById('conv-taux')

    if (!montant || montant <= 0) {
        el.textContent = 'Entrez un montant valide'
        return
    }
    if (de === vers) {
        el.textContent     = `${montant.toFixed(2)} ${de}`
        elTaux.textContent = 'Même devise'
        return
    }

    el.textContent     = 'Chargement...'
    elTaux.textContent = ''

    try {
        // Appel API temps réel
        const res  = await fetch(`https://api.frankfurter.app/latest?from=${de}&to=${vers}`)
        const data = await res.json()
        const taux = data.rates[vers]

        if (!taux) throw new Error('Taux introuvable')

        el.textContent     = `${montant.toFixed(2)} ${de} = ${(montant * taux).toFixed(2)} ${vers}`
        elTaux.textContent = `Taux en temps réel : 1 ${de} = ${taux} ${vers}`

    } catch(e) {
        // Fallback sur les taux locaux si pas de connexion
        const taux = TAUX_FALLBACK[de]?.[vers]
        if (taux) {
            el.textContent     = `${montant.toFixed(2)} ${de} = ${(montant * taux).toFixed(2)} ${vers}`
            elTaux.textContent = `Taux approximatif (hors ligne) : 1 ${de} = ${taux} ${vers}`
        } else {
            el.textContent = 'Erreur de conversion'
        }
    }
}

// ============================================================
//  MÉTÉO — via Flask → Open-Meteo (gratuit)
// ============================================================

async function chargerMeteo() {
    const ville = document.getElementById('meteo-ville').value.trim() || 'Paris'
    document.getElementById('meteo-temp').textContent = '...'
    document.getElementById('meteo-condition').textContent = ''
    document.getElementById('meteo-vent').textContent = ''

    const data = await apiFetch(`${API}/meteo?ville=${encodeURIComponent(ville)}`)

    if (data && !data.erreur) {
        document.getElementById('meteo-temp').textContent      = `${data.temperature}°C`
        document.getElementById('meteo-condition').textContent = data.condition
        document.getElementById('meteo-vent').textContent      = `Vent : ${data.vent} km/h`
    } else {
        document.getElementById('meteo-temp').textContent = 'Ville introuvable'
    }
}

async function chargerMeteo() {
    const ville = document.getElementById('meteo-ville').value.trim() || 'Paris'

    document.getElementById('meteo-temp').textContent = '...'

    try {
        // 1. GEO
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${ville}&count=1&language=fr`)
        const geo = await geoRes.json()

        if (!geo.results) {
            document.getElementById('meteo-temp').textContent = 'Ville introuvable'
            return
        }

        const lat = geo.results[0].latitude
        const lon = geo.results[0].longitude

        // 2. METEO
        const meteoRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        )
        const meteo = await meteoRes.json()

        const temp = meteo.current_weather.temperature
        const vent = meteo.current_weather.windspeed

        document.getElementById('meteo-temp').textContent = `${temp}°C`
        document.getElementById('meteo-condition').textContent = 'Temps actuel'
        document.getElementById('meteo-vent').textContent = `Vent : ${vent} km/h`

    } catch {
        document.getElementById('meteo-temp').textContent = 'Erreur météo'
    }
}

// ============================================================
//  MINI IA — via Flask → Groq API
// ============================================================

async function poserQuestion() {
    const input   = document.getElementById('ia-question')
    const message = input.value.trim()
    if (!message) return

    ajouterMessage(message, 'user')
    input.value = ''
    ajouterMessage('...', 'ia', 'msg-loading')

    const data = await apiFetch(`${API}/ia`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message })
    })

    document.querySelector('.msg-loading')?.remove()
    ajouterMessage(
        data ? data.reponse : 'Impossible de joindre le backend. Lance : python app.py',
        'ia'
    )
}

function ajouterMessage(texte, qui, extraClass = '') {
    const box = document.getElementById('ia-historique')
    const div = document.createElement('div')
    div.className   = `msg-${qui} ${extraClass}`.trim()
    div.textContent = texte
    box.appendChild(div)
    box.scrollTop = box.scrollHeight
}

// ============================================================
//  MOTEUR DE RECHERCHE — via Flask → DuckDuckGo + Groq
// ============================================================

async function lancerRecherche() {
    const query = document.getElementById('recherche-input').value.trim()
    if (!query) return

    document.getElementById('recherche-resume').textContent  = 'Recherche en cours...'
    document.getElementById('recherche-resultats').innerHTML = ''

    const data = await apiFetch(`${API}/recherche`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query })
    })

    if (data) {
        document.getElementById('recherche-resume').textContent = data.resume

        const liste = document.getElementById('recherche-resultats')
        if (data.resultats && data.resultats.length > 0) {
            data.resultats.forEach(r => {
                const li = document.createElement('li')
                li.innerHTML = `
    <a href="${r.lien}" target="_blank">🔗 ${r.titre}</a><br>
    <a href="https://www.google.com/search?q=${encodeURIComponent(r.titre)}" target="_blank">🌍 Voir sur Google</a>
    <p>${r.extrait}</p>
`
                liste.appendChild(li)
            })
        } else {
            liste.innerHTML = '<li style="color:#888;font-size:12px">Aucun résultat trouvé</li>'
        }
    } else {
        document.getElementById('recherche-resume').textContent =
            'Impossible de joindre le backend. Lance : python app.py'
    }
}

// ============================================================
//  UTILITAIRE — fetch générique avec gestion d'erreur
// ============================================================

async function apiFetch(url, options = {}) {
    try {
        const reponse = await fetch(url, options)
        if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`)
        return await reponse.json()
    } catch (e) {
        console.error('apiFetch erreur :', e)
        return null
    }
}

// ============================================================
//  TO-DO LIST — 100% localStorage
// ============================================================

function chargerTodos()          { return JSON.parse(localStorage.getItem('todos') || '[]') }
function sauvegarderTodos(todos) { localStorage.setItem('todos', JSON.stringify(todos)) }

function afficherTodos() {
    const todos = chargerTodos()
    const liste = document.getElementById('todo-liste')
    liste.innerHTML = ''
    todos.forEach((todo, index) => {
        const li   = document.createElement('li')
        const span = document.createElement('span')
        span.textContent   = todo.texte
        span.style.cssText = `cursor:pointer;flex:1;
            text-decoration:${todo.fait ? 'line-through' : 'none'};
            color:${todo.fait ? '#aaa' : '#222'}`
        span.onclick = () => toggleTodo(index)
        const btn = document.createElement('button')
        btn.textContent = 'X'
        btn.onclick     = () => supprimerTodo(index)
        li.appendChild(span)
        li.appendChild(btn)
        liste.appendChild(li)
    })
}

function ajouterTodo() {
    const input = document.getElementById('todo-input')
    const texte = input.value.trim()
    if (!texte) return
    const todos = chargerTodos()
    todos.push({ texte, fait: false })
    sauvegarderTodos(todos)
    afficherTodos()
    input.value = ''
}

function toggleTodo(index) {
    const todos = chargerTodos()
    todos[index].fait = !todos[index].fait
    sauvegarderTodos(todos)
    afficherTodos()
}

function supprimerTodo(index) {
    const todos = chargerTodos()
    todos.splice(index, 1)
    sauvegarderTodos(todos)
    afficherTodos()
}

// ============================================================
//  POMODORO — 100% local
// ============================================================

let pomodoroInterval = null
let pomodoroSecondes = 25 * 60
let pomodoroSessions = 0
let pomodoroActif    = false

function afficherTemps(s) {
    const min = String(Math.floor(s / 60)).padStart(2, '0')
    const sec = String(s % 60).padStart(2, '0')
    document.getElementById('pomodoro-temps').textContent = `${min}:${sec}`
}

function demarrerPomodoro() {
    if (pomodoroActif) {
        clearInterval(pomodoroInterval)
        pomodoroActif = false
        return
    }
    pomodoroActif    = true
    pomodoroInterval = setInterval(() => {
        pomodoroSecondes--
        afficherTemps(pomodoroSecondes)
        if (pomodoroSecondes <= 0) {
            clearInterval(pomodoroInterval)
            pomodoroActif    = false
            pomodoroSessions++
            pomodoroSecondes = 25 * 60
            document.getElementById('pomodoro-sessions').textContent = `Sessions : ${pomodoroSessions}`
            afficherTemps(pomodoroSecondes)
            alert('Pomodoro terminé ! Prends une pause.')
        }
    }, 1000)
}

function resetPomodoro() {
    clearInterval(pomodoroInterval)
    pomodoroActif    = false
    pomodoroSecondes = 25 * 60
    afficherTemps(pomodoroSecondes)
}

// ============================================================
//  HORLOGE MONDIALE — 100% local
// ============================================================

function mettreAJourHorloge() {
    const tz  = document.getElementById('horloge-timezone')?.value || 'Europe/Paris'
    const now = new Date()
    const h   = now.toLocaleTimeString('fr-FR', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const d   = now.toLocaleDateString('fr-FR',  { timeZone: tz, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const elH = document.getElementById('horloge-heure')
    const elD = document.getElementById('horloge-date')
    if (elH) elH.textContent = h
    if (elD) elD.textContent = d
}

// ============================================================
//  NOTES RAPIDES — 100% localStorage
// ============================================================

function sauvegarderNotes() {
    localStorage.setItem('notes', document.getElementById('notes-texte').value)
}
function chargerNotes() {
    const el = document.getElementById('notes-texte')
    if (el) el.value = localStorage.getItem('notes') || ''
}

// ============================================================
//  GÉNÉRATEUR DE MOT DE PASSE — crypto local
// ============================================================

function genererMotDePasse() {
    const longueur   = parseInt(document.getElementById('mdp-longueur').value)
    const majuscules = document.getElementById('mdp-majuscules').checked
    const chiffres   = document.getElementById('mdp-chiffres').checked
    const symboles   = document.getElementById('mdp-symboles').checked

    let chars = 'abcdefghijklmnopqrstuvwxyz'
    if (majuscules) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (chiffres)   chars += '0123456789'
    if (symboles)   chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'

    const tableau = new Uint8Array(longueur)
    crypto.getRandomValues(tableau)
    document.getElementById('mdp-resultat').value =
        Array.from(tableau).map(b => chars[b % chars.length]).join('')
}

function copierMotDePasse() {
    const mdp = document.getElementById('mdp-resultat').value
    if (!mdp) return
    navigator.clipboard.writeText(mdp).then(() => {
        const btn = event.target
        const old = btn.textContent
        btn.textContent = 'Copié !'
        setTimeout(() => btn.textContent = old, 1500)
    })
}

// ============================================================
//  CALCULATRICE — 100% local
// ============================================================

let calcExpression = ''

function calc(v)    { calcExpression += v;         document.getElementById('calc-ecran').value = calcExpression }
function calcOp(op) { calcExpression += ` ${op} `; document.getElementById('calc-ecran').value = calcExpression }

function calcEgal() {
    try {
        const res     = Function('"use strict"; return (' + calcExpression + ')')()
        const arrondi = parseFloat(res.toFixed(10))
        document.getElementById('calc-ecran').value = arrondi
        calcExpression = String(arrondi)
    } catch {
        document.getElementById('calc-ecran').value = 'Erreur'
        calcExpression = ''
    }
}

function calcReset() {
    calcExpression = ''
    document.getElementById('calc-ecran').value = ''
}

// ============================================================
//  RACCOURCIS CLAVIER — Entrée dans les champs
// ============================================================

document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return
    const id = document.activeElement.id
    if (id === 'todo-input')      ajouterTodo()
    if (id === 'meteo-ville')     chargerMeteo()
    if (id === 'ia-question')     poserQuestion()
    if (id === 'recherche-input') lancerRecherche()
    if (id === 'conv-montant')    convertirArgent()
    if (id === 'mesure-valeur')   convertirMesure()
})

// ============================================================
//  INITIALISATION — au chargement de la page
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.popup').forEach(p => p.style.display = 'none')
    afficherTodos()
    chargerNotes()
    afficherTemps(pomodoroSecondes)
    mettreAJourHorloge()
    setInterval(mettreAJourHorloge, 1000)
})
