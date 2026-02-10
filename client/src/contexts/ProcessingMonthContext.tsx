import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface ProcessingMonthContextType {
  processingMonth: string;
  setProcessingMonth: (month: string) => void;
  availableMonths: string[];
  isLoading: boolean;
  monthLabel: string;
  prevMonthLabel: string;
}

const ProcessingMonthContext = createContext<ProcessingMonthContextType | null>(null);

function generateAvailableMonths(centerMonth: string): string[] {
  const parts = centerMonth.trim().split(" ");
  const monthIdx = MONTHS.indexOf(parts[0]);
  const year = parseInt(parts[1]);
  if (monthIdx === -1 || isNaN(year)) return [centerMonth];

  const months: string[] = [];
  for (let offset = -6; offset <= 6; offset++) {
    let m = monthIdx + offset;
    let y = year;
    while (m < 0) { m += 12; y--; }
    while (m >= 12) { m -= 12; y++; }
    months.push(`${MONTHS[m]} ${y}`);
  }
  return months;
}

function getPrevMonthLabel(month: string): string {
  const parts = month.trim().split(" ");
  const monthIdx = MONTHS.indexOf(parts[0]);
  const year = parseInt(parts[1]);
  if (monthIdx === -1 || isNaN(year)) return "Previous Month";
  let pm = monthIdx - 1;
  let py = year;
  if (pm < 0) { pm = 11; py--; }
  return `${MONTHS[pm]} ${py}`;
}

export function ProcessingMonthProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [processingMonth, setProcessingMonth] = useState<string>("Feb 2026");
  const [initialized, setInitialized] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ["/api/config"],
    queryFn: () => apiGet<Record<string, string>>("/api/config"),
    enabled: !!user,
  });

  useEffect(() => {
    if (config && !initialized) {
      const configMonth = config.processing_month || "Feb 2026";
      setProcessingMonth(configMonth);
      setInitialized(true);
    }
  }, [config, initialized]);

  const availableMonths = generateAvailableMonths(processingMonth);
  const monthLabel = processingMonth;
  const prevMonthLabel = getPrevMonthLabel(processingMonth);

  return (
    <ProcessingMonthContext.Provider value={{
      processingMonth,
      setProcessingMonth,
      availableMonths,
      isLoading: isLoading && !initialized,
      monthLabel,
      prevMonthLabel,
    }}>
      {children}
    </ProcessingMonthContext.Provider>
  );
}

export function useProcessingMonth() {
  const ctx = useContext(ProcessingMonthContext);
  if (!ctx) throw new Error("useProcessingMonth must be used within ProcessingMonthProvider");
  return ctx;
}
