import {
  Divider,
  Group,
  Stack,
  Text,
  Title,
  Card,
  SimpleGrid
} from "@mantine/core";
import type { LoanComputationResult } from "./loanCalculations";
import { formatCurrency } from "./utils";
import { memo, useMemo } from "react";
import { AreaChart } from "@mantine/charts";

type Props = {
  result: LoanComputationResult;
  overpayment: number | "";
};

const Summary = ({ result, overpayment }: Props) => {
  const payoffYears = Math.floor(result.payoffMonths / 12);
  const payoffMonthsRemainder = result.payoffMonths % 12;
  const numericOverpayment = Number(overpayment);

  const chartData = useMemo(
    () =>
      result.schedule.map((element) => ({
        date: `Miesiąc ${element.month}`,
        payment: Math.round(element.payment),
        interest: Math.round(element.interest),
        principalAndOverpayment:
          Math.round(element.principal) + Math.round(element.overpayment)
      })),
    [result]
  );

  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
      <Card withBorder padding="md">
        <Stack gap="sm">
          <Title order={3}>Wizualizacja spłaty kredytu</Title>
          <AreaChart
            h={300}
            data={chartData}
            dataKey="date"
            series={[
              { name: "payment", color: "gray.6", label: "Miesięczna rata" },
              {
                name: "interest",
                color: "red.6",
                label: "Odsetki"
              },
              {
                name: "principalAndOverpayment",
                color: "indigo.6",
                label: "Kapitał i nadpłata"
              }
            ]}
            curveType="monotone"
            withLegend={true}
            xAxisProps={{ hide: true }}
            yAxisProps={{ hide: true }}
            dotProps={{ display: "none" }}
          />
        </Stack>
      </Card>
      <Card withBorder padding="md">
        <Stack gap="sm">
          <Title order={3}>Podsumowanie</Title>
          <Text fw={600} size="lg">
            Miesięczna rata (z nadpłatą):{" "}
            {formatCurrency(result.actualFirstPayment)}
          </Text>
          <Text c="dimmed" size="sm">
            Podstawowa rata (bez nadpłaty):{" "}
            {formatCurrency(result.monthlyPayment)}
          </Text>
          {result.firstPaymentBreakdown && (
            <Stack gap={4} pt="xs">
              <Text size="sm">
                Kapitał: {formatCurrency(result.firstPaymentBreakdown.capital)}
              </Text>
              <Text size="sm">
                Odsetki: {formatCurrency(result.firstPaymentBreakdown.interest)}
              </Text>
              {numericOverpayment > 0 && (
                <Text size="sm">
                  Nadpłata:{" "}
                  {formatCurrency(result.firstPaymentBreakdown.overpayment)}
                </Text>
              )}
            </Stack>
          )}
          <Divider my="sm" />
          <Group gap="md" wrap="wrap">
            <Text size="sm">
              Czas spłaty:{" "}
              {result.payoffMonths
                ? `${result.payoffMonths} mies. (${payoffYears} lat ${payoffMonthsRemainder} mies.)`
                : "-"}
            </Text>
            <Text size="sm">
              Całkowite odsetki: {formatCurrency(result.totalInterestPaid)}
            </Text>
            <Text size="sm">
              Całkowita spłacona kwota: {formatCurrency(result.totalPaid)}
            </Text>
          </Group>
        </Stack>
      </Card>
    </SimpleGrid>
  );
};

export default memo(Summary);
