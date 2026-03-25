function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function resolveAttendanceStatus(db, staffId) {
  const todayKey = getTodayKey();
  const todayRecords = (db.attendanceLogs || [])
    .filter((entry) => Number(entry.staffId) === Number(staffId) && entry.date === todayKey)
    .sort((left, right) => Number(right.id) - Number(left.id));

  if (!todayRecords.length) {
    return "Pending Assignment";
  }

  return todayRecords[0].status || "Pending Assignment";
}

export function syncAttendanceStatuses(db) {
  db.staff = (db.staff || []).map((member) => ({
    ...member,
    attendanceStatus: resolveAttendanceStatus(db, member.id)
  }));

  return db.staff;
}
