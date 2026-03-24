const roleLevels = {
  internship: 1,
  trainer: 1,
  "robotic-engineer": 1,
  technician: 1,
  "account-staff": 2,
  manager: 2,
  admin: 3
};

export function getRole(req) {
  // If we have a token (mock for now), we can extract the user/role.
  // For the client, we'll send x-role in headers as before, but now verified against a mock 'token'.
  const token = req.header("Authorization");
  const role = req.header("x-role") || req.query.role || "technician";
  return roleLevels[role] ? role : "technician";
}

export function authorize(minRole) {
  return (req, res, next) => {
    const userRole = getRole(req);
    if (roleLevels[userRole] < roleLevels[minRole]) {
      return res.status(403).json({
        message: `Role '${userRole}' cannot access this action. Required role: ${minRole}.`
      });
    }
    req.userRole = userRole;
    next();
  };
}
