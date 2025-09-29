import { PieChart } from "@mantine/charts";
import { memo } from "react";
import { useHoverState } from "./hover-state";
import { Stack, Title } from "@mantine/core";

const PieChartForRow = () => {
  const { interest, overpayment, principal } = useHoverState(
    (s) => s.hoveredRow
  );

  return (
    <Stack>
      <Title order={4} style={{ textAlign: "center" }}>
        Szczegóły miesiąca {useHoverState((s) => s.hoveredRow.month)}
      </Title>
      <PieChart
        withLabels
        withLabelsLine
        labelsPosition="inside"
        labelsType="value"
        size={300}
        data={[
          {
            name: "Spłata kapitału",
            value: principal,
            color: "indigo.6"
          },
          {
            name: "Odsetki",
            value: interest,
            color: "red.6"
          },
          {
            name: "Nadpłata",
            value: overpayment,
            color: "teal.6"
          }
        ]}
        withTooltip
        tooltipDataSource="segment"
        mx="auto"
      />
    </Stack>
  );
};

export default memo(PieChartForRow);
