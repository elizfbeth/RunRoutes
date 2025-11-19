-- ============================================
-- Database Indexes Only (No Triggers)
-- ============================================
-- Safe to run on existing databases
-- Only adds indexes, skips if they exist
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

-- Update statistics
ANALYZE users;
ANALYZE routes;
ANALYZE favorites;

-- Success message
SELECT 'Database indexes added successfully' AS status;

