import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/Sidebar";
import DailyLog from "@/pages/DailyLog";
import Inventory from "@/pages/Inventory";
import DoughBatches from "@/pages/DoughBatches";
import FillingBatches from "@/pages/FillingBatches";
import ProductionRuns from "@/pages/ProductionRuns";
import Traceability from "@/pages/Traceability";
import RecallTest from "@/pages/RecallTest";

import AuditLog from "@/pages/AuditLog";

// Placeholder Pages
const PlaceHolder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
    <h1 className="text-2xl font-bold mb-2">{title}</h1>
    <p>This module is under construction.</p>
  </div>
);

import Catalog from "@/pages/Catalog";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DailyLog} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/dough" component={DoughBatches} />
      <Route path="/filling" component={FillingBatches} />
      <Route path="/production" component={ProductionRuns} />
      <Route path="/catalog" component={Catalog} />
      <Route path="/trace" component={Traceability} />
      <Route path="/recall" component={RecallTest} />
      <Route path="/users">
        <PlaceHolder title="User Management" />
      </Route>
      <Route path="/audit" component={AuditLog} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
