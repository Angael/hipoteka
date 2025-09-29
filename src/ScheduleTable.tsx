import { ScrollArea, Table, Text } from "@mantine/core";
import type { AmortizationRow } from "./loanCalculations";
import { memo, startTransition } from "react";
import { formatCurrency } from "./utils";
import { useHoverState } from "./hover-state";

type Props = {
  schedule: AmortizationRow[];
};

const ScheduleTable = ({ schedule }: Props) => {
  const setHoverState = useHoverState((s) => s.setHoverState);

  return (
    <ScrollArea h={400} type="hover">
      <Table striped highlightOnHover withColumnBorders stickyHeader>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Miesiąc</Table.Th>
            <Table.Th>Pozostały kapitał</Table.Th>
            <Table.Th>Rata</Table.Th>
            <Table.Th>Spłata kapitału</Table.Th>
            <Table.Th>Odsetki</Table.Th>
            <Table.Th>Nadpłata</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {schedule.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Text ta="center" c="dimmed">
                  Uzupełnij dane kredytu, aby zobaczyć harmonogram.
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            schedule.slice(0, 600).map((row) => (
              <Table.Tr
                key={row.month}
                onMouseEnter={() => startTransition(() => setHoverState(row))}
              >
                <Table.Td>{row.month}</Table.Td>
                <Table.Td>{formatCurrency(row.remainingBalance)}</Table.Td>
                <Table.Td>{formatCurrency(row.payment)}</Table.Td>
                <Table.Td>{formatCurrency(row.principal)}</Table.Td>
                <Table.Td>{formatCurrency(row.interest)}</Table.Td>
                <Table.Td>{formatCurrency(row.overpayment)}</Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
};

export default memo(ScheduleTable);
