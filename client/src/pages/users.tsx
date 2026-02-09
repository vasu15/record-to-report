import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserPlus, Pencil, Search, Mail, Phone, Shield, Loader2 } from "lucide-react";

function roleBadgeVariant(role: string): "default" | "secondary" | "outline" {
  if (role === "Finance Admin") return "default";
  if (role === "Finance Approver") return "secondary";
  return "outline";
}

export default function UsersPage() {
  const { isFinanceAdmin } = useAuth();
  const { can } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
    roles: [] as string[], costCenters: "", status: "Active",
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => apiGet<any[]>("/api/users"),
  });

  const createUser = useMutation({
    mutationFn: (data: any) => apiPost("/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDialogOpen(false);
      toast({ title: "User created", description: "New user has been created successfully." });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, ...data }: any) => apiPut(`/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDialogOpen(false);
      toast({ title: "User updated", description: "User details have been updated." });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const openCreate = () => {
    setEditingUser(null);
    setFormData({ name: "", email: "", phone: "", password: "", confirmPassword: "", roles: [], costCenters: "", status: "Active" });
    setDialogOpen(true);
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name, email: user.email, phone: user.phone || "",
      password: "", confirmPassword: "",
      roles: user.roles || [], costCenters: (user.costCenters || []).join(", "),
      status: user.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      return toast({ title: "Error", description: "Name and email are required", variant: "destructive" });
    }
    if (!editingUser && (!formData.password || formData.password !== formData.confirmPassword)) {
      return toast({ title: "Error", description: "Passwords must match", variant: "destructive" });
    }
    if (formData.roles.length === 0) {
      return toast({ title: "Error", description: "At least one role is required", variant: "destructive" });
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      password: formData.password || undefined,
      roles: formData.roles,
      costCenters: formData.costCenters ? formData.costCenters.split(",").map(s => s.trim()).filter(Boolean) : [],
      status: formData.status,
    };

    if (editingUser) {
      updateUser.mutate({ id: editingUser.id, ...payload });
    } else {
      createUser.mutate(payload);
    }
  };

  const toggleRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role],
    }));
  };

  const filtered = (users || []).filter((u: any) =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage users, roles, and cost center assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-48" data-testid="input-search-users" />
          </div>
          {can("users", "canInvite") && (
            <Button onClick={openCreate} data-testid="button-create-user">
              <UserPlus className="mr-1.5 h-4 w-4" />
              Add User
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Users className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="text-sm font-medium">No users found</h3>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Cost Centers</TableHead>
                  <TableHead>Status</TableHead>
                  {can("users", "canEdit") && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {user.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(user.roles || []).map((r: string) => (
                          <Badge key={r} variant={roleBadgeVariant(r)} className="text-[10px]">{r}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(user.costCenters || []).map((cc: string) => (
                          <Badge key={cc} variant="outline" className="text-[10px] font-mono">{cc}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === "Active" ? "default" : "secondary"} className="text-[10px]">
                        {user.status}
                      </Badge>
                    </TableCell>
                    {can("users", "canEdit") && (
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => openEdit(user)} data-testid={`button-edit-user-${user.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Create New User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} data-testid="input-user-name" />
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} disabled={!!editingUser} data-testid="input-user-email" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} data-testid="input-user-phone" />
            </div>
            {!editingUser && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Password *</Label>
                  <Input type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} data-testid="input-user-password" />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm Password *</Label>
                  <Input type="password" value={formData.confirmPassword} onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))} data-testid="input-user-confirm" />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Roles *</Label>
              <div className="flex flex-wrap gap-3">
                {["Finance Admin", "Finance Approver", "Business User"].map(role => (
                  <div key={role} className="flex items-center gap-2">
                    <Checkbox checked={formData.roles.includes(role)} onCheckedChange={() => toggleRole(role)} />
                    <Label className="text-sm cursor-pointer">{role}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Cost Centers (comma-separated)</Label>
              <Input value={formData.costCenters} onChange={e => setFormData(p => ({ ...p, costCenters: e.target.value }))} placeholder="40030403, 40030405" data-testid="input-cost-centers" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
                <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createUser.isPending || updateUser.isPending} data-testid="button-save-user">
              {(createUser.isPending || updateUser.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingUser ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
