// Polyfill for Node.js modules in browser
import { Buffer } from 'buffer';

window.Buffer = Buffer;
window.global = window;