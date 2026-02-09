import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import PeriodBasedPage from "@/pages/period-based";
import ActivityBasedPage from "@/pages/activity-based";
import MyTasksPage from "@/pages/my-tasks";
import NonPoPage from "@/pages/non-po";
import MyFormsPage from "@/pages/my-forms";
import ApprovalRulesPage from "@/pages/approval-rules";
import UsersPage from "@/pages/users";
import ReportsPage from "@/pages/reports";
import ConfigurationPage from "@/pages/configuration";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component, roles }: { component: React.ComponentType; roles?: string[] }) {
  const { user, hasAnyRole } = useAuth();
  if (!user) return <Redirect to="/" />;
  if (roles && !hasAnyRole(roles)) return <Redirect to="/dashboard" />;
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Switch>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={DashboardPage} />
      </Route>
      <Route path="/period-based">
        <ProtectedRoute component={PeriodBasedPage} roles={["Finance Admin", "Finance Approver"]} />
      </Route>
      <Route path="/activity-based">
        <ProtectedRoute component={ActivityBasedPage} roles={["Finance Admin", "Finance Approver"]} />
      </Route>
      <Route path="/my-tasks">
        <ProtectedRoute component={MyTasksPage} roles={["Business User"]} />
      </Route>
      <Route path="/non-po">
        <ProtectedRoute component={NonPoPage} roles={["Finance Admin", "Finance Approver"]} />
      </Route>
      <Route path="/my-forms">
        <ProtectedRoute component={MyFormsPage} roles={["Business User"]} />
      </Route>
      <Route path="/approval-rules">
        <ProtectedRoute component={ApprovalRulesPage} roles={["Finance Admin", "Finance Approver"]} />
      </Route>
      <Route path="/users">
        <ProtectedRoute component={UsersPage} roles={["Finance Admin", "Finance Approver"]} />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={ReportsPage} roles={["Finance Admin", "Finance Approver"]} />
      </Route>
      <Route path="/configuration">
        <ProtectedRoute component={ConfigurationPage} roles={["Finance Admin", "Finance Approver"]} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <AppRoutes />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
