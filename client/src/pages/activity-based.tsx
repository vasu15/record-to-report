import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useProcessingMonth } from "@/contexts/ProcessingMonthContext";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, UserPlus, CheckCircle, Clock, Send, Activity, Calculator, Pencil, Info, ArrowRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { DialogDescription } from "@/components/ui/dialog";

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
  const { can } = usePermissions();
  const { processingMonth, prevMonthLabel, monthLabel } = useProcessingMonth();
  const [search, setSearch] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalLine, setEditModalLine] = useState<any>(null);
  const [modalCategory, setModalCategory] = useState("");
  const [modalAssignUser, setModalAssignUser] = useState("");
  const [modalPrevTrueUp, setModalPrevTrueUp] = useState("0");
  const [modalCurTrueUp, setModalCurTrueUp] = useState("0");
  const [modalRemarks, setModalRemarks] = useState("");
  const [modalStartDate, setModalStartDate] = useState("");
  const [modalEndDate, setModalEndDate] = useState("");
  const [categoryDateDialogOpen, setCategoryDateDialogOpen] = useState(false);
  const [pendingCategoryLine, setPendingCategoryLine] = useState<any>(null);
  const [catStartDate, setCatStartDate] = useState("");
  const [catEndDate, setCatEndDate] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: lines, isLoading } = useQuery({
    queryKey: ["/api/activity-based", processingMonth],
    queryFn: () => apiGet<any[]>(`/api/activity-based?processingMonth=${encodeURIComponent(processingMonth)}`),
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => apiGet<any[]>("/api/users"),
  });

  const assignMutation = useMutation({
    mutationFn: (data: any) => apiPost("/api/activity-based/assign", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-based", processingMonth] });
      setAssignOpen(false);
      toast({ title: "Assigned", description: "PO assigned successfully." });
    },
  });

  const categoryMutation = useMutation({
    mutationFn: ({ id, category, startDate, endDate }: { id: number; category: string; startDate?: string; endDate?: string }) =>
      apiPut(`/api/po-lines/${id}/category`, { category, startDate, endDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-based", processingMonth] });
      queryClient.invalidateQueries({ queryKey: ["/api/period-based"] });
      toast({ title: "Updated", description: "Category updated successfully." });
    },
  });

  const filtered = (lines || []).filter((l: any) =>
    !search || l.poNumber?.toLowerCase().includes(search.toLowerCase()) ||
    l.vendorName?.toLowerCase().includes(search.toLowerCase())
  );

  const businessUsers = (users || []).filter((u: any) => u.roles?.includes("Business User"));

  const openEditModal = (line: any) => {
    setEditModalLine(line);
    setModalCategory(line.category || "Activity");
    setModalAssignUser(line.assignedToUserId ? String(line.assignedToUserId) : "");
    setModalPrevTrueUp(String(line.prevMonthTrueUp || 0));
    setModalCurTrueUp(String(line.currentMonthTrueUp || 0));
    setModalRemarks(line.remarks || "");
    setModalStartDate(line.startDate || "");
    setModalEndDate(line.endDate || "");
    setEditModalOpen(true);
  };

  const handleInlineCategorySwitch = (line: any, newCategory: string) => {
    if (newCategory === "Period" && (!line.startDate || !line.endDate)) {
      setPendingCategoryLine(line);
      setCatStartDate(line.startDate || "");
      setCatEndDate(line.endDate || "");
      setCategoryDateDialogOpen(true);
    } else {
      categoryMutation.mutate({ id: line.id, category: newCategory, startDate: line.startDate, endDate: line.endDate } as any);
    }
  };

  const confirmCategoryWithDates = async () => {
    if (!pendingCategoryLine || !catStartDate || !catEndDate) return;
    try {
      await apiPut(`/api/po-lines/${pendingCategoryLine.id}/category`, {
        category: "Period",
        startDate: catStartDate,
        endDate: catEndDate,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-based", processingMonth] });
      queryClient.invalidateQueries({ queryKey: ["/api/period-based"] });
      setCategoryDateDialogOpen(false);
      setPendingCategoryLine(null);
      toast({ title: "Updated", description: "Moved to Period-Based with dates." });
    } catch {
      toast({ title: "Error", description: "Failed to switch category.", variant: "destructive" });
    }
  };

  const getModalCalcPreview = () => {
    if (!editModalLine) return null;
    const start = modalStartDate ? new Date(modalStartDate) : null;
    const end = modalEndDate ? new Date(modalEndDate) : null;
    const hasDates = !!(start && end && !isNaN(start.getTime()) && !isNaN(end.getTime()));

    if (!hasDates) {
      return { hasDates: false, finalProvision: editModalLine.currentMonthGrn || 0 };
    }

    const totalDays = Math.max(1, Math.ceil((end!.getTime() - start!.getTime()) / 86400000) + 1);
    const dailyRate = (editModalLine.netAmount || 0) / totalDays;
    const prevProvision = editModalLine.prevMonthDays != null
      ? Math.round(dailyRate * editModalLine.prevMonthDays)
      : editModalLine.prevMonthProvision || 0;
    const sugProvision = editModalLine.currentMonthDays != null
      ? Math.round(dailyRate * editModalLine.currentMonthDays)
      : editModalLine.suggestedProvision || 0;
    const prevTU = parseFloat(modalPrevTrueUp) || 0;
    const curTU = parseFloat(modalCurTrueUp) || 0;
    const cf = prevProvision + prevTU - (editModalLine.prevMonthGrn || 0);
    const fp = Math.round(cf + sugProvision - (editModalLine.currentMonthGrn || 0) + curTU);

    return {
      hasDates: true,
      totalDays,
      dailyRate: Math.round(dailyRate),
      prevProvision,
      sugProvision,
      prevTU,
      curTU,
      carryForward: Math.round(cf),
      finalProvision: fp,
    };
  };

  const saveEditModal = async () => {
    if (!editModalLine) return;
    try {
      if (modalStartDate !== (editModalLine.startDate || "") || modalEndDate !== (editModalLine.endDate || "")) {
        await apiPut(`/api/po-lines/${editModalLine.id}/dates`, {
          startDate: modalStartDate,
          endDate: modalEndDate,
        });
      }
      const prevTU = parseFloat(modalPrevTrueUp) || 0;
      const curTU = parseFloat(modalCurTrueUp) || 0;
      if (prevTU !== (editModalLine.prevMonthTrueUp || 0)) {
        await apiPut(`/api/activity-based/${editModalLine.id}/true-up`, { field: "prevMonthTrueUp", value: prevTU });
      }
      if (curTU !== (editModalLine.currentMonthTrueUp || 0)) {
        await apiPut(`/api/activity-based/${editModalLine.id}/true-up`, { field: "currentMonthTrueUp", value: curTU });
      }
      if (modalRemarks !== (editModalLine.remarks || "")) {
        await apiPut(`/api/activity-based/${editModalLine.id}/remarks`, { remarks: modalRemarks });
      }
      if (modalCategory !== (editModalLine.category || "Activity")) {
        if (modalCategory === "Period" && (!modalStartDate || !modalEndDate)) {
          toast({ title: "Dates required", description: "Start and end dates are required to switch to Period-Based.", variant: "destructive" });
          return;
        }
        await apiPut(`/api/po-lines/${editModalLine.id}/category`, {
          category: modalCategory,
          startDate: modalStartDate || editModalLine.startDate,
          endDate: modalEndDate || editModalLine.endDate,
        });
      }
      if (modalAssignUser && modalAssignUser !== String(editModalLine.assignedToUserId || "")) {
        await apiPost("/api/activity-based/assign", { poLineId: editModalLine.id, assignedToUserId: parseInt(modalAssignUser) });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/activity-based"] });
      queryClient.invalidateQueries({ queryKey: ["/api/period-based"] });
      setEditModalOpen(false);
      toast({ title: "Saved", description: "All changes saved successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
    }
  };

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
              <div className="min-w-[1600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">PO Number</TableHead>
                      <TableHead className="min-w-[50px]">Line</TableHead>
                      <TableHead className="min-w-[140px]">Vendor</TableHead>
                      <TableHead className="min-w-[160px]">Description</TableHead>
                      <TableHead className="text-right min-w-[100px]">Net Amt</TableHead>
                      <TableHead className="min-w-[80px]">
                        <Tooltip>
                          <TooltipTrigger asChild><span className="cursor-help">GL</span></TooltipTrigger>
                          <TooltipContent>GL Account code</TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="min-w-[80px]">
                        <Tooltip>
                          <TooltipTrigger asChild><span className="cursor-help">CC</span></TooltipTrigger>
                          <TooltipContent>Cost Center code</TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="min-w-[80px]">Plant</TableHead>
                      <TableHead className="min-w-[90px]">Start Date</TableHead>
                      <TableHead className="min-w-[90px]">End Date</TableHead>
                      <TableHead className="text-right min-w-[80px] bg-muted/30">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 italic cursor-help">
                              <Calculator className="h-3 w-3" />
                              Prev GRN
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>GRN value from previous month (derived)</TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="text-right min-w-[80px] bg-accent/30">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 italic cursor-help">
                              <Calculator className="h-3 w-3" />
                              Cur GRN
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>GRN value for current processing month (derived)</TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="text-right min-w-[90px] bg-accent/30">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 italic cursor-help">
                              <Calculator className="h-3 w-3" />
                              Total GRN
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Cumulative GRN value to date (derived)</TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="text-right min-w-[100px] bg-primary/10">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 italic cursor-help font-semibold">
                              <Calculator className="h-3 w-3" />
                              Final Prov.
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Final provision: includes carry-forward, true-ups, and GRN when dates are set</TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="min-w-[120px]">
                        <Tooltip>
                          <TooltipTrigger asChild><span className="cursor-help">Assigned To</span></TooltipTrigger>
                          <TooltipContent>Business user assigned to verify this PO</TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="min-w-[90px]">Status</TableHead>
                      <TableHead className="min-w-[100px]">Category</TableHead>
                      <TableHead className="min-w-[80px]">Actions</TableHead>
                      {can("activity_based", "canEdit") && (
                        <TableHead className="min-w-[50px] text-center">Edit</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((line: any) => (
                      <TableRow key={line.id} data-testid={`row-activity-${line.id}`}>
                        <TableCell className="font-mono text-xs font-medium">{line.poNumber}</TableCell>
                        <TableCell className="text-xs">{line.poLineItem}</TableCell>
                        <TableCell className="text-xs truncate max-w-[140px]">{line.vendorName}</TableCell>
                        <TableCell className="text-xs truncate max-w-[160px]">{line.itemDescription}</TableCell>
                        <TableCell className="text-right text-xs font-mono">{formatAmount(line.netAmount)}</TableCell>
                        <TableCell className="text-xs font-mono">{line.glAccount || "-"}</TableCell>
                        <TableCell className="text-xs font-mono">{line.costCenter}</TableCell>
                        <TableCell className="text-xs">{line.plant || "-"}</TableCell>
                        <TableCell className="text-xs font-mono">{line.startDate || "-"}</TableCell>
                        <TableCell className="text-xs font-mono">{line.endDate || "-"}</TableCell>
                        <TableCell className="text-right text-xs font-mono bg-muted/10">{formatAmount(line.prevMonthGrn)}</TableCell>
                        <TableCell className="text-right text-xs font-mono bg-accent/10">{formatAmount(line.currentMonthGrn)}</TableCell>
                        <TableCell className="text-right text-xs font-mono bg-accent/10">{formatAmount(line.totalGrnToDate)}</TableCell>
                        <TableCell className={`text-right text-xs font-mono font-medium bg-primary/5 ${line.finalProvision < 0 ? "text-destructive" : ""}`}>{formatAmount(line.finalProvision)}</TableCell>
                        <TableCell className="text-xs">{line.assignedToName || "-"}</TableCell>
                        <TableCell>{statusBadge(line.assignmentStatus || "Not Assigned")}</TableCell>
                        <TableCell>
                          {can("activity_based", "canEdit") ? (
                            <Select
                              value={line.category || "Activity"}
                              onValueChange={(val) => handleInlineCategorySwitch(line, val)}
                            >
                              <SelectTrigger className="h-8 text-xs w-[100px]" data-testid={`select-category-${line.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Period">Period</SelectItem>
                                <SelectItem value="Activity">Activity</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-xs">{line.category || "Activity"}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {can("activity_based", "canCreate") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setSelectedPo(line); setAssignOpen(true); }}
                              data-testid={`button-assign-${line.id}`}
                            >
                              <UserPlus className="h-3.5 w-3.5 mr-1" />
                              Assign
                            </Button>
                          )}
                        </TableCell>
                        {can("activity_based", "canEdit") && (
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal(line)}
                              data-testid={`button-edit-row-${line.id}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        )}
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

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-row-activity">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Edit Line - PO {editModalLine?.poNumber} / {editModalLine?.poLineItem}
            </DialogTitle>
            <DialogDescription>
              {editModalLine?.vendorName} - {editModalLine?.itemDescription}
            </DialogDescription>
          </DialogHeader>

          {editModalLine && (() => {
            const calcPreview = getModalCalcPreview();
            return (
            <div className="space-y-5">
              <Card className="border-dashed">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Info className="h-3.5 w-3.5" />
                    Line Summary (read-only)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-sm">
                    <div><span className="text-muted-foreground">Net Amount:</span> <span className="font-mono font-medium">{formatAmount(editModalLine.netAmount)}</span></div>
                    <div><span className="text-muted-foreground">GL Account:</span> <span className="font-mono">{editModalLine.glAccount}</span></div>
                    <div><span className="text-muted-foreground">Cost Center:</span> <span className="font-mono">{editModalLine.costCenter}</span></div>
                    <div><span className="text-muted-foreground">Vendor:</span> {editModalLine.vendorName}</div>
                    <div><span className="text-muted-foreground">Status:</span> {statusBadge(editModalLine.assignmentStatus || "Not Assigned")}</div>
                    <div><span className="text-muted-foreground">Assigned:</span> {editModalLine.assignedToName || "Unassigned"}</div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Pencil className="h-3.5 w-3.5" />
                  Dates & Calculations
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="modal-start-date" className="text-xs font-medium">Start Date</Label>
                    <Input
                      id="modal-start-date"
                      type="date"
                      value={modalStartDate ? modalStartDate.split("/").length === 3 ? `${modalStartDate.split("/")[2]}-${modalStartDate.split("/")[0].padStart(2, "0")}-${modalStartDate.split("/")[1].padStart(2, "0")}` : modalStartDate : ""}
                      onChange={e => {
                        const v = e.target.value;
                        if (v) {
                          const [y, m, d] = v.split("-");
                          setModalStartDate(`${parseInt(m)}/${parseInt(d)}/${y}`);
                        } else {
                          setModalStartDate("");
                        }
                      }}
                      data-testid="input-modal-start-date"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="modal-end-date" className="text-xs font-medium">End Date</Label>
                    <Input
                      id="modal-end-date"
                      type="date"
                      value={modalEndDate ? modalEndDate.split("/").length === 3 ? `${modalEndDate.split("/")[2]}-${modalEndDate.split("/")[0].padStart(2, "0")}-${modalEndDate.split("/")[1].padStart(2, "0")}` : modalEndDate : ""}
                      onChange={e => {
                        const v = e.target.value;
                        if (v) {
                          const [y, m, d] = v.split("-");
                          setModalEndDate(`${parseInt(m)}/${parseInt(d)}/${y}`);
                        } else {
                          setModalEndDate("");
                        }
                      }}
                      data-testid="input-modal-end-date"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  When start and end dates are set, the system calculates provisions using pro-rated daily calculations (same as Period-Based). Without dates, provision equals current month GRN.
                </p>

                {calcPreview?.hasDates && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="modal-prev-trueup" className="text-xs font-medium">{prevMonthLabel} True-Up</Label>
                        <Input
                          id="modal-prev-trueup"
                          type="number"
                          value={modalPrevTrueUp}
                          onChange={e => setModalPrevTrueUp(e.target.value)}
                          data-testid="input-modal-prev-trueup"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="modal-cur-trueup" className="text-xs font-medium">{monthLabel} True-Up</Label>
                        <Input
                          id="modal-cur-trueup"
                          type="number"
                          value={modalCurTrueUp}
                          onChange={e => setModalCurTrueUp(e.target.value)}
                          data-testid="input-modal-cur-trueup"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Manual adjustments to reconcile calculated provisions with actual expenses. Use for partial deliveries, price changes, or scope adjustments.
                    </p>
                  </>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="modal-remarks" className="text-xs font-medium">Remarks</Label>
                  <Textarea
                    id="modal-remarks"
                    value={modalRemarks}
                    onChange={e => setModalRemarks(e.target.value)}
                    placeholder="Add notes or justifications for adjustments..."
                    rows={2}
                    data-testid="input-modal-remarks"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <ArrowRight className="h-3.5 w-3.5" />
                  Assignment & Category
                </h4>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Accrual Category</Label>
                  <Select value={modalCategory} onValueChange={setModalCategory}>
                    <SelectTrigger data-testid="select-modal-activity-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Period">Period-Based</SelectItem>
                      <SelectItem value="Activity">Activity-Based</SelectItem>
                    </SelectContent>
                  </Select>
                  {modalCategory === "Period" && (!modalStartDate || !modalEndDate) && (
                    <p className="text-[11px] text-destructive leading-tight font-medium">
                      Start and end dates are required to switch to Period-Based. Please enter dates above.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Assign to Business User</Label>
                  <Select value={modalAssignUser} onValueChange={setModalAssignUser}>
                    <SelectTrigger data-testid="select-modal-activity-assign">
                      <SelectValue placeholder="Select user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {businessUsers.map((u: any) => (
                        <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card className="border-dashed">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calculator className="h-3.5 w-3.5" />
                    Provision Calculation Preview
                  </div>
                  {calcPreview?.hasDates ? (
                    <div className="space-y-1 text-sm font-mono">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Total Days</span>
                        <span>{calcPreview.totalDays}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Daily Rate</span>
                        <span>{formatAmount(calcPreview.dailyRate)}</span>
                      </div>
                      <hr className="border-dashed" />
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">{prevMonthLabel} Provision</span>
                        <span>{formatAmount(calcPreview.prevProvision)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">+ {prevMonthLabel} True-Up</span>
                        <span className={calcPreview.prevTU !== 0 ? "text-amber-600 dark:text-amber-400 font-medium" : ""}>{formatAmount(calcPreview.prevTU)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">- {prevMonthLabel} GRN</span>
                        <span>{formatAmount(editModalLine.prevMonthGrn)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 font-medium">
                        <span className="text-muted-foreground">= Carry Forward</span>
                        <span className={calcPreview.carryForward < 0 ? "text-destructive" : ""}>{formatAmount(calcPreview.carryForward)}</span>
                      </div>
                      <hr className="border-dashed" />
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">{monthLabel} Suggested</span>
                        <span>{formatAmount(calcPreview.sugProvision)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">+ {monthLabel} True-Up</span>
                        <span className={calcPreview.curTU !== 0 ? "text-amber-600 dark:text-amber-400 font-medium" : ""}>{formatAmount(calcPreview.curTU)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">- {monthLabel} GRN</span>
                        <span>{formatAmount(editModalLine.currentMonthGrn)}</span>
                      </div>
                      <hr />
                      <div className="flex items-center justify-between gap-4 font-bold text-base">
                        <span>Final Provision</span>
                        <span className={calcPreview.finalProvision < 0 ? "text-destructive" : ""}>{formatAmount(calcPreview.finalProvision)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-sm font-mono">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">{monthLabel} GRN (no dates)</span>
                        <span>{formatAmount(editModalLine.currentMonthGrn)}</span>
                      </div>
                      <hr />
                      <div className="flex items-center justify-between gap-4 font-bold text-base">
                        <span>Final Provision</span>
                        <span>{formatAmount(calcPreview?.finalProvision || 0)}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight font-sans">
                        Set start and end dates above to enable pro-rated daily calculations with carry-forward and true-up support.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            );
          })()}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditModalOpen(false)} data-testid="button-cancel-edit-modal-activity">Cancel</Button>
            <Button onClick={saveEditModal} data-testid="button-save-edit-modal-activity">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryDateDialogOpen} onOpenChange={setCategoryDateDialogOpen}>
        <DialogContent data-testid="dialog-category-dates">
          <DialogHeader>
            <DialogTitle>Enter Contract Dates</DialogTitle>
            <DialogDescription>
              Start and end dates are required to switch PO {pendingCategoryLine?.poNumber} to Period-Based accruals.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Start Date</Label>
              <Input
                type="date"
                value={catStartDate}
                onChange={e => setCatStartDate(e.target.value ? (() => { const [y,m,d] = e.target.value.split("-"); return `${parseInt(m)}/${parseInt(d)}/${y}`; })() : "")}
                data-testid="input-cat-start-date"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">End Date</Label>
              <Input
                type="date"
                value={catEndDate}
                onChange={e => setCatEndDate(e.target.value ? (() => { const [y,m,d] = e.target.value.split("-"); return `${parseInt(m)}/${parseInt(d)}/${y}`; })() : "")}
                data-testid="input-cat-end-date"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCategoryDateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={confirmCategoryWithDates}
              disabled={!catStartDate || !catEndDate}
              data-testid="button-confirm-cat-dates"
            >
              Switch to Period-Based
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResponseTab() {
  const { can } = usePermissions();
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
                    <TableHead>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">Completion</span>
                        </TooltipTrigger>
                        <TooltipContent>Work completion percentage reported by business user</TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead className="text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">Provision Amt</span>
                        </TooltipTrigger>
                        <TooltipContent>Provision amount suggested by business user</TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">Status</span>
                        </TooltipTrigger>
                        <TooltipContent>Response approval status</TooltipContent>
                      </Tooltip>
                    </TableHead>
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
                        {r.status !== "Approved" && can("activity_based", "canApprove") && (
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
  const { can } = usePermissions();
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
