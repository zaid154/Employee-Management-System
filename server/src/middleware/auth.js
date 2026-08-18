import { ApiError } from '../utils/apiError.js';
import { verifyToken } from '../utils/token.js';
import { User } from '../models/User.js';

/**
 * Reads the JWT from the Authorization header (or an `token` cookie), loads the
 * user, and attaches it to `req.user`. Rejects if the token is missing/invalid
 * or the account has been deactivated.
 */
export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
    const token = bearer || req.cookies?.token;
    if (!token) throw ApiError.unauthorized('Please log in to continue');

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub).populate('employee');
    if (!user) throw ApiError.unauthorized('Account no longer exists');
    if (!user.isActive) throw ApiError.forbidden('Your account has been deactivated');

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Session expired, please log in again'));
    }
    next(err);
  }
}

/**
 * Restricts a route to one or more roles.
 * Usage: router.get('/', requireAuth, requireRole('admin', 'hr'), handler)
 */
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden('This action requires a higher access level'));
  }
  next();
};
