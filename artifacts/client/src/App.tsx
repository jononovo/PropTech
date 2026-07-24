import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AppShell } from './components/AppShell';
import { Dashboard } from './features/dashboard/Dashboard';
import { TemplateLibrary } from './features/template-library/TemplateLibrary';
import { TemplateEditor } from './features/template-editor/TemplateEditor';
import { Applications } from './features/intake/Applications';
import { IntakeForm } from './features/intake/IntakeForm';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => (
          <AppShell active="dashboard">
            <Dashboard />
          </AppShell>
        )}
      </Route>
      <Route path="/applications">
        {() => (
          <AppShell active="applications">
            <Applications />
          </AppShell>
        )}
      </Route>
      <Route path="/templates">
        {() => (
          <AppShell active="templates">
            <TemplateLibrary />
          </AppShell>
        )}
      </Route>
      <Route path="/builder/:family/:version" component={TemplateEditor} />
      <Route path="/apply/:applicationId" component={IntakeForm} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
