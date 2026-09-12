import { StatusBadge } from "./status-badge";

type DataTableProps = {
  columns: string[];
  rows: string[][];
  statusColumns?: number[];
  moneyColumns?: number[];
  firstColumnLabel?: string;
};

export function DataTable({
  columns,
  rows,
  statusColumns = [],
  moneyColumns = [],
  firstColumnLabel,
}: DataTableProps) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${row[0]}-${rowIndex}`}>
              {row.map((cell, columnIndex) => (
                <td className={moneyColumns.includes(columnIndex) ? "money-good" : undefined} key={`${cell}-${columnIndex}`}>
                  {columnIndex === 0 ? (
                    <>
                      <strong>{cell}</strong>
                      {firstColumnLabel && <small className="cell-sub">{firstColumnLabel}</small>}
                    </>
                  ) : statusColumns.includes(columnIndex) ? (
                    <StatusBadge>{cell}</StatusBadge>
                  ) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
