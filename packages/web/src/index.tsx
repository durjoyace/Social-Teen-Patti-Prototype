import './index.css';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { api } from './services/api';
import { analytics } from './services/analytics';
import { errorTracker } from './services/errorTracking';

analytics.init();
errorTracker.init();
api.loadTokens();

const root = createRoot(document.getElementById('root')!);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
