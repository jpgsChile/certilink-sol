import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STATUS_LABELS, STATUS_VARIANT } from "@/lib/constants";

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  emptyMessage?: string;
}

export function DataTable({ columns, data, emptyMessage = "No hay datos disponibles" }: DataTableProps) {
  return (
    <div className="card-enterprise overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="table-enterprise">
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => (
                <TableRow key={idx}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render
                        ? col.render(row[col.key], row)
                        : col.key === "estado"
                          ? (
                            <span className={STATUS_VARIANT[row[col.key] as string] || ""}>
                              {STATUS_LABELS[row[col.key] as string] || (row[col.key] as string)}
                            </span>
                          )
                          : (row[col.key] as ReactNode)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}