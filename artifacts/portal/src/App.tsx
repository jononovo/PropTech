import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { TemplateLibrary } from './features/template-library/TemplateLibrary';
import { TemplateEditor } from './features/template-editor/TemplateEditor';
import { Applications } from './features/intake/Applications';
import { IntakeForm } from './features/intake/IntakeForm';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={TemplateLibrary} />
      <Route path="/builder/:family/:version" component={TemplateEditor} />
      <Route path="/applications" component={Applications} />
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
