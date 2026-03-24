import { readDb } from "../data/store.js";

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
    const currentUserEmail = String(req.header("x-user-email") || "").trim().toLowerCase();

    if (!currentUserEmail) {
      return res.status(401).json({
        message: "Your session is no longer valid. Please log in again."
      });
    }

    const db = readDb();
    const currentUser = db.users.find(
      (entry) => String(entry.email || "").trim().toLowerCase() === currentUserEmail
    );

    if (!currentUser || currentUser.approvalStatus !== "approved") {
      return res.status(401).json({
        message: "Your account has been removed or access was changed. Please log in again."
      });
    }

    if (roleLevels[userRole] < roleLevels[minRole]) {
      return res.status(403).json({
        message: `Role '${userRole}' cannot access this action. Required role: ${minRole}.`
      });
    }
    req.userRole = userRole;
    next();
  };
}
