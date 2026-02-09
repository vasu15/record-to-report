import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut, apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Download, Filter, Upload, Search, MessageSquare, Calculator } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface PeriodLine {
  id: number;
  poNumber: string;
  poLineItem: string;
  vendorName: string;
  itemDescription: string;
  netAmount: number;
  glAccount: string;
  costCenter: string;
  profitCenter: string;
  plant: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  prevMonthDays: number;
  prevMonthProvision: number;
  prevMonthTrueUp: number;
  prevMonthGrn: number;
  carryForward: number;
  currentMonthDays: number;
  suggestedProvision: number;
  currentMonthGrn: number;
  currentMonthTrueUp: number;
  remarks: string;
  finalProvision: number;
  status: string;
}

function formatAmount(v: number | null | undefined) {
  if (v == null) return "-";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(v);
}

function getRowColor(line: PeriodLine) {
  if (line.finalProvision < 0) return "bg-red-50/50 dark:bg-red-950/20";
  if (line.finalProvision === 0) return "bg-muted/30";
  if (line.prevMonthTrueUp !== 0 || line.currentMonthTrueUp !== 0) return "bg-yellow-50/50 dark:bg-yellow-950/20";
  return "";
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Approved": return "default";
    case "Under Review": return "secondary";
    case "Posted": return "outline";
    default: return "secondary";
  }
}

export default function PeriodBasedPage() {
  const { isFinanceAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [remarksOpen, setRemarksOpen] = useState(false);
  const [remarksLine, setRemarksLine] = useState<PeriodLine | null>(null);
  const [remarksText, setRemarksText] = useState("");
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  const { data: config } = useQuery({
    queryKey: ["/api/config"],
    queryFn: () => apiGet<any>("/api/config"),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["/api/period-based"],
    queryFn: () => apiGet<PeriodLine[]>("/api/period-based"),
  });

  const updateTrueUp = useMutation({
    mutationFn: ({ id, field, value }: { id: number; field: string; value: number }) =>
      apiPut(`/api/period-based/${id}/true-up`, { field, value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/period-based"] });
      toast({ title: "Saved", description: "True-up updated successfully." });
    },
  });

  const updateRemarks = useMutation({
    mutationFn: ({ id, remarks }: { id: number; remarks: string }) =>
      apiPut(`/api/period-based/${id}/remarks`, { remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/period-based"] });
      setRemarksOpen(false);
      toast({ title: "Saved", description: "Remarks updated." });
    },
  });

  const handleCellEdit = (line: PeriodLine, field: string) => {
    setEditingCell({ id: line.id, field });
    setEditValue(field === "prevMonthTrueUp" ? String(line.prevMonthTrueUp || 0) : String(line.currentMonthTrueUp || 0));
  };

  const handleCellBlur = () => {
    if (!editingCell) return;
    const val = parseFloat(editValue) || 0;
    updateTrueUp.mutate({ id: editingCell.id, field: editingCell.field, value: val });
    setEditingCell(null);
  };

  const lines = (data || []).filter(l =>
    !search || l.poNumber?.toLowerCase().includes(search.toLowerCase()) ||
    l.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
    l.costCenter?.toLowerCase().includes(search.toLowerCase())
  );

  const processingMonth = config?.processing_month || "Feb 2026";

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Period-Based Accruals</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">Monthly provision calculations</p>
            <Badge variant="outline">{processingMonth}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search PO, vendor, CC..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-56"
              data-testid="input-search"
            />
          </div>
          <Button variant="outline" size="sm" data-testid="button-download">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Calculator className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="text-sm font-medium">No period-based accruals</h3>
              <p className="text-xs text-muted-foreground mt-1">Upload PO data to get started</p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="min-w-[1800px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card z-10 min-w-[120px]">PO Number</TableHead>
                      <TableHead className="min-w-[60px]">Line</TableHead>
                      <TableHead className="min-w-[140px]">Vendor</TableHead>
                      <TableHead className="min-w-[160px]">Description</TableHead>
                      <TableHead className="text-right min-w-[100px]">Net Amt</TableHead>
                      <TableHead className="min-w-[80px]">GL</TableHead>
                      <TableHead className="min-w-[80px]">CC</TableHead>
                      <TableHead className="min-w-[70px]">Start</TableHead>
                      <TableHead className="min-w-[70px]">End</TableHead>
                      <TableHead className="text-right min-w-[50px]">Days</TableHead>
                      <TableHead className="text-right bg-muted/30 min-w-[70px]">Prev Prov</TableHead>
                      <TableHead className="text-right bg-muted/30 min-w-[80px]">Prev T/U</TableHead>
                      <TableHead className="text-right bg-muted/30 min-w-[70px]">Prev GRN</TableHead>
                      <TableHead className="text-right bg-muted/30 min-w-[80px]">Carry Fwd</TableHead>
                      <TableHead className="text-right bg-accent/30 min-w-[80px]">Cur Prov</TableHead>
                      <TableHead className="text-right bg-accent/30 min-w-[70px]">Cur GRN</TableHead>
                      <TableHead className="text-right bg-accent/30 min-w-[80px]">Cur T/U</TableHead>
                      <TableHead className="bg-accent/30 min-w-[60px]">Remarks</TableHead>
                      <TableHead className="text-right font-bold min-w-[100px]">Final</TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map(line => (
                      <TableRow key={line.id} className={getRowColor(line)}>
                        <TableCell className="sticky left-0 bg-inherit z-10 font-mono text-xs font-medium">{line.poNumber}</TableCell>
                        <TableCell className="text-xs">{line.poLineItem}</TableCell>
                        <TableCell className="text-xs truncate max-w-[140px]">{line.vendorName}</TableCell>
                        <TableCell className="text-xs truncate max-w-[160px]">{line.itemDescription}</TableCell>
                        <TableCell className="text-right text-xs font-mono">{formatAmount(line.netAmount)}</TableCell>
                        <TableCell className="text-xs font-mono">{line.glAccount}</TableCell>
                        <TableCell className="text-xs font-mono">{line.costCenter}</TableCell>
                        <TableCell className="text-xs">{line.startDate}</TableCell>
                        <TableCell className="text-xs">{line.endDate}</TableCell>
                        <TableCell className="text-right text-xs">{line.totalDays}</TableCell>
                        <TableCell className="text-right text-xs bg-muted/10 font-mono">{formatAmount(line.prevMonthProvision)}</TableCell>
                        <TableCell className="text-right text-xs bg-muted/10">
                          {editingCell?.id === line.id && editingCell?.field === "prevMonthTrueUp" ? (
                            <Input
                              type="number"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={handleCellBlur}
                              onKeyDown={e => e.key === "Enter" && handleCellBlur()}
                              className="h-6 text-xs w-20 text-right"
                              autoFocus
                              data-testid="input-prev-true-up"
                            />
                          ) : (
                            <span
                              className={`cursor-pointer font-mono ${line.prevMonthTrueUp ? "text-amber-600 dark:text-amber-400 font-medium" : ""}`}
                              onClick={() => isFinanceAdmin && handleCellEdit(line, "prevMonthTrueUp")}
                            >
                              {formatAmount(line.prevMonthTrueUp)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs bg-muted/10 font-mono">{formatAmount(line.prevMonthGrn)}</TableCell>
                        <TableCell className="text-right text-xs bg-muted/10 font-mono font-medium">{formatAmount(line.carryForward)}</TableCell>
                        <TableCell className="text-right text-xs bg-accent/10 font-mono">{formatAmount(line.suggestedProvision)}</TableCell>
                        <TableCell className="text-right text-xs bg-accent/10 font-mono">{formatAmount(line.currentMonthGrn)}</TableCell>
                        <TableCell className="text-right text-xs bg-accent/10">
                          {editingCell?.id === line.id && editingCell?.field === "currentMonthTrueUp" ? (
                            <Input
                              type="number"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={handleCellBlur}
                              onKeyDown={e => e.key === "Enter" && handleCellBlur()}
                              className="h-6 text-xs w-20 text-right"
                              autoFocus
                              data-testid="input-current-true-up"
                            />
                          ) : (
                            <span
                              className={`cursor-pointer font-mono ${line.currentMonthTrueUp ? "text-amber-600 dark:text-amber-400 font-medium" : ""}`}
                              onClick={() => isFinanceAdmin && handleCellEdit(line, "currentMonthTrueUp")}
                            >
                              {formatAmount(line.currentMonthTrueUp)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="bg-accent/10">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => { setRemarksLine(line); setRemarksText(line.remarks || ""); setRemarksOpen(true); }}
                            data-testid={`button-remarks-${line.id}`}
                          >
                            <MessageSquare className={`h-3.5 w-3.5 ${line.remarks ? "text-primary" : "text-muted-foreground"}`} />
                          </Button>
                        </TableCell>
                        <TableCell className="text-right font-bold text-sm font-mono">
                          <span className={line.finalProvision < 0 ? "text-destructive" : ""}>
                            {formatAmount(line.finalProvision)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(line.status)} className="text-[10px]">
                            {line.status}
                          </Badge>
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

      <Dialog open={remarksOpen} onOpenChange={setRemarksOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remarks - PO {remarksLine?.poNumber}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={remarksText}
            onChange={e => setRemarksText(e.target.value)}
            placeholder="Add remarks..."
            rows={4}
            data-testid="input-remarks"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarksOpen(false)}>Cancel</Button>
            <Button
              onClick={() => remarksLine && updateRemarks.mutate({ id: remarksLine.id, remarks: remarksText })}
              disabled={updateRemarks.isPending}
              data-testid="button-save-remarks"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
