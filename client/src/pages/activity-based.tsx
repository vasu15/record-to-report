import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Search, UserPlus, CheckCircle, Clock, Send, Activity } from "lucide-react";

function formatAmount(v: number | null | undefined) {
  if (v == null) return "-";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(v);
}

function statusBadge(status: string) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    "Not Assigned": "outline",
    "Assigned": "secondary",
    "Responded": "default",
    "Overdue": "destructive",
    "Approved": "default",
  };
  return <Badge variant={variants[status] || "secondary"} className="text-[10px]">{status}</Badge>;
}

function AssignmentTab() {
  const [search, setSearch] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: lines, isLoading } = useQuery({
    queryKey: ["/api/activity-based"],
    queryFn: () => apiGet<any[]>("/api/activity-based"),
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => apiGet<any[]>("/api/users"),
  });

  const assignMutation = useMutation({
    mutationFn: (data: any) => apiPost("/api/activity-based/assign", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-based"] });
      setAssignOpen(false);
      toast({ title: "Assigned", description: "PO assigned successfully." });
    },
  });

  const filtered = (lines || []).filter((l: any) =>
    !search || l.poNumber?.toLowerCase().includes(search.toLowerCase()) ||
    l.vendorName?.toLowerCase().includes(search.toLowerCase())
  );

  const businessUsers = (users || []).filter((u: any) => u.roles?.includes("Business User"));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="input-search-activity" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Activity className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="text-sm font-medium">No activity-based accruals</h3>
              <p className="text-xs text-muted-foreground mt-1">Upload PO data to see activity items</p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="min-w-[1200px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">PO Number</TableHead>
                      <TableHead className="min-w-[50px]">Line</TableHead>
                      <TableHead className="min-w-[140px]">Vendor</TableHead>
                      <TableHead className="min-w-[180px]">Description</TableHead>
                      <TableHead className="text-right min-w-[100px]">Net Amt</TableHead>
                      <TableHead className="min-w-[80px]">CC</TableHead>
                      <TableHead className="min-w-[120px]">Assigned To</TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                      <TableHead className="min-w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((line: any) => (
                      <TableRow key={line.id}>
                        <TableCell className="font-mono text-xs font-medium">{line.poNumber}</TableCell>
                        <TableCell className="text-xs">{line.poLineItem}</TableCell>
                        <TableCell className="text-xs truncate max-w-[140px]">{line.vendorName}</TableCell>
                        <TableCell className="text-xs truncate max-w-[180px]">{line.itemDescription}</TableCell>
                        <TableCell className="text-right text-xs font-mono">{formatAmount(line.netAmount)}</TableCell>
                        <TableCell className="text-xs font-mono">{line.costCenter}</TableCell>
                        <TableCell className="text-xs">{line.assignedToName || "-"}</TableCell>
                        <TableCell>{statusBadge(line.assignmentStatus || "Not Assigned")}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setSelectedPo(line); setAssignOpen(true); }}
                            data-testid={`button-assign-${line.id}`}
                          >
                            <UserPlus className="h-3.5 w-3.5 mr-1" />
                            Assign
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign PO {selectedPo?.poNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm">
              <p className="text-muted-foreground">Vendor: {selectedPo?.vendorName}</p>
              <p className="text-muted-foreground">Amount: {formatAmount(selectedPo?.netAmount)}</p>
            </div>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger data-testid="select-assign-user">
                <SelectValue placeholder="Select user..." />
              </SelectTrigger>
              <SelectContent>
                {businessUsers.map((u: any) => (
                  <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button
              onClick={() => selectedPo && selectedUser && assignMutation.mutate({ poLineId: selectedPo.id, assignedToUserId: parseInt(selectedUser) })}
              disabled={!selectedUser || assignMutation.isPending}
              data-testid="button-confirm-assign"
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResponseTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/activity-based/responses"],
    queryFn: () => apiGet<any[]>("/api/activity-based/responses"),
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const approveMutation = useMutation({
    mutationFn: (id: number) => apiPut(`/api/activity-based/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-based/responses"] });
      toast({ title: "Approved", description: "Response approved successfully." });
    },
  });

  if (isLoading) return <div className="p-6"><Skeleton className="h-40 w-full" /></div>;

  return (
    <Card>
      <CardContent className="p-0">
        {(data || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <CheckCircle className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-medium">No responses yet</h3>
            <p className="text-xs text-muted-foreground mt-1">Business users haven't submitted responses</p>
          </div>
        ) : (
          <ScrollArea className="w-full">
            <div className="min-w-[1000px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead className="text-right">Provision Amt</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data || []).map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.poNumber}</TableCell>
                      <TableCell className="text-xs">{r.vendorName}</TableCell>
                      <TableCell className="text-right text-xs font-mono">{formatAmount(r.netAmount)}</TableCell>
                      <TableCell className="text-xs">{r.assignedToName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">{r.completionStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono">{formatAmount(r.provisionAmount)}</TableCell>
                      <TableCell className="text-xs truncate max-w-[140px]">{r.comments || "-"}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell>
                        {r.status !== "Approved" && (
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(r.assignmentId)}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${r.id}`}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default function ActivityBasedPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Activity-Based Accruals</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage PO assignments and business user responses</p>
      </div>

      <Tabs defaultValue="assignment">
        <TabsList>
          <TabsTrigger value="assignment" data-testid="tab-assignment">Assignment & Tracking</TabsTrigger>
          <TabsTrigger value="responses" data-testid="tab-responses">Response Summary</TabsTrigger>
        </TabsList>
        <TabsContent value="assignment" className="mt-4">
          <AssignmentTab />
        </TabsContent>
        <TabsContent value="responses" className="mt-4">
          <ResponseTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
