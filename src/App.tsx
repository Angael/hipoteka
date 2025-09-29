import {
  Card,
  Center,
  Container,
  Divider,
  Group,
  NumberInput,
  SimpleGrid,
  Stack,
  Text,
  Title
} from "@mantine/core";
import { startTransition, useEffect, useMemo, useState } from "react";
import { generateAmortizationSchedule } from "./loanCalculations";
import PieChartForRow from "./PieChartForRow";
import ScheduleTable from "./ScheduleTable";
import { formatCurrency } from "./utils";
import { Grid } from "@mantine/core";
import { useHoverState } from "./hover-state";

const integerFormatter = new Intl.NumberFormat("pl-PL");

const createNumberInputChangeHandler =
  (setter: (value: number | "") => void) => (value: string | number) =>
    startTransition(() => {
      if (value === "") {
        setter("");
        return;
      }

      if (typeof value === "number") {
        setter(Number.isFinite(value) ? value : "");
        return;
      }

      const normalized = value.replace(/\s/g, "").replace(",", ".");
      const parsed = Number(normalized);
      setter(Number.isFinite(parsed) ? parsed : "");
    });

function App() {
  const [principal, setPrincipal] = useState<number | "">(580_000);
  const [annualInterest, setAnnualInterest] = useState<number | "">(6.5);
  const [years, setYears] = useState<number | "">(30);
  const [overpayment, setOverpayment] = useState<number | "">(1_400);

  const numericPrincipal = typeof principal === "number" ? principal : 0;
  const numericAnnualInterest =
    typeof annualInterest === "number" ? annualInterest : 0;
  const numericYears = typeof years === "number" ? years : 0;
  const numericOverpayment = typeof overpayment === "number" ? overpayment : 0;

  const result = useMemo(
    () =>
      generateAmortizationSchedule({
        principal: numericPrincipal,
        annualInterestRate: numericAnnualInterest,
        years: numericYears,
        monthlyOverpayment: numericOverpayment
      }),
    [numericPrincipal, numericAnnualInterest, numericYears, numericOverpayment]
  );

  // Change const setHoverState = useHoverState((s) => s.setHoverState); after every input change
  useEffect(() => {
    const { setHoverState } = useHoverState.getState();
    setHoverState(result.schedule[0] || null);
  }, [result]);

  console.log(result);

  const payoffYears = Math.floor(result.payoffMonths / 12);
  const payoffMonthsRemainder = result.payoffMonths % 12;

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1}>Kalkulator hipoteki</Title>
          <Text c="dimmed">
            Policz ratę, czas spłaty i całkowity koszt kredytu z dowolną
            nadpłatą.
          </Text>
        </div>

        <Card withBorder padding="xl">
          <Stack gap="lg">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <NumberInput
                label="Kwota kredytu (PLN)"
                value={principal}
                onChange={createNumberInputChangeHandler(setPrincipal)}
                min={0}
                step={1_000}
              />
              <NumberInput
                label="Oprocentowanie roczne (%)"
                value={annualInterest}
                onChange={createNumberInputChangeHandler(setAnnualInterest)}
                min={0}
                step={0.1}
              />
              <NumberInput
                label="Okres kredytowania (lata)"
                value={years}
                onChange={createNumberInputChangeHandler(setYears)}
                min={1}
                step={1}
              />
              <NumberInput
                label="Miesięczna nadpłata (PLN)"
                value={overpayment}
                onChange={createNumberInputChangeHandler(setOverpayment)}
                min={0}
                step={100}
              />
            </SimpleGrid>
          </Stack>
        </Card>

        <Card withBorder padding="xl">
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
                  Kapitał:{" "}
                  {formatCurrency(result.firstPaymentBreakdown.capital)}
                </Text>
                <Text size="sm">
                  Odsetki:{" "}
                  {formatCurrency(result.firstPaymentBreakdown.interest)}
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

        <Card withBorder padding="xl">
          <Stack gap="md">
            <Group justify="space-between" align="flex-end">
              <Title order={3}>Harmonogram spłat</Title>
              <Text size="sm" c="dimmed">
                Łącznie {integerFormatter.format(result.schedule.length)} rat
              </Text>
            </Group>

            <Grid>
              <Grid.Col span={{ base: 12, md: 8, lg: 8 }}>
                <ScheduleTable schedule={result.schedule} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4, lg: 4 }}>
                <Center h="100%">
                  <PieChartForRow />
                </Center>
              </Grid.Col>
            </Grid>

            {result.schedule.length > 600 && (
              <Text size="xs" c="dimmed">
                Wyświetlono pierwsze 600 rat. Zawęż parametry, aby zobaczyć
                pełny harmonogram.
              </Text>
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}

export default App;
