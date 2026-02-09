import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Send, Clock, DollarSign, Building2, FileText, Loader2 } from "lucide-react";

function formatAmount(v: number | null | undefined) {
  if (v == null) return "-";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(v);
}

function TaskCard({ task, onSubmit }: { task: any; onSubmit: (data: any) => void }) {
  const [status, setStatus] = useState(task.responseStatus || "Not Started");
  const [amount, setAmount] = useState(task.provisionAmount?.toString() || "");
  const [percent, setPercent] = useState("");
  const [comments, setComments] = useState(task.comments || "");
  const [submitting, setSubmitting] = useState(false);

  const handlePercentChange = (val: string) => {
    setPercent(val);
    const p = parseFloat(val);
    if (!isNaN(p) && task.netAmount) {
      setAmount(String(Math.round(task.netAmount * p / 100)));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit({
      assignmentId: task.assignmentId,
      completionStatus: status,
      provisionAmount: parseFloat(amount) || 0,
      provisionPercent: parseFloat(percent) || null,
      comments,
    });
    setSubmitting(false);
  };

  const isCompleted = status === "Completed";
  const isInProgress = status === "In Progress";
  const needsAmount = isCompleted || isInProgress;

  return (
    <Card className="overflow-visible">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold">{task.poNumber}</span>
              <Badge variant={task.assignmentStatus === "Overdue" ? "destructive" : "secondary"} className="text-[10px]">
                {task.assignmentStatus}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">{task.vendorName}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold font-mono">{formatAmount(task.netAmount)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{task.itemDescription}</p>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">CC:</span>
            <span className="font-mono">{task.costCenter}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">GL:</span>
            <span className="font-mono">{task.glAccount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Assigned:</span>
            <span>{task.assignedDate ? new Date(task.assignedDate).toLocaleDateString() : "-"}</span>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <Label className="text-sm font-medium">Completion Status</Label>
          <RadioGroup value={status} onValueChange={setStatus} className="grid grid-cols-2 gap-2">
            {["Not Started", "In Progress", "Completed", "Discontinue"].map(s => (
              <div key={s} className="flex items-center gap-2">
                <RadioGroupItem value={s} id={`${task.assignmentId}-${s}`} data-testid={`radio-status-${s.toLowerCase().replace(/\s/g, "-")}`} />
                <Label htmlFor={`${task.assignmentId}-${s}`} className="text-xs cursor-pointer">{s}</Label>
              </div>
            ))}
          </RadioGroup>

          {needsAmount && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Provision Amount</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  data-testid="input-provision-amount"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">OR Percentage (%)</Label>
                <Input
                  type="number"
                  value={percent}
                  onChange={e => handlePercentChange(e.target.value)}
                  placeholder="0-100"
                  min="0"
                  max="100"
                  data-testid="input-provision-percent"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Comments</Label>
            <Textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              placeholder="Add your comments..."
              rows={2}
              data-testid="input-comments"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting || (needsAmount && !amount)}
            data-testid={`button-submit-${task.assignmentId}`}
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit Response
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyTasksPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["/api/activity-based/my-tasks"],
    queryFn: () => apiGet<any[]>("/api/activity-based/my-tasks"),
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => apiPost("/api/activity-based/respond", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-based/my-tasks"] });
      toast({ title: "Submitted", description: "Your response has been submitted." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">My Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">Activity-based PO assignments requiring your response</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (tasks || []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <ClipboardList className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">No pending tasks</h3>
          <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(tasks || []).map((task: any) => (
            <TaskCard key={task.assignmentId} task={task} onSubmit={submitMutation.mutateAsync} />
          ))}
        </div>
      )}
    </div>
  );
}
