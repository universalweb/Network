import { loadSheet } from './css-loader.js';
export const baseSheet = await loadSheet(new URL('./base.css', import.meta.url));
