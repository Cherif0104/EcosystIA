-- Analyse des politiques RLS actuelles
-- Ce script identifie toutes les politiques restrictives

-- Résumé par table
SELECT 
  tablename,
  COUNT(*) as total_policies,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Politiques les plus restrictives (basées sur owner_id, role, etc.)
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual LIKE '%owner_id%' OR
    qual LIKE '%user_id%' OR
    qual LIKE '%role%' OR
    qual LIKE '%organization_id%' OR
    qual LIKE '%created_by%' OR
    qual LIKE '%auth.uid()%'
  )
ORDER BY tablename, cmd;

-- Tables avec RLS activé
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;

