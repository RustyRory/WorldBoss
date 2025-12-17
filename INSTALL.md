# INSTALLATION — WorldBoss Discord Bot

--- 

## 🧩 Prérequis

Avant de commencer, assure-toi d’avoir installé :
- Python 3.12+
- pip (installé par défaut avec Python)
- Git
- MySQL ou MariaDB

--- 

## ⚙️ 1. Cloner le projet
```
git clone https://github.com/<ton-username>/WorldBoss.git
cd WorldBoss
```

--- 

## 🧱 2. Créer et activer l’environnement virtuel
```
python3 -m venv .venv
source .venv/bin/activate     # sous Linux / macOS
# ou :
.venv\Scripts\activate        # sous Windows
```

--- 

## 📦 3. Installer les dépendances
```
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 🔐 4. Créer le fichier .env

Crée un fichier .env à la racine du projet (récupérer `.env.example`) :
```
DISCORD_TOKEN=ton_token_discord
DATABASE_URL=mysql+pymysql://user:password@localhost/worldboss
```

> ⚠️ Remplace user, password et worldboss par tes identifiants MySQL réels.

--- 

## 🗄️ 5. Initialiser la base de données
Tu peux créer la base de données manuellement via MySQL :
```
mysql -u root -p
CREATE DATABASE worldboss CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Ensuite, initialise les tables avec le script :
```
PYTHONPATH=src python -m src.database.db_utils init_db
```
Autres commandes : 
```
# Réinitialiser la bdd
PYTHONPATH=src python -m src.database.db_utils reset_db
# Ajouter des données de tests
PYTHONPATH=src python -m src.database.db_utils seed_db
```
---

## 🧪 6. Vérifier la connexion à la base de données
Lance les tests Pytest :
```
PYTHONPATH=src pytest -v
```

Si tout est bon, tu verras ✅ :
tests/test_db.py::test_database_connection PASSED

--- 

## 🤖 7. Lancer le bot
Exécuter le bot :
```
python src/main.py
```

---

## 🧰 8. Développement et Qualité de code
Formatage automatique : black
Vérification de style : flake8

Exécution automatique avant chaque commit :

Le hook pre-commit est déjà configuré.
Il formate et vérifie ton code avant d’accepter le commit :
```
pre-commit run --all-files
```

---

## 🧠 Structure du projet
```
WorldBoss/
│
├── .github/workflows/           # CI/CD
├── .worldboss_data/             # Dossier de sauvegarde
├── src/
│   ├── bot/                     # Code du bot Discord
│   ├── database/                # ORM + connexions SQLAlchemy
│   ├── templates/               # Modèle pour les messages, button, etc.
│   ├── config.py                # Configuration centralisée
│   └── main.py                  # Point d'entrée du projet
│
├── tests/                       # Tests unitaires pytest
│
├── .env.example                 # Exemple de variables d'environnement
├── requirements.txt
├── INSTALL.md                   # Ce guide !
└── README.md                    # Présentation du projet
```
---

## ✅ Vérification rapide
| Commande                     | Action               |
| ---------------------------- | -------------------- |
| `python src/main.py`         | Lance le bot         |
| `pytest -v`                  | Exécute les tests    |
| `black .`                    | Formatte le code     |
| `flake8`                     | Vérifie le style     |
| `pre-commit run --all-files` | Teste tous les hooks |
