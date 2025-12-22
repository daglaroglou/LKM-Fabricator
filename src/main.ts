import './style.css';
import { router } from './router';

const app = document.querySelector<HTMLDivElement>('#app')!;

// Initialize router
router.init(app);

// Handle navigation
window.addEventListener('popstate', () => {
  router.navigate(window.location.pathname);
});
