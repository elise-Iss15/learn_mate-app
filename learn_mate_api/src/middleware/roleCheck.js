const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions. Required role: ' + allowedRoles.join(' or ')
      });
    }

    next();
  };
};

const isStudent = authorizeRole('student');


const isTeacher = authorizeRole('teacher');


const isAdmin = authorizeRole('admin');

const isTeacherOrAdmin = authorizeRole('teacher', 'admin');

const isOwnerOrAdmin = (paramName = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const resourceUserId = parseInt(req.params[paramName]);
    const currentUserId = req.user.id;

    // Allow if user is admin or owns the resource
    if (req.user.role === 'admin' || currentUserId === resourceUserId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'You can only access your own resources'
    });
  };
};

module.exports = {
  authorizeRole,
  isStudent,
  isTeacher,
  isAdmin,
  isTeacherOrAdmin,
  isOwnerOrAdmin
};
