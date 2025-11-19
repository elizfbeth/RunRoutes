-- ============================================
-- Add Performance Indexes to Existing Database
-- ============================================
-- This script is safe to run multiple times
-- It only creates indexes that don't already exist
-- ============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Routes table indexes (CRITICAL for performance)
CREATE INDEX IF NOT EXISTS idx_routes_user_id ON routes(user_id);
CREATE INDEX IF NOT EXISTS idx_routes_visibility ON routes(visibility);
CREATE INDEX IF NOT EXISTS idx_routes_distance ON routes(distance);
CREATE INDEX IF NOT EXISTS idx_routes_terrain_type ON routes(terrain_type);
CREATE INDEX IF NOT EXISTS idx_routes_created_at ON routes(created_at);
CREATE INDEX IF NOT EXISTS idx_routes_user_visibility ON routes(user_id, visibility);

-- Favorites table indexes (CRITICAL for performance)
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_route_id ON favorites(route_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_route ON favorites(user_id, route_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at);

-- Update table statistics for query optimizer
ANALYZE users;
ANALYZE routes;
ANALYZE favorites;

-- Show success message
DO $$
BEGIN
  RAISE NOTICE 'Indexes created successfully';
  RAISE NOTICE 'Database optimized for performance';
  RAISE NOTICE '';
  RAISE NOTICE 'Indexes added:';
  RAISE NOTICE '- users: 3 indexes';
  RAISE NOTICE '- routes: 6 indexes';
  RAISE NOTICE '- favorites: 4 indexes';
  RAISE NOTICE '';
  RAISE NOTICE 'Total: 13 indexes for optimal query performance';
END $$;

