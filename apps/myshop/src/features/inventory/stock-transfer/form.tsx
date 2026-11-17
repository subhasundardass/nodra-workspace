import * as React from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { Plus, Trash2 } from "lucide-react";

import { callMethod } from "@/lib/call-method";
import { DateField } from "@/components/doctype/fields/date-field";
import { LinkField } from "@/components/doctype/fields/link-field";

import type { NodraForm } from "@/components/doctype/templates/doctype-form-template";

interface StockTransferFormProps {
  form: NodraForm;
}

interface TransferItem {
  _rowKey: string;
  lot: string;
  brand: string;
  grade: string;
  bags: number;
  net_kg_per_bag: number;
  quantity: number;
  bag_from_serial_no: number;
  bag_to_serial_no: number;
  remarks: string;
}

interface LotDocument {
  name: string;
  original_brand?: string;
  brand?: string;
  grade?: string;
  bags?: number;
  net_kg_per_bag?: number;
  bag_from_serial_no?: number;
  bag_to_serial_no?: number;
}

interface FieldRowProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}

function FieldRow({
  label,
  htmlFor,
  required = false,
  children,
}: FieldRowProps) {
  return (
    <div className="grid min-w-0 grid-cols-[120px_minmax(0,1fr)] items-center gap-3">
      <label
        htmlFor={htmlFor}
        className="min-w-0 text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>

      <div className="min-w-0 *:w-full">{children}</div>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border bg-card p-4 md:p-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {children}
    </section>
  );
}

function NumberInput({
  value,
  onChange,
  step = "1",
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  step?: string;
  disabled?: boolean;
}) {
  return (
    <Input
      type="number"
      min={0}
      step={step}
      value={String(value)}
      disabled={disabled}
      onChange={(event) => {
        const rawValue = event.target.value;
        onChange(rawValue === "" ? 0 : Number(rawValue));
      }}
      className="bg-background text-right shadow-none"
    />
  );
}

function LocationFields({
  form,
  prefix,
  title,
}: {
  form: NodraForm;
  prefix: "source" | "destination";
  title: string;
}) {
  const typeField = `${prefix}_location_type` as
    "source_location_type" | "destination_location_type";

  const factoryField = `${prefix}_factory` as
    "source_factory" | "destination_factory";

  const warehouseField = `${prefix}_warehouse` as
    "source_warehouse" | "destination_warehouse";

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">{title}</h4>

      <form.Field name={typeField}>
        {(field) => (
          <FieldRow label="Location Type" htmlFor={field.name} required>
            <select
              id={field.name}
              name={field.name}
              value={String(field.state.value ?? "")}
              onChange={(event) => {
                field.handleChange(event.target.value);

                form.setFieldValue(factoryField, "");
                form.setFieldValue(warehouseField, "");
              }}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select Location Type</option>
              <option value="Factory">Factory</option>
              <option value="Warehouse">Warehouse</option>
            </select>
          </FieldRow>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.values[typeField]}>
        {(locationType) => {
          if (locationType === "Factory") {
            return (
              <form.Field name={factoryField}>
                {(field) => (
                  <FieldRow label="Factory" htmlFor={field.name} required>
                    <LinkField
                      value={String(field.state.value ?? "")}
                      onChange={field.handleChange}
                      doctype="Factory"
                      className="w-full"
                    />
                  </FieldRow>
                )}
              </form.Field>
            );
          }

          if (locationType === "Warehouse") {
            return (
              <form.Field name={warehouseField}>
                {(field) => (
                  <FieldRow label="Warehouse" htmlFor={field.name} required>
                    <LinkField
                      value={String(field.state.value ?? "")}
                      onChange={field.handleChange}
                      doctype="Warehouse"
                      className="w-full"
                    />
                  </FieldRow>
                )}
              </form.Field>
            );
          }

          return null;
        }}
      </form.Subscribe>
    </div>
  );
}

function emptyTransferItem(rowKey: string): TransferItem {
  return {
    _rowKey: rowKey,
    lot: "",
    brand: "",
    grade: "",
    bags: 0,
    net_kg_per_bag: 0,
    quantity: 0,
    bag_from_serial_no: 0,
    bag_to_serial_no: 0,
    remarks: "",
  };
}

export function StockTransferForm({ form }: StockTransferFormProps) {
  const rowCounter = React.useRef(0);
  const requestCounter = React.useRef<Record<string, number>>({});
  const [loadingRows, setLoadingRows] = React.useState<string[]>([]);
  const [lotErrors, setLotErrors] = React.useState<Record<string, string>>({});

  const createRowKey = React.useCallback(() => {
    rowCounter.current += 1;
    return `transfer-item-${rowCounter.current}`;
  }, []);

  const updateTotals = React.useCallback(
    (items: TransferItem[]) => {
      const totalBags = items.reduce(
        (total, item) => total + Number(item.bags || 0),
        0,
      );

      const totalQuantity = items.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0,
      );

      form.setFieldValue("total_bags", totalBags);
      form.setFieldValue("total_quantity", Number(totalQuantity.toFixed(3)));
    },
    [form],
  );

  return (
    <div className="space-y-5">
      {/* Transfer Information */}
      <FormSection
        title="Transfer Information"
        description="Enter the date and locations for this stock transfer."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <form.Field name="transfer_date">
            {(field) => (
              <FieldRow label="Transfer Date" htmlFor={field.name} required>
                <DateField
                  id={field.name}
                  name={field.name}
                  value={String(field.state.value ?? "")}
                  onChange={field.handleChange}
                  className="w-full"
                  inputClassName="text-right"
                />
              </FieldRow>
            )}
          </form.Field>
        </div>
      </FormSection>

      {/* Locations */}
      <FormSection
        title="Transfer Locations"
        description="Select where the stock is moving from and where it is going."
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-md bg-muted/30 p-3">
            <LocationFields
              form={form}
              prefix="source"
              title="Source Location"
            />
          </div>

          <div className="rounded-md bg-muted/30 p-3">
            <LocationFields
              form={form}
              prefix="destination"
              title="Destination Location"
            />
          </div>
        </div>
      </FormSection>

      {/* Transfer Items */}
      <FormSection
        title="Transfer Items"
        description="Add each Lot that needs to be transferred. Lot details are loaded automatically."
      >
        <form.Field name="items">
          {(field) => {
            const items = (
              Array.isArray(field.state.value) ? field.state.value : []
            ) as TransferItem[];

            const setItems = (nextItems: TransferItem[]) => {
              field.handleChange(nextItems);
              updateTotals(nextItems);
            };

            const updateItem = (
              rowKey: string,
              changes: Partial<TransferItem>,
            ) => {
              const nextItems = items.map((item) =>
                item._rowKey === rowKey ? { ...item, ...changes } : item,
              );

              setItems(nextItems);
            };

            const removeItem = (rowKey: string) => {
              const nextItems = items.filter((item) => item._rowKey !== rowKey);

              delete requestCounter.current[rowKey];

              setLoadingRows((current) =>
                current.filter((key) => key !== rowKey),
              );

              setLotErrors((current) => {
                const next = { ...current };
                delete next[rowKey];
                return next;
              });

              setItems(nextItems);
            };

            const loadLot = async (rowKey: string, lotName: string) => {
              const requestId = (requestCounter.current[rowKey] ?? 0) + 1;

              requestCounter.current[rowKey] = requestId;

              setLotErrors((current) => {
                const next = { ...current };
                delete next[rowKey];
                return next;
              });

              if (!lotName) {
                updateItem(rowKey, {
                  lot: "",
                  brand: "",
                  grade: "",
                  bags: 0,
                  net_kg_per_bag: 0,
                  quantity: 0,
                  bag_from_serial_no: 0,
                  bag_to_serial_no: 0,
                });
                return;
              }

              updateItem(rowKey, {
                lot: lotName,
                brand: "",
                grade: "",
                bags: 0,
                net_kg_per_bag: 0,
                quantity: 0,
                bag_from_serial_no: 0,
                bag_to_serial_no: 0,
              });

              setLoadingRows((current) =>
                current.includes(rowKey) ? current : [...current, rowKey],
              );

              try {
                const result = await callMethod<{
                  document: LotDocument;
                }>("document.get", {
                  doctype: "Lots",
                  name: lotName,
                });

                if (requestCounter.current[rowKey] !== requestId) {
                  return;
                }

                const lot = result.document;
                const bags = Number(lot.bags ?? 0);
                const kgPerBag = Number(lot.net_kg_per_bag ?? 0);
                const fromSerial = Number(lot.bag_from_serial_no ?? 0);
                const toSerial = Number(lot.bag_to_serial_no ?? 0);

                updateItem(rowKey, {
                  lot: lotName,
                  brand: String(lot.original_brand ?? lot.brand ?? ""),
                  grade: String(lot.grade ?? ""),
                  bags,
                  net_kg_per_bag: kgPerBag,
                  quantity: Number((bags * kgPerBag).toFixed(3)),
                  bag_from_serial_no: fromSerial,
                  bag_to_serial_no: toSerial,
                });
              } catch (error) {
                if (requestCounter.current[rowKey] === requestId) {
                  setLotErrors((current) => ({
                    ...current,
                    [rowKey]:
                      error instanceof Error
                        ? error.message
                        : "Unable to load Lot details.",
                  }));
                }
              } finally {
                if (requestCounter.current[rowKey] === requestId) {
                  setLoadingRows((current) =>
                    current.filter((key) => key !== rowKey),
                  );
                }
              }
            };

            return (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Lots to Transfer</p>
                    <p className="text-xs text-muted-foreground">
                      Add multiple Lots to this transfer.
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setItems([...items, emptyTransferItem(createRowKey())]);
                    }}
                  >
                    <Plus className="mr-2 size-4" />
                    Add Lot
                  </Button>
                </div>

                {/* List */}
                {items.length === 0 ? (
                  <div className="rounded-md border border-dashed p-8 text-center">
                    <p className="text-sm font-medium">No Lots added</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Click Add Lot to select a Lot.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full min-w-[1100px] text-sm">
                      <thead className="bg-muted/50">
                        <tr className="border-b text-left">
                          <th className="w-10 px-3 py-3">#</th>
                          <th className="min-w-[180px] px-3 py-3">Lot</th>
                          <th className="min-w-[130px] px-3 py-3">Brand</th>
                          <th className="min-w-[100px] px-3 py-3">Grade</th>
                          <th className="w-24 px-3 py-3 text-right">
                            Available
                          </th>
                          <th className="w-24 px-3 py-3 text-right">Bags</th>
                          <th className="w-28 px-3 py-3 text-right">
                            KG / Bag
                          </th>
                          <th className="w-28 px-3 py-3 text-right">
                            From Sl.
                          </th>
                          <th className="w-28 px-3 py-3 text-right">To Sl.</th>
                          <th className="w-32 px-3 py-3 text-right">
                            Total KG
                          </th>
                          <th className="w-12 px-3 py-3"></th>
                        </tr>
                      </thead>

                      <tbody>
                        {items.map((item, index) => {
                          const rowKey = item._rowKey || `existing-${index}`;
                          const availableBags = Number(item.bags || 0);
                          const kgPerBag = Number(item.net_kg_per_bag || 0);
                          const isLoading = loadingRows.includes(rowKey);

                          return (
                            <tr key={rowKey} className="border-b last:border-0">
                              <td className="px-3 py-3 text-muted-foreground">
                                {index + 1}
                              </td>

                              <td className="px-3 py-3">
                                <LinkField
                                  value={item.lot}
                                  onChange={(value) => loadLot(rowKey, value)}
                                  doctype="Lots"
                                  titleField="lot_no"
                                  className="w-full"
                                />

                                {isLoading && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Loading...
                                  </p>
                                )}

                                {lotErrors[rowKey] && (
                                  <p className="mt-1 text-xs text-destructive">
                                    {lotErrors[rowKey]}
                                  </p>
                                )}
                              </td>

                              <td className="px-3 py-3">
                                <span className="text-muted-foreground">
                                  {item.brand || "—"}
                                </span>
                              </td>

                              <td className="px-3 py-3">
                                <span className="text-muted-foreground">
                                  {item.grade || "—"}
                                </span>
                              </td>

                              <td className="px-3 py-3 text-right tabular-nums">
                                {item.lot ? availableBags : "—"}
                              </td>

                              <td className="px-3 py-3">
                                <NumberInput
                                  value={item.bags}
                                  disabled={!item.lot || isLoading}
                                  onChange={(value) => {
                                    const bags = Math.min(
                                      availableBags,
                                      Math.max(0, Math.floor(value)),
                                    );

                                    const fromSerial = Number(
                                      item.bag_from_serial_no || 0,
                                    );

                                    updateItem(rowKey, {
                                      bags,
                                      quantity: Number(
                                        (bags * kgPerBag).toFixed(3),
                                      ),
                                      bag_to_serial_no:
                                        bags > 0 ? fromSerial + bags - 1 : 0,
                                    });
                                  }}
                                />
                              </td>

                              <td className="px-3 py-3 text-right tabular-nums">
                                {kgPerBag.toFixed(3)}
                              </td>

                              <td className="px-3 py-3">
                                <NumberInput
                                  value={item.bag_from_serial_no}
                                  disabled={!item.lot || isLoading}
                                  onChange={(value) => {
                                    const fromSerial = Math.max(
                                      0,
                                      Math.floor(value),
                                    );

                                    updateItem(rowKey, {
                                      bag_from_serial_no: fromSerial,
                                      bag_to_serial_no:
                                        item.bags > 0
                                          ? fromSerial + item.bags - 1
                                          : 0,
                                    });
                                  }}
                                />
                              </td>

                              <td className="px-3 py-3 text-right tabular-nums">
                                {item.bag_to_serial_no || "—"}
                              </td>

                              <td className="px-3 py-3 text-right font-medium tabular-nums">
                                {Number(item.quantity || 0).toFixed(3)}
                              </td>

                              <td className="px-3 py-3">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-destructive hover:text-destructive"
                                  onClick={() => removeItem(rowKey)}
                                  aria-label="Remove Lot"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>

                      <tfoot className="bg-muted/50">
                        <tr className="font-semibold">
                          <td colSpan={5} className="px-3 py-3 text-right">
                            Total
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums">
                            {items.reduce(
                              (total, item) => total + Number(item.bags || 0),
                              0,
                            )}
                          </td>
                          <td colSpan={3}></td>
                          <td className="px-3 py-3 text-right tabular-nums">
                            {items
                              .reduce(
                                (total, item) =>
                                  total + Number(item.quantity || 0),
                                0,
                              )
                              .toFixed(3)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            );
          }}
        </form.Field>
      </FormSection>

      {/* Transport Information */}
      <FormSection
        title="Transport Information"
        description="Choose how the goods will be transported."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Transport Type */}
          <form.Field name="transport_type">
            {(field) => (
              <FieldRow label="Transport Type">
                <select
                  id={field.name}
                  name={field.name}
                  value={String(field.state.value ?? "Own Transport")}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    const value = event.target.value;
                    field.handleChange(value);

                    if (value === "Own Transport") {
                      form.setFieldValue("transporter", "");
                    }
                  }}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
                >
                  <option value="Own Transport">Own Transport</option>
                  <option value="Third Party">Third Party</option>
                </select>
              </FieldRow>
            )}
          </form.Field>

          {/* Transporter - only for Third Party */}
          <form.Subscribe selector={(state) => state.values.transport_type}>
            {(transportType) =>
              transportType === "Third Party" ? (
                <form.Field name="transporter">
                  {(field) => (
                    <FieldRow label="Transporter">
                      <LinkField
                        value={String(field.state.value ?? "")}
                        onChange={field.handleChange}
                        doctype="Transporter"
                        className="w-full"
                      />
                    </FieldRow>
                  )}
                </form.Field>
              ) : null
            }
          </form.Subscribe>

          {/* Vehicle Number */}
          <form.Field name="vehicle_number">
            {(field) => (
              <FieldRow label="Vehicle Number">
                <Input
                  id={field.name}
                  name={field.name}
                  value={String(field.state.value ?? "")}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Enter vehicle number"
                />
              </FieldRow>
            )}
          </form.Field>
        </div>

        <form.Field name="remarks">
          {(field) => (
            <FieldRow label="Remarks">
              <Textarea
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Enter transfer remarks"
                rows={3}
              />
            </FieldRow>
          )}
        </form.Field>
      </FormSection>
    </div>
  );
}
