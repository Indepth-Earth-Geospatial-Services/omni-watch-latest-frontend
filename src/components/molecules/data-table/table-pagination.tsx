import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Table } from "@tanstack/react-table";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  itemLabel?: string;
}

export function TablePagination<TData>({
  table,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  itemLabel = "record",
}: DataTablePaginationProps<TData>) {
  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex;

  const handleNext = () => {
    if (table.getCanNextPage() || hasNextPage) {
      table.nextPage();
      fetchNextPage?.();
    }
  };

  const isNextDisabled = !table.getCanNextPage() && !hasNextPage;
  const isNextLoading = isFetchingNextPage;

  return (
    <div className="absolute bottom-0 w-full px-2.5">
      <div className="flex w-full items-center justify-between">
        <p className="text-sm tracking-[-2%] text-gray-500">
          Showing{" "}
          <span className="font-medium text-gray-700">{currentPage + 1}</span>{" "}
          of <span className="font-medium text-gray-700">{pageCount}</span>{" "}
          {pageCount === 1 ? itemLabel : `${itemLabel}s`}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className={cn(
              "text-sm tracking-[-2%] text-gray-500",
              table.getCanPreviousPage()
                ? "cursor-pointer border-gray-300 text-gray-700 hover:bg-gray-50"
                : "cursor-not-allowed border-gray-200 text-gray-300",
            )}
          >
            Previous
          </Button>

          <Button
            variant="ghost"
            onClick={handleNext}
            disabled={isNextDisabled || isNextLoading}
            className={cn(
              "text-sm tracking-[-2%] text-gray-500",
              !isNextDisabled && !isNextLoading
                ? "cursor-pointer border-gray-300 text-gray-700 hover:bg-gray-50"
                : "cursor-not-allowed border-gray-200 text-gray-300",
            )}
          >
            {isNextLoading ? <Spinner /> : <>Next</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
