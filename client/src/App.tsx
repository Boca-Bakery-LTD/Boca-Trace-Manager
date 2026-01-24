import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/Sidebar";
import Dashboard from "@/pages/Dashboard";
import Traceability from "@/pages/Traceability";
import Inventory from "@/pages/Inventory";
import { Button } from "@/components/ui/button";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/trace" component={Traceability} />
      <Route path="/inventory" component={Inventory} />
      {/* Fallbacks for unfinished pages to avoid 404 for nav demo */}
      <Route path="/production">
        <div className="p-8 text-center text-muted-foreground">Production Module Placeholder</div>
      </Route>
      <Route path="/recalls">
        <div className="p-8 text-center text-muted-foreground">Recall Management Placeholder</div>
      </Route>
      <Route path="/master-data">
        <div className="p-8 text-center text-muted-foreground">Master Data Placeholder</div>
      </Route>
      <Route path="/settings">
        <div className="p-8 text-center text-muted-foreground">Settings Placeholder</div>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  
  // Minimal "Login" check mock - could add a real login screen but for now just show app
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background font-sans text-foreground flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto h-screen w-full transition-all duration-300 ease-in-out">
           <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            <Router />
           </div>
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
