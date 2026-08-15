import { AreaChart } from "@mantine/charts";
import { Card, NumberInput, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useMemo, useState } from "react";
import {
  generateAmortizationSchedule,
  type LoanParameters
} from "./loanCalculations";
import { formatCurrency } from "./utils";

type Props = {
  parameters: LoanParameters;
};

const SingleOverpayment = ({ parameters }: Props) => {
  const [lumpSum, setLumpSum] = useState<number | string>(10_000);
  const amount = typeof lumpSum === "number" ? Math.max(lumpSum, 0) : 0;

  const comparison = useMemo(() => {
    const baseline = generateAmortizationSchedule({
      ...parameters,
      oneTimeOverpayment: 0
    });
    const withLumpSum = generateAmortizationSchedule({
      ...parameters,
      oneTimeOverpayment: amount
    });
    const chartLength = Math.max(baseline.schedule.length, withLumpSum.schedule.length);
    const chartData = Array.from({ length: chartLength }, (_, index) => ({
      month: `Miesiąc ${index + 1}`,
      bezNadplaty: baseline.schedule[index]?.remainingBalance ?? 0,
      zNadplata: withLumpSum.schedule[index]?.remainingBalance ?? 0
    }));

    return {
      baseline,
      withLumpSum,
      chartData,
      interestSaved: Math.max(
        baseline.totalInterestPaid - withLumpSum.totalInterestPaid,
        0
      ),
      monthsSaved: Math.max(baseline.payoffMonths - withLumpSum.payoffMonths, 0),
      nextMonthInterestSaved: Math.max(
        (baseline.schedule[1]?.interest ?? 0) -
          (withLumpSum.schedule[1]?.interest ?? 0),
        0
      ),
      firstYearInterestSaved: Math.max(
        baseline.schedule
          .slice(0, 12)
          .reduce((sum, row) => sum + row.interest, 0) -
          withLumpSum.schedule
            .slice(0, 12)
            .reduce((sum, row) => sum + row.interest, 0),
        0
      )
    };
  }, [amount, parameters]);

  return (
    <Stack gap="md" mt="sm">
      <Card withBorder radius="lg" p="lg">
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          <Stack gap="xs">
            <Text tt="uppercase" size="xs" fw={700} c="teal.8" lts={1.1}>
              Jednorazowa decyzja
            </Text>
            <Title order={2}>Co da jedna nadpłata dzisiaj?</Title>
            <Text c="dimmed" lh={1.55}>
              Cała kwota od razu zmniejsza kapitał. Dzięki temu już kolejna rata
              zawiera mniej odsetek, a więcej spłaty długu.
            </Text>
          </Stack>
          <NumberInput
            label="Kwota jednorazowej nadpłaty (PLN)"
            value={lumpSum}
            onChange={setLumpSum}
            min={0}
            step={1_000}
            decimalScale={2}
            size="lg"
          />
        </SimpleGrid>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <Card withBorder radius="lg" p="lg">
          <Text size="sm" c="dimmed">Mniej odsetek łącznie</Text>
          <Text fz={28} fw={800} c="teal.8">{formatCurrency(comparison.interestSaved)}</Text>
        </Card>
        <Card withBorder radius="lg" p="lg">
          <Text size="sm" c="dimmed">Kredyt krótszy o</Text>
          <Text fz={28} fw={800}>{comparison.monthsSaved} mies.</Text>
        </Card>
        <Card withBorder radius="lg" p="lg">
          <Text size="sm" c="dimmed">Efekt w następnej racie</Text>
          <Text fz={28} fw={800}>{formatCurrency(comparison.nextMonthInterestSaved)}</Text>
          <Text size="xs" c="dimmed">mniej odsetek</Text>
        </Card>
        <Card withBorder radius="lg" p="lg">
          <Text size="sm" c="dimmed">Efekt w pierwszym roku</Text>
          <Text fz={28} fw={800}>{formatCurrency(comparison.firstYearInterestSaved)}</Text>
          <Text size="xs" c="dimmed">mniej odsetek</Text>
        </Card>
      </SimpleGrid>

      <Card withBorder radius="lg" p="lg">
        <Title order={3} mb="xs">Jak szybciej znika zadłużenie</Title>
        <Text size="sm" c="dimmed" mb="lg">
          Zielona linia uwzględnia jednorazową nadpłatę w pierwszym miesiącu.
        </Text>
        <AreaChart
          h={320}
          data={comparison.chartData}
          dataKey="month"
          series={[
            { name: "bezNadplaty", label: "Bez nadpłaty", color: "gray.6" },
            { name: "zNadplata", label: "Po nadpłacie", color: "teal.7" }
          ]}
          curveType="monotone"
          withLegend
          xAxisProps={{ hide: true }}
          yAxisProps={{ width: 82 }}
        />
      </Card>

      <Text size="xs" c="dimmed">
        Symulacja zakłada, że bank po nadpłacie skraca okres kredytu i pozostawia
        podstawową ratę bez zmian. Sprawdź w swoim banku dyspozycję nadpłaty i ewentualną prowizję.
      </Text>
    </Stack>
  );
};

export default SingleOverpayment;
