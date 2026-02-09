import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast({ title: "Welcome back!", description: "You have been signed in successfully." });
    } catch (err: any) {
      toast({ title: "Sign in failed", description: err.message || "Invalid credentials", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-primary mx-auto">
            <BarChart3 className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Accruals Pro</h1>
          <p className="text-sm text-muted-foreground">Financial Accruals Management System</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <h2 className="text-lg font-semibold text-center">Sign in to your account</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    data-testid="input-password"
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-login">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center mb-3">Demo Credentials</p>
              <div className="grid gap-2 text-xs">
                <button
                  type="button"
                  className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/50 hover-elevate cursor-pointer text-left"
                  onClick={() => { setEmail("admin@company.com"); setPassword("Admin@123"); }}
                  data-testid="button-demo-admin"
                >
                  <span className="font-medium">Finance Admin</span>
                  <span className="text-muted-foreground">admin@company.com</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/50 hover-elevate cursor-pointer text-left"
                  onClick={() => { setEmail("approver@company.com"); setPassword("Approver@123"); }}
                  data-testid="button-demo-approver"
                >
                  <span className="font-medium">Finance Approver</span>
                  <span className="text-muted-foreground">approver@company.com</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/50 hover-elevate cursor-pointer text-left"
                  onClick={() => { setEmail("user@company.com"); setPassword("User@123"); }}
                  data-testid="button-demo-user"
                >
                  <span className="font-medium">Business User</span>
                  <span className="text-muted-foreground">user@company.com</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Secure financial accruals management platform
        </p>
      </div>
    </div>
  );
}
