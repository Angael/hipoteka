import {
  Card,
  Center,
  Checkbox,
  Container,
  Grid,
  NumberInput,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Title
} from "@mantine/core";
import { useEffect, useMemo } from "react";
import { useHoverState } from "./hover-state";
import { generateAmortizationSchedule } from "./loanCalculations";
import PieChartForRow from "./PieChartForRow";
import ScheduleTable from "./ScheduleTable";
import Summary from "./Summary";
import { useDefferedInputState } from "./utils";

function App() {
  const [principal, principalProps] = useDefferedInputState<number | string>(
    580_000
  );
  const [annualInterest, annualInterestProps] = useDefferedInputState<
    number | string
  >(6);
  const [years, yearsProps] = useDefferedInputState<number | string>(30);
  const [overpayment, overpaymentProps] = useDefferedInputState<
    number | string
  >(0);
  const [isFallingRates, isFallingRatesProps] =
    useDefferedInputState<boolean>(false);

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
                {...principalProps}
                min={0}
                step={1_000}
              />
              <NumberInput
                label="Oprocentowanie roczne (%)"
                {...annualInterestProps}
                min={0}
                step={0.1}
              />
              <NumberInput
                label="Okres kredytowania (lata)"
                {...yearsProps}
                min={1}
                step={1}
              />
              <NumberInput
                label="Miesięczna nadpłata (PLN)"
                {...overpaymentProps}
                min={0}
                step={100}
              />
              <Checkbox
                checked={isFallingRatesProps.value}
                onChange={(e) =>
                  isFallingRatesProps.onChange(e.currentTarget.checked)
                }
                label="Malejace raty"
                m="xs"
              />
            </SimpleGrid>
          </Stack>
        </Card>

        <Tabs defaultValue="summary">
          <Tabs.List>
            <Tabs.Tab value="summary">Podsumowanie</Tabs.Tab>
            <Tabs.Tab value="ikze">Porównanie z IKZE</Tabs.Tab>
            <Tabs.Tab value="single_payment">Pojedyńcza nadpłata</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="summary" mt="sm">
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
          </Tabs.Panel>
          <Tabs.Panel value="ikze">Porównanie z IKZE</Tabs.Panel>
          <Tabs.Panel value="single_payment">Pojedyńcza nadpłata</Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}

export default App;
