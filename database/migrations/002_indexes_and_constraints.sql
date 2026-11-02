-- ============================================================================
-- JobPilot Migration: 002_indexes_and_constraints.sql
-- Description: Composite and fulltext indexes for high-performance querying
-- Rollback: ALTER TABLE applications DROP INDEX ft_app_search;
-- ============================================================================

USE jobpilot;

-- Add FULLTEXT index on applications for high-efficiency keyword search
ALTER TABLE applications
ADD FULLTEXT INDEX ft_app_search (company_name, job_title, notes);
