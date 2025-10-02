import {
  Divider,
  Stack,
  Text,
  Title,
  Card,
  SimpleGrid,
  Alert
} from "@mantine/core";
import type { LoanComputationResult } from "./loanCalculations";
import { formatCurrency } from "./utils";
import { memo, useMemo } from "react";
import { AreaChart } from "@mantine/charts";

type Props = {
  result: LoanComputationResult;
};

const Summary = ({ result }: Props) => {
  const payoffYears = Math.floor(result.payoffMonths / 12);
  const payoffMonthsRemainder = result.payoffMonths % 12;

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
          {result.schedule.length < 600 ? (
            <AreaChart
              h={300}
              data={chartData}
              dataKey="date"
              series={[
                { name: "payment", color: "gray.6", label: "Miesięczna rata" },
                { name: "interest", color: "red.6", label: "Odsetki" },
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
          ) : (
            <Alert title="Wizualizacja niedostępna" color="yellow">
              Ze względu na dużą liczbę rat (powyżej 600) wizualizacja spłaty
              kredytu została wyłączona. Zawęż parametry, aby ją zobaczyć.
            </Alert>
          )}
        </Stack>
      </Card>

      <Card withBorder padding="md">
        <Stack gap="sm">
          <Title order={3}>Podsumowanie</Title>

          <div>
            <Text size="md">
              Miesięczna rata (z nadpłatą):{" "}
              <Text span fw={600}>
                {formatCurrency(result.actualFirstPayment)}
              </Text>
            </Text>

            {result.actualFirstPayment !== result.monthlyPayment && (
              <Text c="dimmed" size="sm">
                Podstawowa rata (bez nadpłaty):{" "}
                <Text span fw={600}>
                  {formatCurrency(result.monthlyPayment)}
                </Text>
              </Text>
            )}
          </div>

          <Text size="md">
            Czas spłaty:{" "}
            <Text span fw={600}>
              {`${result.payoffMonths} mies. (${payoffYears} lat ${payoffMonthsRemainder} mies.)`}
            </Text>
          </Text>

          <Divider my="sm" />
          <SimpleGrid cols={{ base: 1, md: 3 }}>
            <Stack align="center" gap="0">
              <Text size="md">Całkowite odsetki</Text>
              <Text size="lg" fw="bold">
                {formatCurrency(result.totalInterestPaid)}
              </Text>
            </Stack>

            <Stack align="center" gap="0">
              <Text size="md">Całkowita spłacona kwota</Text>
              <Text size="lg" fw="bold">
                {formatCurrency(result.totalPaid)}
              </Text>
            </Stack>

            <Stack align="center" gap="0" bd={1}>
              <Text size="md">Procent odsetek</Text>
              <Text size="lg" fw="bold">
                {((result.totalInterestPaid / result.totalPaid) * 100).toFixed(
                  2
                )}
                %
              </Text>
            </Stack>
          </SimpleGrid>
        </Stack>
      </Card>
    </SimpleGrid>
  );
};

export default memo(Summary);
