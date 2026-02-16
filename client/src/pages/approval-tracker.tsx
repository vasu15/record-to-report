import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Search, Bell, Check, X, Clock, CheckCircle, XCircle, AlertTriangle, Send, Activity, FileText } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

function formatAmount(v: number | null | undefined) {
  if (v == null) return "-";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(v);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    "Pending": "secondary",
    "Approved": "default",
    "Rejected": "destructive",
    "Submitted": "secondary",
    "Assigned": "secondary",
    "Responded": "default",
    "Reviewed": "default",
    "Not Assigned": "outline",
  };
  const variant = map[status] || "secondary";
  const Icon = status === "Pending" || status === "Submitted" || status === "Assigned" ? Clock
    : status === "Approved" || status === "Responded" || status === "Reviewed" ? CheckCircle
    : status === "Rejected" ? XCircle : Clock;
  return (
    <Badge variant={variant} data-testid={`badge-status-${status.toLowerCase().replace(/\s+/g, "-")}`}>
      <Icon className="h-3 w-3 mr-1" />
      {status}
    </Badge>
  );
}

function PeriodApprovals() {
  const { isFinanceAdmin, isFinanceApprover } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canApprove = isFinanceAdmin || isFinanceApprover;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["/api/approvals/tracker"],
    queryFn: () => apiGet<any[]>("/api/approvals/tracker"),
  });

  const nudgeMutation = useMutation({
    mutationFn: (id: number) => apiPost(`/api/approvals/${id}/nudge`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/tracker"] });
      toast({ title: "Nudge sent", description: "Approver has been notified." });
    },
    onError: (err: Error) => toast({ title: "Failed to nudge", description: err.message, variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => apiPut(`/api/approvals/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/tracker"] });
      toast({ title: "Approved", description: "Approval has been recorded." });
    },
    onError: (err: Error) => toast({ title: "Failed to approve", description: err.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => apiPut(`/api/approvals/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/tracker"] });
      setRejectDialogOpen(false);
      setRejectingId(null);
      setRejectionReason("");
      toast({ title: "Rejected", description: "Rejection has been recorded." });
    },
    onError: (err: Error) => toast({ title: "Failed to reject", description: err.message, variant: "destructive" }),
  });

  const filtered = items.filter((item: any) => {
    if (statusFilter !== "all" && item.status.toLowerCase() !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!item.poNumber?.toLowerCase().includes(q) && !item.vendorName?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by PO number or vendor..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" data-testid="input-search-period-approvals" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-status-filter-period">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Line Item</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Cost Center</TableHead>
                <TableHead>Approvers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8" />
                      <p className="text-sm" data-testid="text-no-period-approvals">No period-based approval submissions found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.map((item: any) => (
                <TableRow key={item.id} data-testid={`row-period-approval-${item.id}`}>
                  <TableCell className="font-mono text-xs font-medium">{item.poNumber}</TableCell>
                  <TableCell className="text-xs">{item.poLineItem}</TableCell>
                  <TableCell className="text-xs">{item.vendorName}</TableCell>
                  <TableCell className="text-right text-xs font-mono">{formatAmount(item.netAmount)}</TableCell>
                  <TableCell className="text-xs font-mono">{item.costCenter}</TableCell>
                  <TableCell className="text-xs">{item.approverNames?.length > 0 ? item.approverNames.join(", ") : "-"}</TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                  <TableCell className="text-xs">{formatDate(item.submittedAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {item.status === "Pending" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => nudgeMutation.mutate(item.id)} disabled={nudgeMutation.isPending} data-testid={`button-nudge-${item.id}`}>
                            <Bell className="h-3 w-3 mr-1" />
                            Nudge
                            {item.nudgeCount > 0 && <Badge variant="secondary" className="ml-1 no-default-active-elevate">{item.nudgeCount}</Badge>}
                          </Button>
                          {canApprove && (
                            <>
                              <Button size="icon" variant="ghost" className="text-green-600 dark:text-green-400" onClick={() => approveMutation.mutate(item.id)} disabled={approveMutation.isPending} data-testid={`button-approve-${item.id}`}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { setRejectingId(item.id); setRejectionReason(""); setRejectDialogOpen(true); }} disabled={rejectMutation.isPending} data-testid={`button-reject-${item.id}`}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </>
                      )}
                      {item.status === "Rejected" && item.rejectionReason && (
                        <span className="text-xs text-muted-foreground italic truncate max-w-[120px]" title={item.rejectionReason}>{item.rejectionReason}</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Approval</DialogTitle>
          </DialogHeader>
          <Textarea placeholder="Enter rejection reason..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} data-testid="textarea-rejection-reason" />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} data-testid="button-cancel-reject">Cancel</Button>
            <Button variant="destructive" onClick={() => rejectingId !== null && rejectMutation.mutate({ id: rejectingId, reason: rejectionReason })} disabled={rejectMutation.isPending || !rejectionReason.trim()} data-testid="button-confirm-reject">Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActivityApprovals() {
  const { isFinanceAdmin, isFinanceApprover } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canApprove = isFinanceAdmin || isFinanceApprover;
  const [searchQuery, setSearchQuery] = useState("");

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ["/api/activity-based/responses"],
    queryFn: () => apiGet<any[]>("/api/activity-based/responses"),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => apiPut(`/api/activity-based/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-based/responses"] });
      toast({ title: "Approved", description: "Response approved successfully." });
    },
    onError: (err: Error) => toast({ title: "Failed to approve", description: err.message, variant: "destructive" }),
  });

  const filtered = responses.filter((r: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.poNumber?.toLowerCase().includes(q) || r.vendorName?.toLowerCase().includes(q) || r.assignedToName?.toLowerCase().includes(q);
  });

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by PO, vendor, or user..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" data-testid="input-search-activity-approvals" />
        </div>
      </div>

      <Card>
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Net Amount</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Completion %</TableHead>
                <TableHead className="text-right">Provision Amt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Activity className="h-8 w-8" />
                      <p className="text-sm" data-testid="text-no-activity-approvals">No activity-based responses to review</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.map((r: any) => (
                <TableRow key={r.id} data-testid={`row-activity-approval-${r.id}`}>
                  <TableCell className="font-mono text-xs font-medium">{r.poNumber}</TableCell>
                  <TableCell className="text-xs">{r.vendorName}</TableCell>
                  <TableCell className="text-right text-xs font-mono">{formatAmount(r.netAmount)}</TableCell>
                  <TableCell className="text-xs">{r.assignedToName || "-"}</TableCell>
                  <TableCell className="text-xs">{r.completionPercentage != null ? `${r.completionPercentage}%` : "-"}</TableCell>
                  <TableCell className="text-right text-xs font-mono">{formatAmount(r.provisionAmount)}</TableCell>
                  <TableCell><StatusBadge status={r.status || "Responded"} /></TableCell>
                  <TableCell className="text-xs truncate max-w-[150px]">{r.remarks || r.responseNotes || "-"}</TableCell>
                  <TableCell>
                    {canApprove && (r.status === "Responded" || r.status === "Assigned") && (
                      <Button size="sm" variant="outline" onClick={() => approveMutation.mutate(r.id)} disabled={approveMutation.isPending} data-testid={`button-approve-activity-${r.id}`}>
                        <Check className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                    )}
                    {r.status === "Approved" && (
                      <span className="text-xs text-muted-foreground">Approved</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>
    </div>
  );
}

function NonPoApprovals() {
  const { isFinanceAdmin, isFinanceApprover } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canReview = isFinanceAdmin || isFinanceApprover;
  const [searchQuery, setSearchQuery] = useState("");

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["/api/non-po/submissions"],
    queryFn: () => apiGet<any[]>("/api/non-po/submissions"),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => apiPut(`/api/non-po/submissions/${id}/review`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/non-po/submissions"] });
      toast({ title: "Reviewed", description: "Submission reviewed successfully." });
    },
    onError: (err: Error) => toast({ title: "Failed to review", description: err.message, variant: "destructive" }),
  });

  const filtered = submissions.filter((s: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.formName?.toLowerCase().includes(q) || s.submittedByName?.toLowerCase().includes(q);
  });

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by form name or submitter..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" data-testid="input-search-nonpo-approvals" />
        </div>
      </div>

      <Card>
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form Name</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="h-8 w-8" />
                      <p className="text-sm" data-testid="text-no-nonpo-approvals">No Non-PO submissions to review</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.map((s: any) => {
                const fields = s.standardFields || {};
                return (
                  <TableRow key={s.id} data-testid={`row-nonpo-approval-${s.id}`}>
                    <TableCell className="text-xs font-medium">{s.formName}</TableCell>
                    <TableCell className="text-xs">{s.submittedByName}</TableCell>
                    <TableCell className="text-xs">{s.submissionDate ? formatDate(s.submissionDate) : "-"}</TableCell>
                    <TableCell className="text-xs truncate max-w-[200px]">{fields.description || fields.itemDescription || "-"}</TableCell>
                    <TableCell className="text-right text-xs font-mono">{formatAmount(fields.amount || fields.netAmount)}</TableCell>
                    <TableCell><StatusBadge status={s.status || "Submitted"} /></TableCell>
                    <TableCell>
                      {canReview && s.status === "Submitted" && (
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline" onClick={() => reviewMutation.mutate({ id: s.id, status: "Approved" })} disabled={reviewMutation.isPending} data-testid={`button-approve-nonpo-${s.id}`}>
                            <Check className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => reviewMutation.mutate({ id: s.id, status: "Rejected" })} disabled={reviewMutation.isPending} data-testid={`button-reject-nonpo-${s.id}`}>
                            <X className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      {s.status !== "Submitted" && (
                        <span className="text-xs text-muted-foreground">{s.status}</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>
    </div>
  );
}

export default function ApprovalTrackerPage() {
  const [activeTab, setActiveTab] = useState("period");

  const { data: periodItems = [] } = useQuery({
    queryKey: ["/api/approvals/tracker"],
    queryFn: () => apiGet<any[]>("/api/approvals/tracker"),
  });
  const { data: activityItems = [] } = useQuery({
    queryKey: ["/api/activity-based/responses"],
    queryFn: () => apiGet<any[]>("/api/activity-based/responses"),
  });
  const { data: nonpoItems = [] } = useQuery({
    queryKey: ["/api/non-po/submissions"],
    queryFn: () => apiGet<any[]>("/api/non-po/submissions"),
  });

  const periodPending = periodItems.filter((i: any) => i.status === "Pending").length;
  const activityPending = activityItems.filter((i: any) => i.status === "Responded" || i.status === "Assigned").length;
  const nonpoPending = nonpoItems.filter((i: any) => i.status === "Submitted").length;
  const totalPending = periodPending + activityPending + nonpoPending;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Approval Tracker</h1>
        <p className="text-sm text-muted-foreground" data-testid="text-page-subtitle">
          Track and manage all approval submissions across Period-Based, Activity-Based, and Non-PO accruals
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-all">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <span className="text-sm font-medium text-muted-foreground">Total Items</span>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-all">{periodItems.length + activityItems.length + nonpoItems.length}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-pending-all">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <span className="text-sm font-medium text-muted-foreground">Pending Review</span>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-all">{totalPending}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-period-count">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <span className="text-sm font-medium text-muted-foreground">Period-Based</span>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-period-count">{periodItems.length}</div>
            {periodPending > 0 && <p className="text-xs text-muted-foreground">{periodPending} pending</p>}
          </CardContent>
        </Card>
        <Card data-testid="card-activity-count">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <span className="text-sm font-medium text-muted-foreground">Activity + Non-PO</span>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-activity-nonpo-count">{activityItems.length + nonpoItems.length}</div>
            {(activityPending + nonpoPending) > 0 && <p className="text-xs text-muted-foreground">{activityPending + nonpoPending} pending</p>}
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="tabs-approval-type">
          <TabsTrigger value="period" data-testid="tab-period">
            Period-Based
            {periodPending > 0 && <Badge variant="secondary" className="ml-1.5 no-default-active-elevate">{periodPending}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">
            Activity-Based
            {activityPending > 0 && <Badge variant="secondary" className="ml-1.5 no-default-active-elevate">{activityPending}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="nonpo" data-testid="tab-nonpo">
            Non-PO
            {nonpoPending > 0 && <Badge variant="secondary" className="ml-1.5 no-default-active-elevate">{nonpoPending}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="period" className="mt-4">
          <PeriodApprovals />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <ActivityApprovals />
        </TabsContent>
        <TabsContent value="nonpo" className="mt-4">
          <NonPoApprovals />
        </TabsContent>
      </Tabs>
    </div>
  );
}
