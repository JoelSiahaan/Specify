/**
 * App Component
 * 
 * Root application component with global providers.
 * Routing configuration is in routes/router.tsx for better scalability.
 */

import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './presentation/web/contexts';
import { AppRouter } from './presentation/web/routes';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
