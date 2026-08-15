import {
  Card,
  Center,
  Checkbox,
  Container,
  Grid,
  NumberInput,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Title
} from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { useHoverState } from "./hover-state";
import IkzeComparison from "./IkzeComparison";
import InputHelp from "./InputHelp";
import {
  generateAmortizationSchedule,
  type LoanParameters
} from "./loanCalculations";
import PieChartForRow from "./PieChartForRow";
import ScheduleTable from "./ScheduleTable";
import SingleOverpayment from "./SingleOverpayment";
import Summary from "./Summary";
import { useDefferedInputState } from "./utils";

type MortgageMode = "existing" | "planned";

const help = {
  existingPrincipal: {
    title: "Pozostały kapitał",
    description:
      "Aktualny dług pozostały do oddania bankowi. Znajdziesz go w najnowszym harmonogramie lub bankowości internetowej.",
    effect: "Mniej = lepiej. Od tej kwoty bank nalicza kolejne odsetki."
  },
  plannedPrincipal: {
    title: "Planowana kwota kredytu",
    description:
      "Cena nieruchomości pomniejszona o wkład własny. Nie wpisuj tutaj pełnej ceny mieszkania, jeśli część płacisz z własnych środków.",
    effect: "Mniej = niższa rata i mniej odsetek przez cały okres."
  },
  interest: {
    title: "Oprocentowanie roczne",
    description:
      "Cena pożyczenia pieniędzy. Przy planowaniu warto sprawdzić też wariant wyższy o 1–2 punkty procentowe.",
    effect:
      "Mniej = zdecydowanie lepiej. Różnica narasta przez lata i wpływa na każdą kolejną ratę."
  },
  months: {
    title: "Liczba pozostałych rat",
    description:
      "Liczba miesięcy do końca obecnego kredytu. Przepisz ją z aktualnego harmonogramu.",
    effect: "Mniej = taniej łącznie, ale miesięczna rata jest zwykle wyższa."
  },
  years: {
    title: "Planowany okres kredytu",
    description:
      "Liczba lat spłaty. Kalkulator przeliczy ją na raty miesięczne.",
    effect:
      "Więcej lat obniża ratę, ale daje bankowi więcej czasu na naliczanie odsetek."
  },
  payment: {
    title: "Rata kapitałowo-odsetkowa",
    description:
      "Kwota z harmonogramu obejmująca spłatę długu i odsetki, ale bez ubezpieczenia oraz innych opłat.",
    effect:
      "Przepisanie kwoty z banku zachowuje jego sposób zaokrągleń i zwiększa dokładność symulacji."
  },
  firstInterest: {
    title: "Odsetki w najbliższej racie",
    description:
      "Odsetkowa część pierwszej raty widocznej w aktualnym harmonogramie.",
    effect:
      "Bank może naliczyć ją za niestandardowy okres, dlatego warto podać dokładną kwotę."
  },
  costs: {
    title: "Miesięczne koszty dodatkowe",
    description:
      "Ubezpieczenie i stałe opłaty doliczane do raty. Nie zmniejszają zadłużenia.",
    effect:
      "Mniej = lepiej. 100 zł przez 300 miesięcy to 30 000 zł, które nie spłaca kapitału."
  },
  overpayment: {
    title: "Regularna miesięczna nadpłata",
    description:
      "Dodatkowa kwota kierowana co miesiąc bezpośrednio na kapitał ponad zwykłą ratę.",
    effect:
      "Więcej = szybciej i zwykle taniej. Najpierw zachowaj poduszkę finansową i sprawdź prowizję banku."
  }
} as const;

function App() {
  const [mode, setMode] = useState<MortgageMode>("existing");
  const [principal, principalProps] =
    useDefferedInputState<number | string>(544_772.58);
  const [annualInterest, annualInterestProps] =
    useDefferedInputState<number | string>(5.9);
  const [termMonths, termMonthsProps] =
    useDefferedInputState<number | string>(351);
  const [scheduledPayment, scheduledPaymentProps] =
    useDefferedInputState<number | string>(3_261.64);
  const [firstInstallmentInterest, firstInstallmentInterestProps] =
    useDefferedInputState<number | string>(2_680.56);
  const [additionalCost, additionalCostProps] =
    useDefferedInputState<number | string>(232);
  const [overpayment, overpaymentProps] =
    useDefferedInputState<number | string>(1_400);
  const [plannedPrincipal, plannedPrincipalProps] =
    useDefferedInputState<number | string>(500_000);
  const [plannedInterest, plannedInterestProps] =
    useDefferedInputState<number | string>(6);
  const [plannedYears, plannedYearsProps] =
    useDefferedInputState<number | string>(30);
  const [plannedCost, plannedCostProps] =
    useDefferedInputState<number | string>(0);
  const [plannedOverpayment, plannedOverpaymentProps] =
    useDefferedInputState<number | string>(1_400);
  const [isFallingRates, isFallingRatesProps] =
    useDefferedInputState<boolean>(false);

  const parameters = useMemo<LoanParameters>(() => {
    if (mode === "planned") {
      return {
        principal: Number(plannedPrincipal),
        annualInterestRate: Number(plannedInterest),
        termMonths: Number(plannedYears) * 12,
        monthlyAdditionalCost: Number(plannedCost),
        monthlyOverpayment: Number(plannedOverpayment),
        scheduledPayment: 0,
        firstInstallmentInterest: 0,
        isFallingRates
      };
    }

    return {
      principal: Number(principal),
      annualInterestRate: Number(annualInterest),
      termMonths: Number(termMonths),
      scheduledPayment: Number(scheduledPayment),
      firstInstallmentInterest: Number(firstInstallmentInterest),
      monthlyAdditionalCost: Number(additionalCost),
      monthlyOverpayment: Number(overpayment),
      isFallingRates
    };
  }, [
    additionalCost,
    annualInterest,
    firstInstallmentInterest,
    isFallingRates,
    mode,
    overpayment,
    plannedCost,
    plannedInterest,
    plannedOverpayment,
    plannedPrincipal,
    plannedYears,
    principal,
    scheduledPayment,
    termMonths
  ]);

  const result = useMemo(
    () => generateAmortizationSchedule(parameters),
    [parameters]
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
    <Container size="xl" py={{ base: "md", md: "xl" }}>
      <Stack gap="md">
        <div>
          <Text tt="uppercase" size="xs" fw={700} c="teal.8" lts={1.2}>
            Świadoma decyzja finansowa
          </Text>
          <Title order={1}>Kalkulator hipoteki</Title>
          <Text c="dimmed">
            Policz ratę, czas spłaty i porównaj nadpłatę z inwestowaniem.
          </Text>
        </div>

        <Card withBorder p={{ base: "md", md: "lg" }} radius="lg">
          <Stack gap="lg">
            <div>
              <Text size="sm" fw={600} mb={7}>Na jakim etapie jesteś?</Text>
              <SegmentedControl
                fullWidth
                value={mode}
                onChange={(value) => setMode(value as MortgageMode)}
                data={[
                  { value: "existing", label: "Mam kredyt" },
                  { value: "planned", label: "Planuję kredyt" }
                ]}
                color="teal"
                size="md"
              />
            </div>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
              {mode === "existing" ? (
                <>
                  <NumberInput label="Pozostały kapitał (PLN)" {...principalProps} min={0} step={1_000} decimalScale={2} rightSection={<InputHelp {...help.existingPrincipal} />} rightSectionPointerEvents="all" />
                  <NumberInput label="Aktualne oprocentowanie (%)" {...annualInterestProps} min={0} step={0.1} decimalScale={2} rightSection={<InputHelp {...help.interest} />} rightSectionPointerEvents="all" />
                  <NumberInput label="Liczba pozostałych rat" {...termMonthsProps} min={1} step={1} rightSection={<InputHelp {...help.months} />} rightSectionPointerEvents="all" />
                  <NumberInput label="Rata kapitałowo-odsetkowa (PLN)" {...scheduledPaymentProps} min={0} step={10} decimalScale={2} rightSection={<InputHelp {...help.payment} />} rightSectionPointerEvents="all" />
                  <NumberInput label="Odsetki w najbliższej racie (PLN)" {...firstInstallmentInterestProps} min={0} step={10} decimalScale={2} rightSection={<InputHelp {...help.firstInterest} />} rightSectionPointerEvents="all" />
                  <NumberInput label="Miesięczne koszty dodatkowe (PLN)" {...additionalCostProps} min={0} step={10} decimalScale={2} rightSection={<InputHelp {...help.costs} />} rightSectionPointerEvents="all" />
                  <NumberInput label="Regularna miesięczna nadpłata (PLN)" {...overpaymentProps} min={0} step={100} decimalScale={2} rightSection={<InputHelp {...help.overpayment} />} rightSectionPointerEvents="all" />
                </>
              ) : (
                <>
                  <NumberInput label="Planowana kwota kredytu (PLN)" {...plannedPrincipalProps} min={0} step={10_000} decimalScale={2} rightSection={<InputHelp {...help.plannedPrincipal} />} rightSectionPointerEvents="all" />
                  <NumberInput label="Szacowane oprocentowanie (%)" {...plannedInterestProps} min={0} step={0.1} decimalScale={2} rightSection={<InputHelp {...help.interest} />} rightSectionPointerEvents="all" />
                  <NumberInput label="Okres kredytu (lata)" {...plannedYearsProps} min={1} step={1} rightSection={<InputHelp {...help.years} />} rightSectionPointerEvents="all" />
                  <NumberInput label="Miesięczne koszty dodatkowe (PLN)" {...plannedCostProps} min={0} step={10} decimalScale={2} rightSection={<InputHelp {...help.costs} />} rightSectionPointerEvents="all" />
                  <NumberInput label="Planowana miesięczna nadpłata (PLN)" {...plannedOverpaymentProps} min={0} step={100} decimalScale={2} rightSection={<InputHelp {...help.overpayment} />} rightSectionPointerEvents="all" />
                </>
              )}
              <Checkbox
                checked={isFallingRatesProps.value}
                onChange={(event) => isFallingRatesProps.onChange(event.currentTarget.checked)}
                label="Malejące raty"
                m="xs"
              />
            </SimpleGrid>
          </Stack>
        </Card>

        <Tabs defaultValue="summary" keepMounted={false}>
          <Tabs.List style={{ flexWrap: "nowrap", overflowX: "auto" }}>
            <Tabs.Tab value="summary">Podsumowanie</Tabs.Tab>
            <Tabs.Tab value="single_payment">Pojedyncza nadpłata</Tabs.Tab>
            <Tabs.Tab value="ikze">Nadpłata czy IKZE?</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="summary" mt="sm">
            <Summary result={result} />
            <Card withBorder padding="md" mt="md">
              <Stack gap="md">
                <Title order={3}>Harmonogram spłat</Title>
                {result.schedule.length < 600 ? (
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 8 }}>
                      <ScheduleTable schedule={result.schedule} />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <Center h="100%"><PieChartForRow /></Center>
                    </Grid.Col>
                  </Grid>
                ) : (
                  <Text size="xs" c="dimmed">
                    Harmonogram ma ponad 600 rat. Zawęż parametry, aby go wyświetlić.
                  </Text>
                )}
              </Stack>
            </Card>
          </Tabs.Panel>
          <Tabs.Panel value="single_payment">
            <SingleOverpayment parameters={parameters} />
          </Tabs.Panel>
          <Tabs.Panel value="ikze">
            <IkzeComparison parameters={parameters} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}

export default App;
