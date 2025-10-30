-- Script SQL complet pour créer toutes les politiques RLS nécessaires à l'isolation des utilisateurs
-- À exécuter dans l'éditeur SQL de Supabase

-- ============================================
-- 1. TABLE: profiles (Profils utilisateurs)
-- ============================================

-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Politique: Utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Politique: Utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Politique: Admins peuvent voir tous les profils
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role IN ('super_administrator', 'administrator')
  )
);

-- Politique: Création de profil lors de l'inscription
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ============================================
-- 2. TABLE: projects (Projets)
-- ============================================

-- Activer RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Team members can view projects" ON projects;

-- Utilisateurs peuvent voir leurs projets
CREATE POLICY "Users can view their own projects"
ON projects
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- Membres de l'équipe peuvent voir les projets
CREATE POLICY "Team members can view projects"
ON projects
FOR SELECT
TO authenticated
USING (
  auth.uid()::text = ANY(team_members::text[])
);

-- Utilisateurs peuvent créer des projets
CREATE POLICY "Users can create their own projects"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Utilisateurs peuvent modifier leurs projets
CREATE POLICY "Users can update their own projects"
ON projects
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Utilisateurs peuvent supprimer leurs projets
CREATE POLICY "Users can delete their own projects"
ON projects
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- ============================================
-- 3. TABLE: objectives (Objectifs OKRs)
-- ============================================

-- Activer RLS
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view their own objectives" ON objectives;
DROP POLICY IF EXISTS "Users can create their own objectives" ON objectives;
DROP POLICY IF EXISTS "Users can update their own objectives" ON objectives;
DROP POLICY IF EXISTS "Users can delete their own objectives" ON objectives;

-- Utilisateurs peuvent voir leurs objectifs
CREATE POLICY "Users can view their own objectives"
ON objectives
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id::text = objectives.project_id 
    AND (
      projects.owner_id = auth.uid()
      OR auth.uid()::text = ANY(SELECT unnest(projects.team_members::text[]))
    )
  )
);

-- Utilisateurs peuvent créer des objectifs
CREATE POLICY "Users can create their own objectives"
ON objectives
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Utilisateurs peuvent modifier leurs objectifs
CREATE POLICY "Users can update their own objectives"
ON objectives
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Utilisateurs peuvent supprimer leurs objectifs
CREATE POLICY "Users can delete their own objectives"
ON objectives
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- ============================================
-- 4. TABLE: time_logs (Suivi du temps)
-- ============================================

-- Activer RLS
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view their own time logs" ON time_logs;
DROP POLICY IF EXISTS "Users can create their own time logs" ON time_logs;
DROP POLICY IF EXISTS "Users can update their own time logs" ON time_logs;
DROP POLICY IF EXISTS "Users can delete their own time logs" ON time_logs;

-- Utilisateurs peuvent voir leurs logs de temps
CREATE POLICY "Users can view their own time logs"
ON time_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Utilisateurs peuvent créer leurs logs de temps
CREATE POLICY "Users can create their own time logs"
ON time_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Utilisateurs peuvent modifier leurs logs de temps
CREATE POLICY "Users can update their own time logs"
ON time_logs
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Utilisateurs peuvent supprimer leurs logs de temps
CREATE POLICY "Users can delete their own time logs"
ON time_logs
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- 5. TABLE: leave_requests (Demandes de congés)
-- ============================================

-- Activer RLS
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view their own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Users can create their own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Users can update their own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Admins can view all leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Admins can update all leave requests" ON leave_requests;

-- Utilisateurs peuvent voir leurs demandes de congés
CREATE POLICY "Users can view their own leave requests"
ON leave_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins peuvent voir toutes les demandes de congés
CREATE POLICY "Admins can view all leave requests"
ON leave_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role IN ('super_administrator', 'administrator', 'manager')
  )
);

-- Utilisateurs peuvent créer leurs demandes de congés
CREATE POLICY "Users can create their own leave requests"
ON leave_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Utilisateurs peuvent modifier leurs demandes de congés
CREATE POLICY "Users can update their own leave requests"
ON leave_requests
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins peuvent modifier toutes les demandes de congés
CREATE POLICY "Admins can update all leave requests"
ON leave_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role IN ('super_administrator', 'administrator', 'manager')
  )
);

-- ============================================
-- 6. TABLE: courses (Cours)
-- ============================================

-- Activer RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Everyone can view published courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;

-- Tout le monde peut voir les cours publiés
CREATE POLICY "Everyone can view published courses"
ON courses
FOR SELECT
TO authenticated
USING (status = 'published');

-- Admins peuvent gérer tous les cours
CREATE POLICY "Admins can manage courses"
ON courses
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role IN ('super_administrator', 'administrator')
  )
);

-- ============================================
-- 7. TABLE: jobs (Offres d'emploi)
-- ============================================

-- Activer RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Everyone can view published jobs" ON jobs;
DROP POLICY IF EXISTS "Admins can manage jobs" ON jobs;

-- Tout le monde peut voir les offres publiées
CREATE POLICY "Everyone can view published jobs"
ON jobs
FOR SELECT
TO authenticated
USING (status = 'published');

-- Admins peuvent gérer toutes les offres
CREATE POLICY "Admins can manage jobs"
ON jobs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role IN ('super_administrator', 'administrator')
  )
);

-- ============================================
-- 8. TABLE: contacts (CRM)
-- ============================================

-- Activer RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view contacts" ON contacts;
DROP POLICY IF EXISTS "Users can create contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete contacts" ON contacts;

-- Utilisateurs authentifiés peuvent voir tous les contacts
CREATE POLICY "Users can view contacts"
ON contacts
FOR SELECT
TO authenticated
USING (true);

-- Utilisateurs authentifiés peuvent créer des contacts
CREATE POLICY "Users can create contacts"
ON contacts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Utilisateurs authentifiés peuvent modifier les contacts
CREATE POLICY "Users can update contacts"
ON contacts
FOR UPDATE
TO authenticated
USING (true);

-- Utilisateurs authentifiés peuvent supprimer les contacts
CREATE POLICY "Users can delete contacts"
ON contacts
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 9. TABLE: invoices (Factures)
-- ============================================

-- Activer RLS (si la table existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
        ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view their invoices" ON invoices;
        DROP POLICY IF EXISTS "Users can create invoices" ON invoices;
        DROP POLICY IF EXISTS "Users can update invoices" ON invoices;
        DROP POLICY IF EXISTS "Users can delete invoices" ON invoices;
        
        CREATE POLICY "Users can view their invoices"
        ON invoices FOR SELECT TO authenticated USING (true);
        
        CREATE POLICY "Users can create invoices"
        ON invoices FOR INSERT TO authenticated WITH CHECK (true);
        
        CREATE POLICY "Users can update invoices"
        ON invoices FOR UPDATE TO authenticated USING (true);
        
        CREATE POLICY "Users can delete invoices"
        ON invoices FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- ============================================
-- 10. TABLE: expenses (Dépenses)
-- ============================================

-- Activer RLS (si la table existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'expenses') THEN
        ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view expenses" ON expenses;
        DROP POLICY IF EXISTS "Users can create expenses" ON expenses;
        DROP POLICY IF EXISTS "Users can update expenses" ON expenses;
        DROP POLICY IF EXISTS "Users can delete expenses" ON expenses;
        
        CREATE POLICY "Users can view expenses"
        ON expenses FOR SELECT TO authenticated USING (true);
        
        CREATE POLICY "Users can create expenses"
        ON expenses FOR INSERT TO authenticated WITH CHECK (true);
        
        CREATE POLICY "Users can update expenses"
        ON expenses FOR UPDATE TO authenticated USING (true);
        
        CREATE POLICY "Users can delete expenses"
        ON expenses FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- ============================================
-- MESSAGE DE RÉUSSITE
-- ============================================

SELECT '✅ Toutes les politiques RLS ont été créées avec succès!' as message;

