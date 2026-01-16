import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Enhanced class merging utility
 * Combines clsx for conditional classes with tailwind-merge for handling conflicts
 * 
 * @param inputs - List of class names, objects, or arrays
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
