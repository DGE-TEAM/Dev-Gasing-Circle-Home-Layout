// ─────────────────────────────────────────────────────────────
// gc-calendar.js — Calendar grid HTML builder
// ─────────────────────────────────────────────────────────────

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function buildCalendarHTML(year, month, rangeStart, rangeEnd) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  let html = `<div class="gc-calendar"><div class="gc-cal-header">${MONTH_NAMES[month]} ${year}</div><div class="gc-cal-grid">`;

  DOW.forEach((d) => {
    html += `<div class="gc-cal-dow">${d}</div>`;
  });

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="gc-cal-day other-month"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const ts = new Date(year, month, day).getTime();
    let cls = "gc-cal-day";

    if (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    ) {
      cls += " today";
    }
    if (rangeStart && Math.abs(ts - rangeStart) < 86400000) cls += " range-start";
    if (rangeEnd && Math.abs(ts - rangeEnd) < 86400000) cls += " range-end";
    if (rangeStart && rangeEnd && ts > rangeStart && ts < rangeEnd) cls += " in-range";

    html += `<div class="${cls}" data-ts="${ts}">${day}</div>`;
  }

  html += `</div></div>`;
  return html;
}
