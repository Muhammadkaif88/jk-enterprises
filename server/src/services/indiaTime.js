const INDIA_TIME_ZONE = "Asia/Kolkata";

export function getIndiaDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value || "0000";
  const month = parts.find((part) => part.type === "month")?.value || "01";
  const day = parts.find((part) => part.type === "day")?.value || "01";
  return `${year}-${month}-${day}`;
}

export function getIndiaTimeLabel() {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).formatToParts(new Date());

  const hour = parts.find((part) => part.type === "hour")?.value || "12";
  const minute = parts.find((part) => part.type === "minute")?.value || "00";
  const period = (parts.find((part) => part.type === "dayPeriod")?.value || "AM").toUpperCase();
  return `${hour}:${minute} ${period}`;
}

export function parseIndiaTimeLabel(value) {
  const match = String(value || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();

  if (hours === 12) {
    hours = 0;
  }
  if (period === "PM") {
    hours += 12;
  }

  return hours * 60 + minutes;
}

export function formatWorkedDuration(totalMinutes) {
  const safeMinutes = Math.max(0, Number(totalMinutes || 0));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}
