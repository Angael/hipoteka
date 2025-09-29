import { Table } from "@mantine/core";
import { memo } from "react";
import { formatCurrency } from "./utils";
import type { AmortizationRow } from "./loanCalculations";

type Props = {
  row: AmortizationRow;
  isHovered: boolean;
  onMouseEnter: (row: AmortizationRow) => void;
};

const ScheduleTableRow = ({ row, isHovered, onMouseEnter }: Props) => {
  return (
    <Table.Tr
      key={row.month}
      onMouseEnter={() => onMouseEnter(row)}
      bg={isHovered ? "gray.2" : undefined}
    >
      <Table.Td>{row.month}</Table.Td>
      <Table.Td>{formatCurrency(row.remainingBalance)}</Table.Td>
      <Table.Td>{formatCurrency(row.payment)}</Table.Td>
      <Table.Td>{formatCurrency(row.principal)}</Table.Td>
      <Table.Td>{formatCurrency(row.interest)}</Table.Td>
      <Table.Td>{formatCurrency(row.overpayment)}</Table.Td>
    </Table.Tr>
  );
};

export default memo(ScheduleTableRow);
