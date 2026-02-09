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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText, Plus, Send, CheckCircle, Eye, Layout, Loader2
} from "lucide-react";

function formatAmount(v: number | null | undefined) {
  if (v == null) return "-";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(v);
}

function FormBuilder() {
  const { can } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formName, setFormName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const defaultFields = [
    { key: "vendorName", label: "Vendor Name", visible: true, required: true },
    { key: "serviceDescription", label: "Service Description", visible: true, required: false },
    { key: "provisionAmount", label: "Provision Amount", visible: true, required: true },
    { key: "glAccount", label: "GL Account", visible: true, required: false },
    { key: "costCenter", label: "Cost Center", visible: true, required: false },
    { key: "profitCenter", label: "Profit Center", visible: false, required: false },
    { key: "plant", label: "Plant", visible: false, required: false },
  ];

  const [fields, setFields] = useState(defaultFields);

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => apiGet<any[]>("/api/users"),
  });

  const createForm = useMutation({
    mutationFn: (data: any) => apiPost("/api/non-po/forms", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/non-po/forms"] });
      toast({ title: "Form created", description: "Non-PO form created and sent to users." });
      setFormName("");
      setDescription("");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const businessUsers = (users || []).filter((u: any) => u.roles?.includes("Business User"));

  const handleSubmit = () => {
    if (!formName) return toast({ title: "Error", description: "Form name is required", variant: "destructive" });
    const fieldConfig = {
      defaultFields: Object.fromEntries(fields.map(f => [f.key, { visible: f.visible, required: f.required }])),
      customFields: [],
    };
    createForm.mutate({
      formName,
      description,
      dueDate: dueDate || null,
      priority,
      fieldConfiguration: fieldConfig,
      assignedUserIds: selectedUsers,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-sm font-semibold">Form Configuration</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Form Name</Label>
            <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., Monthly Consulting Accrual" data-testid="input-form-name" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Form description..." rows={2} data-testid="input-form-desc" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} data-testid="input-due-date" />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger data-testid="select-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fields</Label>
            <div className="space-y-2 border rounded-md p-3">
              {fields.map((f, idx) => (
                <div key={f.key} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={f.visible}
                      onCheckedChange={(v) => {
                        const copy = [...fields];
                        copy[idx] = { ...copy[idx], visible: !!v };
                        setFields(copy);
                      }}
                    />
                    <span className="text-sm">{f.label}</span>
                  </div>
                  {f.visible && (
                    <Badge
                      variant={f.required ? "default" : "secondary"}
                      className="text-[10px] cursor-pointer"
                      onClick={() => {
                        const copy = [...fields];
                        copy[idx] = { ...copy[idx], required: !copy[idx].required };
                        setFields(copy);
                      }}
                    >
                      {f.required ? "Required" : "Optional"}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assign to Users</Label>
            <div className="space-y-1.5 border rounded-md p-3 max-h-32 overflow-y-auto">
              {businessUsers.map((u: any) => (
                <div key={u.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedUsers.includes(u.id)}
                    onCheckedChange={(v) => {
                      setSelectedUsers(prev => v ? [...prev, u.id] : prev.filter(id => id !== u.id));
                    }}
                  />
                  <span className="text-sm">{u.name}</span>
                  <span className="text-xs text-muted-foreground">({u.email})</span>
                </div>
              ))}
            </div>
          </div>

          {can("non_po", "canCreate") && (
            <Button className="w-full" onClick={handleSubmit} disabled={createForm.isPending} data-testid="button-create-form">
              {createForm.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Create & Send Form
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-sm font-semibold">Form Preview</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 p-4 border rounded-md bg-muted/20">
            <h4 className="font-semibold">{formName || "Untitled Form"}</h4>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            <div className="space-y-3 pt-2">
              {fields.filter(f => f.visible).map(f => (
                <div key={f.key} className="space-y-1">
                  <Label className="text-xs">
                    {f.label} {f.required && <span className="text-destructive">*</span>}
                  </Label>
                  <Input disabled placeholder={`Enter ${f.label.toLowerCase()}...`} />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SubmissionsTab() {
  const { can } = usePermissions();
  const { data, isLoading } = useQuery({
    queryKey: ["/api/non-po/submissions"],
    queryFn: () => apiGet<any[]>("/api/non-po/submissions"),
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const approveMutation = useMutation({
    mutationFn: (id: number) => apiPut(`/api/non-po/submissions/${id}/review`, { status: "Approved" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/non-po/submissions"] });
      toast({ title: "Approved", description: "Submission approved." });
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <Card>
      <CardContent className="p-0">
        {(data || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-medium">No submissions yet</h3>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form Name</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data || []).map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm font-medium">{s.formName}</TableCell>
                  <TableCell className="text-sm">{s.submittedByName}</TableCell>
                  <TableCell className="text-xs">{new Date(s.submissionDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatAmount(s.standardFields?.provisionAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "Approved" ? "default" : "secondary"} className="text-[10px]">{s.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {s.status !== "Approved" && can("non_po", "canApprove") && (
                      <Button size="sm" onClick={() => approveMutation.mutate(s.id)} disabled={approveMutation.isPending} data-testid={`button-approve-${s.id}`}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Approve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default function NonPoPage() {
  const { isFinanceAdmin } = useAuth();
  const { can } = usePermissions();

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Non-PO Accruals</h1>
        <p className="text-sm text-muted-foreground mt-1">Create and manage ad-hoc accrual forms</p>
      </div>

      <Tabs defaultValue={isFinanceAdmin ? "builder" : "submissions"}>
        <TabsList>
          {isFinanceAdmin && <TabsTrigger value="builder" data-testid="tab-builder">Form Builder</TabsTrigger>}
          <TabsTrigger value="submissions" data-testid="tab-submissions">Submissions</TabsTrigger>
        </TabsList>
        {isFinanceAdmin && (
          <TabsContent value="builder" className="mt-4">
            <FormBuilder />
          </TabsContent>
        )}
        <TabsContent value="submissions" className="mt-4">
          <SubmissionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
