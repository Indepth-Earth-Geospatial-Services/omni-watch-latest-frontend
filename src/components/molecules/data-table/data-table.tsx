import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ReactNode, useMemo, useState } from "react";
import { TablePagination } from "./table-pagination";
import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className?: string;
    headerClassName?: string;
  }
}

export type TableFilter<TData> = {
  key: keyof TData;
  value: string;
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  getRowId?: (row: TData) => string;

  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  onRowClick?: (row: TData) => void;

  isLoading?: boolean;
  searchTerm?: string;
  searchableKeys?: (keyof TData)[];

  filters?: TableFilter<TData>[];

  className?: string;
  classNameHeader?: string;
  classNameTableHead?: string;
  classNameRow?: string;
  classNameCell?: string;
  classNameEmptyTable?: string;
  skeletonLoaderNum?: number;
  emptyTableText?: ReactNode;
  itemLable?: string;
  pageSize?: number;
  pageCount?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  getRowId,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onRowClick,
  isLoading,
  searchTerm,
  searchableKeys,
  filters,
  skeletonLoaderNum = 7,
  className,
  classNameHeader,
  classNameTableHead,
  classNameRow,
  classNameCell,
  classNameEmptyTable,
  emptyTableText = "No Orders",
  itemLable,
  pageSize = 7,
  pageCount,
}: DataTableProps<TData, TValue>) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize,
  });
  const filteredData = useMemo(() => {
    let result = data;

    if (filters?.length) {
      const activeFilters = filters.filter((f) => f.value !== "");

      if (activeFilters.length) {
        result = result.filter((row) =>
          activeFilters.every((filter) => {
            const value = row[filter.key];
            if (value == null) return false;
            return String(value).toLowerCase() === filter.value.toLowerCase();
          }),
        );
      }
    }

    if (searchTerm && searchableKeys?.length) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((row) =>
        searchableKeys.some((key) => {
          const value = row[key];
          if (!value) return false;
          return String(value).toLowerCase().includes(lower);
        }),
      );
    }

    return result;
  }, [data, filters, searchTerm, searchableKeys]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    pageCount: pageCount,
    getRowId,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
  });
  const LoadingSkeletons = useMemo(
    () =>
      Array.from({ length: skeletonLoaderNum }).map((_, rowIndex) => (
        <TableRow key={`skeleton-${rowIndex}`} className="h-14">
          {columns.map((_, colIndex) => (
            <TableCell key={colIndex}>
              <div className="h-5 w-full animate-pulse rounded-md bg-muted" />
            </TableCell>
          ))}
        </TableRow>
      )),
    [columns, skeletonLoaderNum],
  );

  return (
    <div className={cn("relative pb-10")}>
      <div
        className={cn(
          "flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm",
          className,
        )}
      >
        <Table className="w-full overflow-x-auto">
          <TableHeader className={cn("bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground", classNameHeader)}>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-inherit">
                {group.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "px-3.5 pb-2 pt-5 text-xs font-medium capitalize tracking-[-3%] text-gray-500",
                      classNameTableHead,
                      header.column.columnDef.meta?.headerClassName ??
                        header.column.columnDef.meta?.className,
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading || isFetchingNextPage ? (
              LoadingSkeletons
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "h-14",
                    onRowClick
                      ? "cursor-pointer hover:bg-gray-50"
                      : "cursor-default",
                    classNameRow,
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "px-3.5 text-sm font-medium tracking-[-3%] text-gray-800",
                        cell.column.columnDef.meta?.className,
                        classNameCell,
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className={cn("h-24 text-center", classNameEmptyTable)}
                >
                  {emptyTableText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {(table.getPageCount() > 1 || hasNextPage) && (
        <TablePagination
          itemLabel={itemLable}
          table={table}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
        />
      )}
    </div>
  );
}
