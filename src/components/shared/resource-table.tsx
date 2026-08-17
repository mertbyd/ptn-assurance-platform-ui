import type { ReactNode } from "react";
import { Table } from "@chakra-ui/react";

export interface ResourceColumn<T> {
  key: string;
  title: string;
  render: (item: T) => ReactNode;
  className?: string;
}

interface ResourceTableProps<T> {
  columns: ResourceColumn<T>[];
  data: T[];
  emptyText?: string;
}

export function ResourceTable<T>({ columns, data, emptyText = "Kayit yok" }: ResourceTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/60">
      <div className="overflow-x-auto">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              {columns.map((column) => (
                <Table.ColumnHeader key={column.key} className={column.className}>
                  {column.title}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.length ? (
              data.map((item, index) => (
                <Table.Row key={index}>
                  {columns.map((column) => (
                    <Table.Cell key={column.key} className={column.className}>
                      {column.render(item)}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={columns.length} className="h-24 text-center text-slate-500">
                  {emptyText}
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </div>
    </div>
  );
}
