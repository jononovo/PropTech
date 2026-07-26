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
import { CaseFilePage } from './features/case-file/CaseFilePage';
import { ReviewPage } from './features/case-file/review/ReviewPage';
import { LoginPage } from './features/auth/LoginPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { ProfileProvider, useProfileState } from './features/auth/ProfileContext';

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
      <Route path="/login" component={LoginPage} />
      <Route path="/applications">
        {() => (
          <AppShell active="applications">
            <Applications />
          </AppShell>
        )}
      </Route>
      {/* must precede :lens? — "review" is a room, not a lens */}
      <Route path="/applications/:id/review">
        {(params) => <ReviewPage id={params.id} />}
      </Route>
      <Route path="/applications/:id/:lens?">
        {(params) => <CaseFilePage id={params.id} lens={params.lens} />}
      </Route>
      <Route path="/settings">
        {() => (
          <AppShell active="settings">
            <SettingsPage />
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

/** Login gate: no signed-in user -> only the sign-in screen, whatever the URL. */
function Gated() {
  const { profile } = useProfileState();
  if (!profile) return <LoginPage />;
  return <Router />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ProfileProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Gated />
          </WouterRouter>
          <Toaster />
        </ProfileProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
