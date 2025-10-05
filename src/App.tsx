import {
  Card,
  Center,
  Checkbox,
  Container,
  Grid,
  NumberInput,
  SimpleGrid,
  Stack,
  Text,
  Title
} from "@mantine/core";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useHoverState } from "./hover-state";
import { generateAmortizationSchedule } from "./loanCalculations";
import PieChartForRow from "./PieChartForRow";
import ScheduleTable from "./ScheduleTable";
import Summary from "./Summary";

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
  const [annualInterest, setAnnualInterest] = useState<number | "">(6);
  const [years, setYears] = useState<number | "">(30);
  const [overpayment, setOverpayment] = useState<number | "">(0);
  const [isFallingRates, setIsFallingRates] = useState<boolean>(false);

  const numericPrincipal = typeof principal === "number" ? principal : 0;
  const numericAnnualInterest =
    typeof annualInterest === "number" ? annualInterest : 0;
  const numericYears = typeof years === "number" ? years : 0;

  const result = useMemo(
    () =>
      generateAmortizationSchedule({
        principal: numericPrincipal,
        annualInterestRate: numericAnnualInterest,
        years: numericYears,
        monthlyOverpayment: Number(overpayment),
        isFallingRates
      }),
    [
      numericPrincipal,
      numericAnnualInterest,
      numericYears,
      overpayment,
      isFallingRates
    ]
  );

  useEffect(() => {
    const { setHoverState, resetHoverState } = useHoverState.getState();
    if (result.schedule[0]) {
      setHoverState(result.schedule[0]);
    } else {
      resetHoverState();
    }
  }, [result]);

  return (
    <Container size="xl" py="xl">
      <Stack gap="md">
        <div>
          <Title order={1}>Kalkulator hipoteki</Title>
          <Text c="dimmed">
            Policz ratę, czas spłaty i całkowity koszt kredytu z dowolną
            nadpłatą.
          </Text>
        </div>

        <Card withBorder padding="md">
          <Stack gap="lg">
            <SimpleGrid cols={{ xs: 1, sm: 2, md: 4 }} spacing="lg">
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
              <Checkbox
                checked={isFallingRates}
                onChange={(e) => setIsFallingRates(e.currentTarget.checked)}
                label="Malejace raty"
                m="xs"
              />
            </SimpleGrid>
          </Stack>
        </Card>

        <Summary result={result} />

        <Card withBorder padding="md">
          <Stack gap="md">
            <Title order={3}>Harmonogram spłat</Title>

            {result.schedule.length < 600 ? (
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
            ) : (
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
