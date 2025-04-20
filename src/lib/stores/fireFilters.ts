import { writable } from 'svelte/store';

export const yearRange = writable<[number, number]>([2004, 2015]);
export const selectedCauses = writable<string[]>([]);  // e.g. ["Lightning", "Debris Burning"]
export const selectedState = writable("None");
export const hoveredMonth = writable<number | null>(null);
export const selectedMonth = writable<number | null>(null);
export const selectedMonthYear = writable<{ month: number; year: number } | null>(null);


