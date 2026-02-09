import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { FileText, Send, Loader2, Calendar, AlertCircle } from "lucide-react";

export default function MyFormsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fillOpen, setFillOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const { data: forms, isLoading } = useQuery({
    queryKey: ["/api/non-po/my-forms"],
    queryFn: () => apiGet<any[]>("/api/non-po/my-forms"),
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => apiPost("/api/non-po/submit", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/non-po/my-forms"] });
      setFillOpen(false);
      toast({ title: "Submitted", description: "Form submitted successfully." });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const openForm = (form: any) => {
    setSelectedForm(form);
    setFormValues({});
    setFillOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedForm) return;
    submitMutation.mutate({
      formId: selectedForm.formId,
      standardFields: formValues,
      customFields: {},
    });
  };

  const getVisibleFields = (config: any) => {
    if (!config?.defaultFields) return [];
    return Object.entries(config.defaultFields)
      .filter(([_, v]: any) => v.visible)
      .map(([key, v]: any) => ({
        key,
        label: key.replace(/([A-Z])/g, " $1").replace(/^./, (s: string) => s.toUpperCase()),
        required: v.required,
      }));
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">My Forms</h1>
        <p className="text-sm text-muted-foreground mt-1">Non-PO accrual forms assigned to you</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (forms || []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">No forms assigned</h3>
          <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(forms || []).map((form: any) => (
            <Card key={form.assignmentId} className="overflow-visible">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{form.formName}</h3>
                    {form.description && <p className="text-xs text-muted-foreground mt-0.5">{form.description}</p>}
                  </div>
                  <Badge variant={form.priority === "High" ? "destructive" : "secondary"} className="text-[10px] shrink-0">
                    {form.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {form.dueDate && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Due: {form.dueDate}
                  </div>
                )}
                <Button className="w-full" onClick={() => openForm(form)} data-testid={`button-fill-form-${form.formId}`}>
                  <Send className="mr-2 h-4 w-4" />
                  Fill & Submit
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={fillOpen} onOpenChange={setFillOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedForm?.formName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
            {selectedForm && getVisibleFields(selectedForm.fieldConfiguration).map((field: any) => (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-sm">
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
                {field.key === "serviceDescription" ? (
                  <Textarea
                    value={formValues[field.key] || ""}
                    onChange={e => setFormValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    rows={2}
                    data-testid={`input-${field.key}`}
                  />
                ) : (
                  <Input
                    type={field.key === "provisionAmount" ? "number" : "text"}
                    value={formValues[field.key] || ""}
                    onChange={e => setFormValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    data-testid={`input-${field.key}`}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFillOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitMutation.isPending} data-testid="button-submit-form">
              {submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
