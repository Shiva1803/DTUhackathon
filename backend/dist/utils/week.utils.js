"use strict";
/**
 * Week calculation utilities using ISO 8601 standard
 * ISO weeks start on Monday and week 1 is the week containing Jan 4
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getISOWeekNumber = getISOWeekNumber;
exports.getISOWeekYear = getISOWeekYear;
exports.getWeekId = getWeekId;
exports.getWeekStartFromWeekNum = getWeekStartFromWeekNum;
exports.getWeekStart = getWeekStart;
exports.getWeekEnd = getWeekEnd;
exports.isDateInWeek = isDateInWeek;
/**
 * Get the ISO week number for a given date
 * @param date - Date to get week number for
 * @returns Week number (1-53)
 */
function getISOWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNum;
}
/**
 * Get the ISO week year (which may differ from calendar year at year boundaries)
 * @param date - Date to get week year for
 * @returns Year number
 */
function getISOWeekYear(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    return d.getUTCFullYear();
}
/**
 * Get week ID in format YYYY-WNN
 * @param date - Date to get week ID for (defaults to current date)
 * @returns Week ID string like "2026-W03"
 */
function getWeekId(date = new Date()) {
    const year = getISOWeekYear(date);
    const week = getISOWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
}
/**
 * Get the Monday (start) of a given ISO week
 * @param year - Year
 * @param week - Week number (1-53)
 * @returns Date representing Monday 00:00:00 UTC of that week
 */
function getWeekStartFromWeekNum(year, week) {
    // Find Jan 4 of the year (always in week 1)
    const jan4 = new Date(Date.UTC(year, 0, 4));
    // Get the Monday of that week
    const dayOfWeek = jan4.getUTCDay() || 7; // Convert Sunday (0) to 7
    const mondayOfWeek1 = new Date(jan4);
    mondayOfWeek1.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);
    // Add (week - 1) * 7 days
    const targetMonday = new Date(mondayOfWeek1);
    targetMonday.setUTCDate(mondayOfWeek1.getUTCDate() + (week - 1) * 7);
    targetMonday.setUTCHours(0, 0, 0, 0);
    return targetMonday;
}
/**
 * Get the Monday (start) of a week from a week ID
 * @param weekId - Week ID in format YYYY-WNN
 * @returns Date representing Monday 00:00:00 UTC
 */
function getWeekStart(weekId) {
    const match = weekId.match(/^(\d{4})-W(\d{2})$/);
    if (!match || !match[1] || !match[2]) {
        throw new Error(`Invalid week ID format: ${weekId}. Expected YYYY-WNN`);
    }
    const year = parseInt(match[1], 10);
    const week = parseInt(match[2], 10);
    if (week < 1 || week > 53) {
        throw new Error(`Invalid week number: ${week}. Must be 1-53`);
    }
    return getWeekStartFromWeekNum(year, week);
}
/**
 * Get the Sunday (end) of a week from a week ID
 * @param weekId - Week ID in format YYYY-WNN
 * @returns Date representing Sunday 23:59:59.999 UTC
 */
function getWeekEnd(weekId) {
    const monday = getWeekStart(weekId);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);
    return sunday;
}
/**
 * Check if a date falls within a specific week
 * @param date - Date to check
 * @param weekId - Week ID to check against
 * @returns true if date is within the week
 */
function isDateInWeek(date, weekId) {
    const weekStart = getWeekStart(weekId);
    const weekEnd = getWeekEnd(weekId);
    const timestamp = date.getTime();
    return timestamp >= weekStart.getTime() && timestamp <= weekEnd.getTime();
}
exports.default = {
    getISOWeekNumber,
    getISOWeekYear,
    getWeekId,
    getWeekStart,
    getWeekEnd,
    getWeekStartFromWeekNum,
    isDateInWeek,
};
//# sourceMappingURL=week.utils.js.map