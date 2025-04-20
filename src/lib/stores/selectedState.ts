// $lib/stores/selectedState.ts
import { writable } from "svelte/store";

export const selectedState = writable<string | null>(null);
