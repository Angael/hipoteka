import { PieChart } from "@mantine/charts";
import { memo } from "react";
import { useHoverState } from "./hover-state";
import { Stack, Title } from "@mantine/core";

const PieChartForRow = () => {
  const { interest, overpayment, principal, payment, month } = useHoverState(
    (s) => s.hoveredRow
  );

  // calculate percentages
  if (payment === 0) {
    return null;
  }

  const interestPercentage = (interest / payment) * 100;
  const principalPercentage = (principal / payment) * 100;
  const overpaymentPercentage = (overpayment / payment) * 100;

  return (
    <Stack>
      <Title order={4} style={{ textAlign: "center" }}>
        Szczegóły miesiąca {month}
      </Title>
      <PieChart
        withLabels
        withLabelsLine
        labelsPosition="inside"
        labelsType="value"
        size={300}
        data={[
          {
            name: `Spłata kapitału ${principalPercentage.toFixed(1)}%`,
            value: principal,
            color: "indigo.6"
          },
          {
            name: `Odsetki ${interestPercentage.toFixed(1)}%`,
            value: interest,
            color: "red.6"
          },
          {
            name: `Nadpłata ${overpaymentPercentage.toFixed(1)}%`,
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
