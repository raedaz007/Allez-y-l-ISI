# 🎓 Allez-y à l'ISI

**Votre assistant numérique pour la vie universitaire.**

Projet étudiant **indépendant**, réalisé à des fins éducatives et pratiques.
Ce site **n'est pas officiel** et **n'est pas affilié** à l'administration de l'ISI.
Le projet est **en cours de développement**.

---

## 1. Présentation

Allez-y à l'ISI centralise, dans une application 100 % frontend (aucun serveur,
aucune base de données distante) :

- l'emploi du temps, les salles et le bâtiment de l'ISI (visite interactive par étage) ;
- les enseignants, matières et la recherche globale ;
- la **Prépa Intégrée** (Semestres 1 et 2), structurée fidèlement à partir du
  **plan d'études officiel** et du **syllabus officiel** fournis par le créateur
  du projet (UE → ECUE → Chapitres) ;
- des outils d'organisation : notes, tâches, favoris, historique, Pomodoro,
  calendrier, publications, notifications locales et un assistant conversationnel.

## 2. Fonctionnalités

- 🌞/🌙 Thème clair / sombre (sauvegardé localement)
- 🌐 Multilingue Français / English / العربية avec support RTL complet
- 📅 Emploi du temps interactif (jour / semaine), séance en cours mise en évidence
- 🏫 Recherche de salle (`A206` → Bloc A, Étage 2, Salle 06)
- 🗺️ Explorer l'ISI : vue générale, éclatée, coupes, par étage (images fournies)
- 👨‍🏫 Annuaire enseignants avec recherche
- 🔎 Recherche globale (salles, enseignants, matières, séances, chapitres, publications)
- 🎓 Prépa Intégrée : progression par chapitre (non commencé / en cours / terminé),
  ressources par chapitre (vidéos, cours, exercices, corrigés, TD, TP)
- 🤖 Assistant conversationnel frontend (base de questions FR/EN/AR, réponses dynamiques
  basées sur vos données locales : prochain cours, salle, enseignant, révisions du jour...)
- 📢 Publications, 🔔 Notifications locales, 📆 Calendrier (jour/semaine/mois)
- ⭐ Favoris, 🕘 Historique, 📝 Notes, ✅ Tâches, 📊 Progression, ⏱️ Pomodoro
- Authentification **locale/démonstrative** (aucun mot de passe institutionnel demandé)

## 3. Technologies

HTML5, CSS3, JavaScript vanilla (aucun framework), JSON. Aucune dépendance
externe : compatible **GitHub Pages** tel quel, avec uniquement des chemins relatifs.

## 4. Installation

Aucune installation n'est nécessaire : c'est un site statique.

```bash
git clone <votre-repo>
cd allez-y-a-l-isi
```

## 5. Lancement en local

Comme le site utilise `fetch()` pour charger les fichiers JSON, il doit être
servi par un petit serveur local (pas de double-clic direct sur `index.html`) :

```bash
# Python
python3 -m http.server 8000

# ou Node
npx serve .
```

Puis ouvrez `http://localhost:8000`.

## 6. Publier sur GitHub Pages

1. Poussez le contenu de ce dossier à la racine d'un repository GitHub.
2. Allez dans **Settings → Pages**.
3. Source : **Deploy from a branch**, branche `main`, dossier `/ (root)`.
4. Votre site sera disponible à `https://<utilisateur>.github.io/<repo>/`.

Tous les chemins du projet sont relatifs (`./css/...`, `./js/...`, `./data/...`),
aucune modification n'est nécessaire.

## 7. Structure du projet

```
allez-y-a-l-isi/
├── index.html
├── README.md
├── css/
│   ├── themes.css        (variables couleurs clair/sombre)
│   ├── style.css         (styles principaux)
│   └── responsive.css    (breakpoints + RTL)
├── js/
│   ├── storage.js        (localStorage)
│   ├── language.js       (i18n FR/EN/AR)
│   ├── data.js           (chargement JSON)
│   ├── timetable.js      (logique emploi du temps)
│   ├── auth.js           (connexion locale/démonstrative)
│   ├── app.js             (routeur, shell, sidebar, topbar, modals, toasts)
│   ├── pages.js           (dashboard, publications, profil, paramètres, à propos,
│   │                        favoris, notes, tâches, progression, pomodoro)
│   ├── timetable-pages.js (pages Emploi du temps / Matières)
│   ├── rooms.js           (Salles)
│   ├── building.js        (Explorer l'ISI)
│   ├── teachers.js        (Enseignants)
│   ├── search.js          (Recherche globale)
│   ├── prepa.js           (Prépa Intégrée)
│   ├── resources.js       (Ressources filtrables)
│   ├── notifications.js   (notifications locales)
│   └── calendar.js        (calendrier)
├── data/
│   ├── users.json          (comptes de démonstration autorisés)
│   ├── students.json       (profils étudiants)
│   ├── teachers.json       (enseignants — extraits de l'EDT fourni)
│   ├── subjects.json       (matières du semestre affiché dans l'EDT)
│   ├── rooms.json           (salles connues)
│   ├── timetable.json      (emploi du temps de démonstration)
│   ├── publications.json   (publications — voir emplacement dédié dans le fichier)
│   ├── chatbot.json         (base de questions/réponses de l'assistant)
│   ├── team.json            (équipe du projet + avertissement)
│   └── prepa/
│       ├── semester1.json   (UE/ECUE/chapitres — Semestre 1, depuis le syllabus officiel)
│       └── semester2.json   (UE/ECUE/chapitres — Semestre 2, depuis le syllabus officiel)
└── assets/
    └── building/            (images du bâtiment fournies par le créateur)
```

## 8. Modifier les utilisateurs de démonstration

Éditez `data/users.json` (comptes autorisés) et `data/students.json` (profils).
N'ajoutez pas d'emails ou d'informations non fournies par le créateur du projet.

## 9. Ajouter une salle

Ajoutez une entrée dans `data/rooms.json` :
```json
{ "id": "A210", "name": "A210", "block": "A", "floor": 2, "roomNumber": "10" }
```

## 10. Ajouter un enseignant

Ajoutez une entrée dans `data/teachers.json`.

## 11. Ajouter une matière

Ajoutez une entrée dans `data/subjects.json` (matières affichées dans l'EDT),
ou une ECUE dans `data/prepa/semesterX.json` (structure pédagogique Prépa).

## 12. Ajouter / modifier un cours dans l'emploi du temps

Éditez `data/timetable.json`. Chaque séance suit ce format :
```json
{ "id": 19, "day": "monday", "start": "08:00", "end": "09:30",
  "subject": "Analyse 1", "teacher": "S. Rajia", "room": "A206",
  "block": "A", "floor": 2, "type": "CI", "group": "G2" }
```

## 13. Ajouter une publication

Éditez `data/publications.json` à l'emplacement indiqué par le commentaire
`AJOUTER / MODIFIER LES PUBLICATIONS ICI`. Catégories possibles : `information`,
`evenement`, `examen`, `cours`, `administration`, `important`.

## 14. Ajouter un chapitre (Prépa)

Éditez `data/prepa/semester1.json` ou `semester2.json`, dans le tableau
`chapters` de l'ECUE concernée. **Ne modifiez pas les intitulés issus du
syllabus officiel** — ajoutez plutôt les ressources correspondantes (voir ci-dessous).

## 15. Ajouter une vidéo / un exercice / une ressource

Dans le chapitre concerné, complétez le champ `resources` :
```json
"resources": {
  "youtube": [
    { "title": "Cours - Nombres complexes", "type": "youtube", "language": "fr",
      "url": "https://youtube.com/...", "description": "...", "verified": true }
  ],
  "exercises": [], "corrections": [], "documents": [], "td": [], "tp": []
}
```
**N'inventez jamais une URL YouTube.** Si une ressource n'est pas vérifiée,
mettez `"verified": false`.

## 16. Modifier le chatbot

Éditez `data/chatbot.json`. Chaque entrée contient des variantes de questions
(`questions`) en FR/EN/AR et soit une réponse statique (`answerType: "static"`),
soit une clé dynamique traitée dans `js/chatbot.js` (`answerType: "dynamic"`).

## 17. Système de traduction

Toutes les chaînes affichées passent par `js/language.js` (dictionnaires
`I18N.fr`, `I18N.en`, `I18N.ar`) et la fonction `t(clé)`. Le HTML statique
utilise l'attribut `data-i18n="cle"` ; il est traduit automatiquement à chaque
rendu de page via `translateStaticDom()`.

## 18. localStorage

Toutes les données utilisateur (langue, thème, session, favoris, notes,
tâches, progression, historique) sont stockées localement via `js/storage.js`,
sous le préfixe `allezy_isi_`. Rien n'est envoyé à un serveur.

## 19. Limites du projet

- Le site fonctionne **entièrement dans le navigateur**, sans backend.
- Les données affichées (emploi du temps, salles, enseignants) sont des
  **données de démonstration**, reconstruites à partir de documents fournis
  par le créateur du projet — ce ne sont pas des données officielles en temps réel.
- La structure et les chapitres de la Prépa Intégrée proviennent du **plan
  d'études et du syllabus officiels** fournis, mais les liens de ressources
  (vidéos, documents) sont ajoutés progressivement et jamais inventés.
- Les notifications dépendent des capacités du navigateur (elles ne
  fonctionnent pas si le navigateur est fermé).
- Aucun email automatique n'est envoyé : cela nécessiterait un service externe.
- L'authentification est **locale et démonstrative uniquement** — ce n'est pas
  une authentification institutionnelle réelle, aucun mot de passe n'est demandé.

## 20. Équipe

Voir `data/team.json` — fichier facilement modifiable pour ajouter/corriger
les membres et leurs emails (n'ajoutez que des informations fournies).

- Raed Azouzi — mohamedraed.azouzi@etudiant-isi.utm.tn
- Adem Hmila
- Assyl Khamila
- Yassmin Fouratii
- Islem Ayari
- Yakin Mkadem

---

© 2026 Allez-y à l'ISI — Projet indépendant, en cours de développement.
