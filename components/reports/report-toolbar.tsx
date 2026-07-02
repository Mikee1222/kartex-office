"use client";

import { Download, Printer, RefreshCw } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type ReportDatePreset } from "@/lib/reports/date-range";
import { premiumFilterTabActive, premiumFilterTabInactive, premiumGoldButton } from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

const PRESETS: { id: ReportDatePreset; label: string }[] = [
  { id: "today", label: "Σήμερα" },
  { id: "week", label: "Εβδομάδα" },
  { id: "month", label: "Μήνας" },
  { id: "year", label: "Έτος" },
  { id: "custom", label: "Custom" },
];

type ReportToolbarProps = {
  preset: ReportDatePreset;
  customStart: string;
  customEnd: string;
  rangeLabel: string;
  onPresetChange: (preset: ReportDatePreset) => void;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
  onExport: () => void;
  onPrint: () => void;
  onRefresh: () => void;
  refreshing?: boolean;
  exportDisabled?: boolean;
};

export function ReportToolbar({
  preset,
  customStart,
  customEnd,
  rangeLabel,
  onPresetChange,
  onCustomStartChange,
  onCustomEndChange,
  onExport,
  onPrint,
  onRefresh,
  refreshing,
  exportDisabled,
}: ReportToolbarProps) {
  return (
    <div className="flex flex-col gap-3 print:hidden lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPresetChange(item.id)}
            className={cn(
              preset === item.id ? premiumFilterTabActive : premiumFilterTabInactive,
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {preset === "custom" ? (
          <>
            <Input
              type="date"
              value={customStart}
              onChange={(event) => onCustomStartChange(event.target.value)}
              className="w-[150px]"
              aria-label="Από"
            />
            <span className="text-sm text-muted-foreground">—</span>
            <Input
              type="date"
              value={customEnd}
              onChange={(event) => onCustomEndChange(event.target.value)}
              className="w-[150px]"
              aria-label="Έως"
            />
          </>
        ) : (
          <span className="text-xs text-muted-foreground">{rangeLabel}</span>
        )}

        <Button type="button" variant="outline" size="sm" onClick={onExport} disabled={exportDisabled}>
          <Download className="size-4" />
          Εξαγωγή CSV
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onPrint}>
          <Printer className="size-4" />
          Εκτύπωση
        </Button>
        <Button
          type="button"
          size="sm"
          className={premiumGoldButton}
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          Ανανέωση
        </Button>
      </div>
    </div>
  );
}

export const REPORT_TABS = [
  { id: "overview", label: "Επισκόπηση" },
  { id: "sales", label: "Πωλήσεις" },
  { id: "products", label: "Προϊόντα" },
  { id: "customers", label: "Πελάτες" },
  { id: "warehouse", label: "Αποθήκη" },
  { id: "drivers", label: "Οδηγοί" },
  { id: "profitability", label: "Κερδοφορία" },
] as const;

export type ReportTabId = (typeof REPORT_TABS)[number]["id"];

type ReportTabBarProps = {
  activeTab: ReportTabId;
  onChange: (tab: ReportTabId) => void;
};

export function ReportTabBar({ activeTab, onChange }: ReportTabBarProps) {
  return (
    <div
      className="flex flex-wrap gap-2 rounded-2xl border border-gray-200/80 bg-white p-2 shadow-card print:hidden"
      role="tablist"
      aria-label="Κατηγορίες αναφορών"
    >
      {REPORT_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              isActive ? premiumFilterTabActive : premiumFilterTabInactive,
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
