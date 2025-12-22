import { HomePage } from './pages/HomePage';
import { MonitorPage } from './pages/MonitorPage';

type Route = {
  path: string | RegExp;
  handler: (container: HTMLElement, params?: Record<string, string>) => void;
};

class Router {
  private routes: Route[] = [];
  private container: HTMLElement | null = null;

  init(container: HTMLElement) {
    this.container = container;
    
    // Register routes
    this.register('/', HomePage);
    this.register(/^\/monitor\/(.+)$/, MonitorPage);

    // Initial navigation
    this.navigate(window.location.pathname);
  }

  register(path: string | RegExp, handler: (container: HTMLElement, params?: Record<string, string>) => void) {
    this.routes.push({ path, handler });
  }

  navigate(path: string) {
    if (!this.container) return;

    // Remove base path if present
    const basePath = '/LKM-Fabricator';
    if (path.startsWith(basePath)) {
      path = path.substring(basePath.length) || '/';
    }

    for (const route of this.routes) {
      if (typeof route.path === 'string') {
        if (route.path === path) {
          route.handler(this.container);
          return;
        }
      } else {
        const match = path.match(route.path);
        if (match) {
          const params = { id: match[1] };
          route.handler(this.container, params);
          return;
        }
      }
    }

    // 404
    this.container.innerHTML = `
      <div class="container">
        <div class="card text-center">
          <h1>404 - Page Not Found</h1>
          <p class="text-secondary mt-2">The page you're looking for doesn't exist.</p>
          <a href="/" class="btn mt-3">Go Home</a>
        </div>
      </div>
    `;
  }
}

export const router = new Router();

export function navigateTo(path: string) {
  const basePath = '/LKM-Fabricator';
  const fullPath = basePath + path;
  window.history.pushState({}, '', fullPath);
  router.navigate(path);
}
