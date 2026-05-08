# Politique de sécurité

## Versions supportées

Seule la dernière version sur `main` reçoit des correctifs de sécurité.

## Signaler une vulnérabilité

**Ne pas ouvrir d'issue publique pour un problème de sécurité.**

Envoyer un email à : damien.paszkiewicz@live.fr

Inclure :
- La description du problème
- Les étapes pour reproduire
- L'impact potentiel

Une réponse sera apportée sous 72h. Si la vulnérabilité est confirmée, un correctif sera publié et la découverte créditée dans le CHANGELOG.

## Bonnes pratiques

- Ne jamais commiter le fichier `.env` (listé dans `.gitignore`)
- Le token Discord et les credentials de base de données ne doivent apparaître que dans les variables d'environnement
- En production, utiliser des secrets Docker ou un gestionnaire de secrets
