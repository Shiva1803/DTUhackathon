/**
 * Week calculation utilities using ISO 8601 standard
 * ISO weeks start on Monday and week 1 is the week containing Jan 4
 */
/**
 * Get the ISO week number for a given date
 * @param date - Date to get week number for
 * @returns Week number (1-53)
 */
export declare function getISOWeekNumber(date: Date): number;
/**
 * Get the ISO week year (which may differ from calendar year at year boundaries)
 * @param date - Date to get week year for
 * @returns Year number
 */
export declare function getISOWeekYear(date: Date): number;
/**
 * Get week ID in format YYYY-WNN
 * @param date - Date to get week ID for (defaults to current date)
 * @returns Week ID string like "2026-W03"
 */
export declare function getWeekId(date?: Date): string;
/**
 * Get the Monday (start) of a given ISO week
 * @param year - Year
 * @param week - Week number (1-53)
 * @returns Date representing Monday 00:00:00 UTC of that week
 */
export declare function getWeekStartFromWeekNum(year: number, week: number): Date;
/**
 * Get the Monday (start) of a week from a week ID
 * @param weekId - Week ID in format YYYY-WNN
 * @returns Date representing Monday 00:00:00 UTC
 */
export declare function getWeekStart(weekId: string): Date;
/**
 * Get the Sunday (end) of a week from a week ID
 * @param weekId - Week ID in format YYYY-WNN
 * @returns Date representing Sunday 23:59:59.999 UTC
 */
export declare function getWeekEnd(weekId: string): Date;
/**
 * Check if a date falls within a specific week
 * @param date - Date to check
 * @param weekId - Week ID to check against
 * @returns true if date is within the week
 */
export declare function isDateInWeek(date: Date, weekId: string): boolean;
declare const _default: {
    getISOWeekNumber: typeof getISOWeekNumber;
    getISOWeekYear: typeof getISOWeekYear;
    getWeekId: typeof getWeekId;
    getWeekStart: typeof getWeekStart;
    getWeekEnd: typeof getWeekEnd;
    getWeekStartFromWeekNum: typeof getWeekStartFromWeekNum;
    isDateInWeek: typeof isDateInWeek;
};
export default _default;
//# sourceMappingURL=week.utils.d.ts.map