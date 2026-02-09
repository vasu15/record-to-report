import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { Download, FileSpreadsheet, AlertTriangle, TrendingUp, BarChart3 } from "lucide-react";

const COLORS = [
  "hsl(217, 91%, 35%)", "hsl(173, 58%, 30%)", "hsl(43, 74%, 38%)",
  "hsl(27, 87%, 35%)", "hsl(197, 37%, 32%)",
];

function formatAmount(v: number) {
  if (v >= 10000000) return `${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return v.toFixed(0);
}

function ExceptionCard({ title, count, value, variant }: {
  title: string; count: number; value: number; variant: "destructive" | "secondary";
}) {
  return (
    <Card className="overflow-visible">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-xl font-bold">{count}</p>
            <p className="text-xs font-mono text-muted-foreground">{formatAmount(value)}</p>
          </div>
          <Badge variant={variant} className="text-[10px] shrink-0">
            {variant === "destructive" ? "Critical" : "Warning"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/reports/analytics"],
    queryFn: () => apiGet<any>("/api/reports/analytics"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const d = data || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Avg Provision/PO</p>
            <p className="text-xl font-bold mt-1">{formatAmount(d.avgProvisionPerPo || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Avg Response Time</p>
            <p className="text-xl font-bold mt-1">{d.avgResponseDays || 0} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Completion Rate</p>
            <p className="text-xl font-bold mt-1">{d.completionRate || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Total PO Lines</p>
            <p className="text-xl font-bold mt-1">{d.totalPoLines || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold">Top Vendors by Provision</h3>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(d.topVendors || []).slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={formatAmount} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => formatAmount(v)} />
                  <Bar dataKey="amount" fill={COLORS[0]} radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold">Status Distribution</h3>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={d.statusDistribution || []} cx="50%" cy="50%" innerRadius={60} outerRadius={95} dataKey="value" nameKey="name" paddingAngle={3} strokeWidth={0}>
                    {(d.statusDistribution || []).map((_: any, idx: number) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {(d.statusDistribution || []).map((item: any, idx: number) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ExceptionsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/reports/exceptions"],
    queryFn: () => apiGet<any>("/api/reports/exceptions"),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const d = data || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <ExceptionCard title="Negative Provisions" count={d.negativeProvisions || 0} value={d.negativeValue || 0} variant="destructive" />
      <ExceptionCard title="Zero Provisions" count={d.zeroProvisions || 0} value={0} variant="secondary" />
      <ExceptionCard title="Unassigned Activity POs" count={d.unassigned || 0} value={d.unassignedValue || 0} variant="destructive" />
      <ExceptionCard title="Overdue Approvals" count={d.overdueApprovals || 0} value={d.overdueValue || 0} variant="destructive" />
      <ExceptionCard title="Large True-ups" count={d.largeTrueUps || 0} value={d.largeTrueUpValue || 0} variant="secondary" />
      <ExceptionCard title="GRN Exceeds Net" count={d.grnExceeds || 0} value={d.grnExceedsValue || 0} variant="secondary" />
      <ExceptionCard title="Missing Dates" count={d.missingDates || 0} value={d.missingDatesValue || 0} variant="destructive" />
      <ExceptionCard title="Missing Required Fields" count={d.missingFields || 0} value={0} variant="secondary" />
    </div>
  );
}

export default function ReportsPage() {
  const handleExport = async () => {
    const token = sessionStorage.getItem("auth_token");
    const res = await fetch("/api/reports/export", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "accruals_report.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Comprehensive reporting and exception tracking</p>
        </div>
        <Button onClick={handleExport} variant="outline" data-testid="button-export">
          <Download className="mr-1.5 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Tabs defaultValue="analytics">
        <TabsList>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="exceptions" data-testid="tab-exceptions">
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            Exceptions
          </TabsTrigger>
        </TabsList>
        <TabsContent value="analytics" className="mt-4">
          <AnalyticsTab />
        </TabsContent>
        <TabsContent value="exceptions" className="mt-4">
          <ExceptionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
