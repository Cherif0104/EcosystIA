# Guide de Sécurité et Isolation des Utilisateurs

## 🔒 État Actuel de la Sécurité

### ✅ Ce qui est en place

1. **Authentification Supabase**
   - JWT tokens sécurisés
   - Sessions persistantes
   - Logout automatique après inactivité

2. **AuthContext React**
   - User isolé par session
   - Pas de mélange de données utilisateurs

3. **RLS Partiel**
   - Certaines tables ont des politiques RLS
   - Pas complètement configuré

### ⚠️ Ce qui manque

1. **RLS Complet sur toutes les tables**
   - Certaines tables n'ont pas RLS activé
   - Politiques incomplètes pour certains modules

2. **Isolation stricte des données**
   - Les utilisateurs pourraient voir des données d'autres utilisateurs
   - Risque de fuite de données

## 🚀 Solution : Politiques RLS Complètes

### Installation

1. **Accéder au Dashboard Supabase**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Ouvrir l'éditeur SQL**
   - Cliquez sur "SQL Editor" dans le menu de gauche

3. **Exécuter le script**
   - Ouvrez le fichier `scripts/create-complete-rls-policies.sql`
   - Copiez tout le contenu
   - Collez-le dans l'éditeur SQL
   - Cliquez sur "Run" ou appuyez sur Ctrl+Enter

4. **Vérifier les politiques**
   - Allez dans "Authentication" > "Policies"
   - Vous devriez voir toutes les nouvelles politiques

### Ce que fait ce script

Le script crée des politiques RLS pour :

1. **profiles** : Les utilisateurs voient leur propre profil
2. **projects** : Les utilisateurs voient leurs projets + projets de leur équipe
3. **objectives** : Les utilisateurs voient leurs objectifs + objectifs des projets auxquels ils participent
4. **time_logs** : Les utilisateurs voient UNIQUEMENT leurs propres logs
5. **leave_requests** : Les utilisateurs voient leurs demandes + admins voient tout
6. **courses** : Tous les utilisateurs voient les cours publiés
7. **jobs** : Tous les utilisateurs voient les offres publiées
8. **contacts** : Tous les utilisateurs authentifiés peuvent gérer les contacts
9. **invoices** : Tous les utilisateurs authentifiés peuvent gérer les factures
10. **expenses** : Tous les utilisateurs authentifiés peuvent gérer les dépenses

### Tests d'Isolation

Après avoir exécuté le script, testez :

1. **Créer 2 utilisateurs de test**
   ```sql
   -- User 1 : test1@example.com
   -- User 2 : test2@example.com
   ```

2. **Se connecter avec User 1**
   - Créez un projet
   - Créez un log de temps
   - Notez les IDs

3. **Se connecter avec User 2**
   - Vérifiez que vous NE voyez PAS le projet de User 1
   - Vérifiez que vous NE voyez PAS les logs de User 1

4. **Créer un projet partagé**
   - User 1 crée un projet
   - User 1 ajoute User 2 dans `team_members`
   - User 2 se connecte
   - User 2 DEVRAIT voir le projet partagé

### Isolation par Module

#### ✅ Bien Isolé (Après exécution du script)
- **Time Tracking** : Chaque utilisateur voit UNIQUEMENT ses logs
- **Goals/OKRs** : Chaque utilisateur voit ses objectifs + ceux des projets partagés
- **Leave Requests** : Chaque utilisateur voit ses demandes
- **Projects** : Chaque utilisateur voit ses projets + projets de l'équipe

#### ✅ Partagé (Comportement intentionnel)
- **Courses** : Tous les utilisateurs voient les cours publiés
- **Jobs** : Tous les utilisateurs voient les offres publiées
- **Contacts (CRM)** : Tous les utilisateurs peuvent gérer les contacts
- **Finance** : Selon la configuration, peut être partagé

#### ⚠️ Accès Admin
- **User Management** : Seulement admins
- **Course Management** : Seulement admins
- **Job Management** : Seulement admins
- **Leave Management (Admin)** : Seulement admins
- **Analytics** : Seulement admins/managers

### Authentification vs Données

**Authentification** : ✅ Isolé
- Chaque session est indépendante
- Tokens JWT uniques
- Pas de mélange de sessions

**Données** : ⚠️ À renforcer
- Actuellement : certains utilisateurs pourraient voir des données d'autres utilisateurs
- **Après script RLS** : isolation complète des données

## 🔧 Commandes SQL Utiles

### Vérifier si RLS est activé sur une table
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'nom_de_la_table';
```

### Voir toutes les politiques sur une table
```sql
SELECT * 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'nom_de_la_table';
```

### Tester l'isolation
```sql
-- Se connecter en tant qu'utilisateur A
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user_id_A';

-- Voir les données disponibles
SELECT * FROM time_logs;

-- Changer d'utilisateur
SET request.jwt.claim.sub = 'user_id_B';

-- Vérifier que les données sont différentes
SELECT * FROM time_logs;
```

## 📋 Checklist de Sécurité

- [ ] RLS activé sur toutes les tables
- [ ] Politiques SELECT configurées
- [ ] Politiques INSERT configurées
- [ ] Politiques UPDATE configurées
- [ ] Politiques DELETE configurées
- [ ] Tests d'isolation effectués avec 2 utilisateurs
- [ ] Vérification des accès admin
- [ ] Vérification des données partagées (courses, jobs)
- [ ] Documentation mise à jour

## 🎯 Conclusion

**AVANT** : Isolation partielle, risque de fuite de données
**APRÈS** : Isolation complète, sécurisation totale des données utilisateurs

Le script `create-complete-rls-policies.sql` garantit que :
1. Chaque utilisateur ne voit QUE ses propres données
2. Les admins peuvent voir toutes les données
3. Les projets partagés sont correctement gérés
4. Les cours et offres sont publics pour tous

**Recommandation** : Exécuter ce script IMMÉDIATEMENT avant de déployer en production.

