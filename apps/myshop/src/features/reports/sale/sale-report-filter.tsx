import DateField from "@/components/doctype/fields/date-field";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SaleReportFilterProps = {
  fromDate: string;
  toDate: string;
  factory: string;
  brand: string;
  status: string;
  factories: string[];
  brands: string[];

  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onFactoryChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onStatusChange: (value: string) => void;

  onApply: () => void;
  onReset: () => void;
};

export function SaleReportFilter({
  fromDate,
  toDate,
  factory,
  brand,
  status,
  factories,
  brands,
  onFromDateChange,
  onToDateChange,
  onFactoryChange,
  onBrandChange,
  onStatusChange,
  onApply,
  onReset,
}: SaleReportFilterProps) {
  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 print:hidden">
      <div className="flex flex-wrap items-end gap-4">
        {/* From Date */}
        <div className="min-w-0 flex-1 space-y-2">
          <label className="text-sm font-medium">From Date</label>
          <DateField value={fromDate} onChange={onFromDateChange} />
        </div>

        {/* To Date */}
        <div className="min-w-0 flex-1 space-y-2">
          <label className="text-sm font-medium">To Date</label>
          <DateField value={toDate} onChange={onToDateChange} />
        </div>

        {/* Factory */}
        <div className="min-w-0 flex-1 space-y-2">
          <label className="text-sm font-medium">Factory</label>
          <Select value={factory} onValueChange={onFactoryChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Factory" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Factories</SelectItem>
              {factories.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Brand */}
        <div className="min-w-0 flex-1 space-y-2">
          <label className="text-sm font-medium">Brand</label>
          <Select value={brand} onValueChange={onBrandChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Brands</SelectItem>
              {brands.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="min-w-0 flex-1 space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Confirmed">Confirmed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={onApply}>Apply</Button>
          <Button variant="outline" onClick={onReset}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
