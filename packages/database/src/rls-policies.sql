-- ============================================
-- AIAG Marketplace - Row Level Security Policies
-- ============================================
-- Apply with: psql -d your_database -f rls-policies.sql
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE
-- ============================================

-- Users can only see their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (id = auth.uid());

-- Users can only update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (id = auth.uid());

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================

-- Public organizations can be seen by anyone
-- Private organizations only by members
CREATE POLICY "organizations_select" ON organizations
  FOR SELECT
  USING (
    is_public = true
    OR id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Only owners can update organization
CREATE POLICY "organizations_update" ON organizations
  FOR UPDATE
  USING (owner_id = auth.uid());

-- Only owners can delete organization
CREATE POLICY "organizations_delete" ON organizations
  FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================
-- ORGANIZATION MEMBERS TABLE
-- ============================================

-- Members can see other members of their organization
CREATE POLICY "org_members_select" ON organization_members
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Only admins/owners can add members
CREATE POLICY "org_members_insert" ON organization_members
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Only admins/owners can remove members
CREATE POLICY "org_members_delete" ON organization_members
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- AI MODELS TABLE
-- ============================================

-- Public models can be seen by anyone
-- Private models only by owner or org members
CREATE POLICY "ai_models_select" ON ai_models
  FOR SELECT
  USING (
    (is_public = true AND status = 'published')
    OR owner_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Only owner can update their models
CREATE POLICY "ai_models_update" ON ai_models
  FOR UPDATE
  USING (owner_id = auth.uid());

-- Only owner can delete their models
CREATE POLICY "ai_models_delete" ON ai_models
  FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================

-- Users can only see their own subscriptions
CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own subscriptions
CREATE POLICY "subscriptions_insert_own" ON subscriptions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own subscriptions (cancel, etc.)
CREATE POLICY "subscriptions_update_own" ON subscriptions
  FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- API KEYS TABLE
-- ============================================

-- Users can only see their own API keys
CREATE POLICY "api_keys_select_own" ON api_keys
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own API keys
CREATE POLICY "api_keys_insert_own" ON api_keys
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can revoke their own API keys
CREATE POLICY "api_keys_update_own" ON api_keys
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own API keys
CREATE POLICY "api_keys_delete_own" ON api_keys
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- API USAGE LOGS TABLE
-- ============================================

-- Users can see their own usage logs
-- Model owners can see logs for their models
CREATE POLICY "api_usage_logs_select" ON api_usage_logs
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR model_id IN (
      SELECT id FROM ai_models WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- PAYMENTS TABLE
-- ============================================

-- Users can only see their own payments
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

-- Users can only see their own notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can mark their notifications as read
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- HELPER FUNCTION: Get current user ID
-- ============================================
-- This function should be defined based on your auth system
-- For NextAuth, you might use a different approach

-- CREATE OR REPLACE FUNCTION auth.uid()
-- RETURNS uuid AS $$
--   SELECT COALESCE(
--     current_setting('request.jwt.claims', true)::json->>'sub',
--     current_setting('app.current_user_id', true)
--   )::uuid;
-- $$ LANGUAGE SQL STABLE;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions to authenticated users
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- NOTES:
-- ============================================
-- 1. The auth.uid() function should return the current user's ID
-- 2. Adjust policies based on your specific requirements
-- 3. Test policies thoroughly before deploying to production
-- 4. Consider using Supabase's built-in auth functions if using Supabase
