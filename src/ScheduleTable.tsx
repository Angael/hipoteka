import { ScrollArea, Table, Text } from "@mantine/core";
import { memo } from "react";
import { useHoverState } from "./hover-state";
import type { AmortizationRow } from "./loanCalculations";
import ScheduleTableRow from "./ScheduleTableRow";

type Props = {
  schedule: AmortizationRow[];
};

const ScheduleTable = ({ schedule }: Props) => {
  const { hoveredRow, setHoverState } = useHoverState();

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
            schedule.map((row) => (
              <ScheduleTableRow
                key={row.id}
                row={row}
                isHovered={hoveredRow.month === row.month}
                onMouseEnter={setHoverState}
              />
            ))
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
};

export default memo(ScheduleTable);
