"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

const MONTH_LABELS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

interface MonthSelectorProps {
  year: number;
  month: number;
  basePath?: string;
}

export function MonthSelector({
  year,
  month,
  basePath = "/transactions",
}: MonthSelectorProps) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);

  function navigate(y: number, m: number) {
    router.push(`${basePath}?year=${y}&month=${m}`);
  }

  function handlePrev() {
    if (month === 1) navigate(year - 1, 12);
    else navigate(year, month - 1);
  }

  function handleNext() {
    if (month === 12) navigate(year + 1, 1);
    else navigate(year, month + 1);
  }

  function handlePickMonth(m: number) {
    setPickerOpen(false);
    navigate(pickerYear, m);
  }

  const label = `${year}년 ${String(month).padStart(2, "0")}월`;

  return (
    <div className="flex items-center justify-center gap-4">
      <Button variant="ghost" size="icon" onClick={handlePrev}>
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <Popover
        open={pickerOpen}
        onOpenChange={(open) => {
          setPickerOpen(open);
          if (open) setPickerYear(year);
        }}
      >
        <PopoverTrigger
          render={
            <Button variant="ghost" className="min-w-[120px] font-semibold">
              {label}
              <CalendarDays className="ml-1.5 h-4 w-4 text-muted-foreground" />
            </Button>
          }
        />
        <PopoverContent className="w-64 p-3">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPickerYear((y) => y - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold">{pickerYear}년</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPickerYear((y) => y + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {MONTH_LABELS.map((lbl, i) => {
              const m = i + 1;
              const isActive = pickerYear === year && m === month;
              return (
                <Button
                  key={m}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => handlePickMonth(m)}
                >
                  {lbl}
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <Button variant="ghost" size="icon" onClick={handleNext}>
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
