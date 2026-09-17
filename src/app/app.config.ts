import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Routes are lazy-loaded for a small initial bundle, then preloaded in
    // the background after first paint so in-app navigation stays instant.
    provideRouter(routes, withPreloading(PreloadAllModules))
  ]
};
