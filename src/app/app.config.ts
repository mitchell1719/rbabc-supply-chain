import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The project was scaffolded without zone.js wired in, which silently
    // breaks change detection for every async data load (Firestore reads
    // resolve, component state updates correctly, but the template never
    // re-renders because nothing tells Angular to check it). Zone.js
    // patches Promise/fetch/XHR/timers so any async completion - including
    // every "await this.service.getX()" call across the app - triggers a
    // change detection pass automatically.
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Routes are lazy-loaded for a small initial bundle, then preloaded in
    // the background after first paint so in-app navigation stays instant.
    provideRouter(routes, withPreloading(PreloadAllModules))
  ]
};
