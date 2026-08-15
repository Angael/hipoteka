import { AreaChart } from "@mantine/charts";
import {
  Badge,
  Card,
  Divider,
  NumberInput,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Title
} from "@mantine/core";
import { useMemo, useState } from "react";
import {
  generateAmortizationSchedule,
  type LoanParameters
} from "./loanCalculations";
import { formatCurrency } from "./utils";
import InputHelp from "./InputHelp";

const IKZE_LIMIT_2026 = 11_304;
const MONTHLY_IKZE_CAPACITY = 942;
const RETIREMENT_AGE = 65;
const TAX_THRESHOLD = 120_000;
const WITHDRAWAL_TAX = 0.1;
const MAX_HORIZON_MONTHS = 50 * 12;

const profiles = {
  cautious: { label: "Ostrożny · 3%", returnRate: 0.03 },
  balanced: { label: "Mieszany · 5%", returnRate: 0.05 },
  etf: { label: "Globalny ETF · 7%", returnRate: 0.07 }
} as const;

type Profile = keyof typeof profiles;
type Props = { parameters: LoanParameters };
type RouteKind = "ikzeFirst" | "mortgageFirst";

const taxBenefitFor = (contribution: number, income: number) => {
  const deductible = Math.min(contribution, income);
  const at32 = Math.min(deductible, Math.max(income - TAX_THRESHOLD, 0));
  return at32 * 0.32 + (deductible - at32) * 0.12;
};

const payoffLabel = (months: number) =>
  months <= 0
    ? "kredyt już spłacony"
    : `${Math.floor(months / 12)} l. ${months % 12} mies.`;

const IkzeComparison = ({ parameters }: Props) => {
  const [currentAge, setCurrentAge] = useState<number | string>(28);
  const [monthlyBudget, setMonthlyBudget] = useState<number | string>(500);
  const [taxableIncome, setTaxableIncome] = useState<number | string>(100_000);
  const [profile, setProfile] = useState<Profile>("balanced");

  const age = typeof currentAge === "number" ? Math.min(Math.max(currentAge, 15), 64) : 28;
  const budget = typeof monthlyBudget === "number" ? Math.max(monthlyBudget, 0) : 0;
  const income = typeof taxableIncome === "number" ? Math.max(taxableIncome, 0) : 0;

  const result = useMemo(() => {
    const horizonMonths = Math.min(
      Math.max(Math.round((RETIREMENT_AGE - age) * 12), 1),
      MAX_HORIZON_MONTHS
    );
    const commonOverpayment = Math.max(parameters.monthlyOverpayment ?? 0, 0);
    const ikzeFirstMortgageBudget = Math.max(budget - MONTHLY_IKZE_CAPACITY, 0);
    const schedules = {
      baseline: generateAmortizationSchedule(parameters),
      ikzeFirst: generateAmortizationSchedule({
        ...parameters,
        monthlyOverpayment: commonOverpayment + ikzeFirstMortgageBudget
      }),
      mortgageFirst: generateAmortizationSchedule({
        ...parameters,
        monthlyOverpayment: commonOverpayment + budget
      })
    };
    const monthlyReturn = Math.pow(1 + profiles[profile].returnRate, 1 / 12) - 1;

    const simulate = (kind: RouteKind) => {
      const schedule = schedules[kind];
      const mortgageBudget =
        kind === "ikzeFirst" ? ikzeFirstMortgageBudget : budget;
      let ikzeBalance = 0;
      let contributions = 0;
      let taxBenefit = 0;
      let yearContribution = 0;
      let cumulativeInterest = 0;
      let cashSavings = 0;
      const snapshots = [];

      for (let month = 1; month <= horizonMonths; month += 1) {
        const loanRow = schedule.schedule[month - 1];
        const loanBalance = loanRow?.remainingBalance ?? 0;
        cumulativeInterest += loanRow?.interest ?? 0;
        const mayContribute = kind === "ikzeFirst" || month > schedule.payoffMonths;
        const remainingAnnualCapacity = Math.max(IKZE_LIMIT_2026 - yearContribution, 0);
        const contribution = mayContribute
          ? Math.min(budget, MONTHLY_IKZE_CAPACITY, remainingAnnualCapacity)
          : 0;

        ikzeBalance = ikzeBalance * (1 + monthlyReturn) + contribution;
        contributions += contribution;
        yearContribution += contribution;

        // The schedule includes the configured overpayment and the comparison
        // budget together. Isolate the latter so a final, truncated payment
        // does not silently discard any budget left after payoff.
        const configuredOverpayment =
          commonOverpayment +
          (month === 1 ? Math.max(parameters.oneTimeOverpayment ?? 0, 0) : 0);
        const comparisonMortgagePayment = Math.min(
          mortgageBudget,
          Math.max((loanRow?.overpayment ?? 0) - configuredOverpayment, 0)
        );
        if (loanBalance === 0) {
          cashSavings += Math.max(
            budget - contribution - comparisonMortgagePayment,
            0
          );
        }

        const isYearEnd = month % 12 === 0;
        if (isYearEnd || month === horizonMonths) {
          taxBenefit += taxBenefitFor(yearContribution, income);
          yearContribution = 0;
          const netIkze = ikzeBalance * (1 - WITHDRAWAL_TAX);
          const repaidPrincipal = Math.max(parameters.principal - loanBalance, 0);
          snapshots.push({
            month,
            age: age + month / 12,
            period: `Wiek ${(age + month / 12).toLocaleString("pl-PL", { maximumFractionDigits: 1 })}`,
            loanBalance,
            cumulativeInterest,
            contributions,
            taxBenefit,
            netIkze,
            repaidPrincipal,
            cashSavings,
            routeValue: repaidPrincipal + netIkze + taxBenefit + cashSavings
          });
        }
      }

      const terminal = snapshots[snapshots.length - 1];
      return {
        ...terminal,
        snapshots,
        payoffMonths: schedule.payoffMonths,
        interestSaved: Math.max(
          schedules.baseline.totalInterestPaid - schedule.totalInterestPaid,
          0
        )
      };
    };

    const ikzeFirst = simulate("ikzeFirst");
    const mortgageFirst = simulate("mortgageFirst");
    const chartData = ikzeFirst.snapshots.map((point, index) => {
      const mortgagePoint = mortgageFirst.snapshots[index];
      return {
        period: point.period,
        ikzeFirstValue: point.routeValue,
        mortgageFirstValue: mortgagePoint.routeValue,
        ikzeFirstCashSavings: point.cashSavings,
        mortgageFirstCashSavings: mortgagePoint.cashSavings
      };
    });

    return {
      horizonMonths,
      ikzeFirstMortgageBudget,
      ikzeFirst,
      mortgageFirst,
      chartData
    };
  }, [age, budget, income, parameters, profile]);

  const difference = result.ikzeFirst.routeValue - result.mortgageFirst.routeValue;
  const earlierMonths = Math.abs(result.ikzeFirst.payoffMonths - result.mortgageFirst.payoffMonths);

  return (
    <Stack gap="md" mt="sm">
      <Card withBorder radius="lg" p="lg">
        <Text tt="uppercase" size="xs" fw={700} c="teal.8" lts={1.1}>
          Jeden miesięczny budżet · dwa sposoby oszczędzania
        </Text>
        <Title order={2} mt={4}>Najpierw IKZE czy szybsza spłata kredytu?</Title>
        <Text c="dimmed" mt="xs" maw={900} lh={1.55}>
          Wybierz kwotę, którą możesz odkładać co miesiąc. Porównamy, co się stanie,
          gdy najpierw zasilasz IKZE albo najpierw nadpłacasz kredyt. Każda złotówka
          budżetu trafia do IKZE, kredytu lub pozostałych oszczędności.
        </Text>
      </Card>

      <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md">
        <NumberInput label="Obecny wiek" value={currentAge} onChange={setCurrentAge} min={15} max={64} step={1} />
        <NumberInput label="Miesięczny budżet (PLN)" value={monthlyBudget} onChange={setMonthlyBudget} min={0} step={100} decimalScale={2} />
        <NumberInput label="Roczny dochód do PIT (PLN)" value={taxableIncome} onChange={setTaxableIncome} min={0} step={5_000} />
        <Stack gap={5}>
          <Text size="sm" fw={500}>Scenariusz wyniku IKZE</Text>
          <SegmentedControl fullWidth value={profile} onChange={(value) => setProfile(value as Profile)} data={Object.entries(profiles).map(([value, item]) => ({ value, label: item.label }))} />
        </Stack>
      </SimpleGrid>

      <Card withBorder radius="lg" p={{ base: "lg", md: "xl" }} bg="gray.0">
        <Badge color="gray" variant="light" mb="sm">Najważniejszy wniosek</Badge>
        <Title order={3}>Więcej na 65. urodziny czy kredyt spłacony wcześniej?</Title>
        <Text mt="sm" lh={1.55}>
          <b>Łączna kwota w wieku 65 lat:</b>{" "}
          {difference === 0
            ? "oba sposoby dają w tym wyliczeniu tyle samo"
            : `${difference > 0 ? "„IKZE najpierw”" : "„Kredyt najpierw”"} daje o ${formatCurrency(Math.abs(difference))} więcej`}.
          To prognoza, bo wynik IKZE może być inny niż założone 3%, 5% lub 7%.
        </Text>
        <Text mt="xs" lh={1.55}>
          <b>Szybsze wyjście z długu:</b>{" "}
          {earlierMonths > 0
            ? `„Kredyt najpierw” spłaca kredyt o ${earlierMonths} mies. wcześniej.`
            : "W obu sposobach kredyt jest spłacony w tym samym miesiącu."}{" "}
          Mniej zapłaconych odsetek jest przewidywalne przy niezmiennym oprocentowaniu.
        </Text>
      </Card>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <RouteCard
          color="teal"
          title="Sposób A · Najpierw IKZE"
          description={`Co miesiąc do IKZE trafia najwyżej 942 zł (11 304 zł rocznie). Przed spłatą kredytu ${formatCurrency(result.ikzeFirstMortgageBudget)} ponad ten limit idzie na nadpłatę; po spłacie ta nadwyżka trafia do „Pozostałych oszczędności”.`}
          route={result.ikzeFirst}
        />
        <RouteCard
          color="blue"
          title="Sposób B · Najpierw kredyt"
          description="Do spłaty kredytu cały miesięczny budżet idzie na nadpłatę. Od następnego miesiąca do IKZE trafia najwyżej 942 zł, a każda złotówka ponad limit do „Pozostałych oszczędności”."
          route={result.mortgageFirst}
        />
      </SimpleGrid>

      <Card withBorder radius="lg" p="lg">
        <Title order={3}>Jak rośnie łączna kwota do 65. roku życia</Title>
        <Text size="sm" c="dimmed" mb="md" lh={1.5}>
          Każdy punkt na wykresie to suma czterech części: spłaconego kapitału kredytu,
          IKZE po podatku 10%, niewydanej ulgi PIT i pozostałych oszczędności w gotówce.
        </Text>
        <AreaChart
          h={320}
          data={result.chartData}
          dataKey="period"
          valueFormatter={formatCurrency}
          series={[
            { name: "ikzeFirstValue", label: "IKZE najpierw", color: "teal.7" },
            { name: "mortgageFirstValue", label: "Kredyt najpierw", color: "blue.7" }
          ]}
          withLegend
          curveType="monotone"
          yAxisProps={{ width: 82 }}
        />
      </Card>

      <Card withBorder radius="lg" p="lg" bg="yellow.0">
        <Text fw={700}>Co zakładamy w tym porównaniu</Text>
        <Text size="sm" c="dimmed" mt={5} lh={1.5}>
          Liczymy {result.horizonMonths} mies., od wieku {age} do 65 lat. Limit IKZE przez
          cały czas wynosi 942 zł miesięcznie i 11 304 zł rocznie. Przy wypłacie odejmujemy
          10% od całego IKZE. Ulgę PIT liczymy według stawek 12% i 32%, ale jej nie
          inwestujemy. Pozostałe oszczędności także nie zarabiają. Wyniki 3%, 5% i 7%
          to tylko możliwe scenariusze. Pomijamy inflację, opłaty oraz przyszłe zmiany
          prawa, limitu IKZE i oprocentowania kredytu.
        </Text>
      </Card>
    </Stack>
  );
};

type RouteCardProps = {
  color: "teal" | "blue";
  title: string;
  description: string;
  route: {
    routeValue: number;
    repaidPrincipal: number;
    netIkze: number;
    taxBenefit: number;
    cashSavings: number;
    cumulativeInterest: number;
    contributions: number;
    loanBalance: number;
    payoffMonths: number;
    interestSaved: number;
  };
};

const RouteCard = ({ color, title, description, route }: RouteCardProps) => (
  <Card withBorder radius="lg" p="lg">
    <Text tt="uppercase" size="xs" fw={700} c={`${color}.8`} lts={1}>{title}</Text>
    <Text fz={30} fw={800} c={`${color}.8`} mt={4}>{formatCurrency(route.routeValue)}</Text>
    <Text size="sm">
      Łącznie w wieku 65 lat{" "}
      <InputHelp
        title="Łączna kwota"
        description="To spłacony kapitał kredytu + IKZE po podatku 10% + niewydana ulga PIT + pozostałe oszczędności."
        effect="Wielka liczba pokazuje cały wynik sposobu, nie samo IKZE."
      />
    </Text>
    <Text size="sm" c="dimmed" mt="md" lh={1.5}>{description}</Text>
    <Divider my="md" />
    <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
      <Metric
        label="Spłacony kapitał kredytu"
        value={formatCurrency(route.repaidPrincipal)}
        description="To część pożyczonej kwoty, którą oddano bankowi do 65. roku życia. Nie obejmuje odsetek ani opłat."
        effect="Ta kwota jest jedną z czterech części łącznego wyniku."
      />
      <Metric
        label="IKZE po podatku 10%"
        value={formatCurrency(route.netIkze)}
        description="To prognozowana wartość IKZE w wieku 65 lat po odjęciu 10% podatku od wypłaty."
        effect="Wynik zależy od wybranego scenariusza 3%, 5% lub 7%."
      />
      <Metric
        label="Ulga PIT (nieinwestowana)"
        value={formatCurrency(route.taxBenefit)}
        description="To suma oszczędności w PIT dzięki wpłatom na IKZE. Zakładamy, że zwrot podatku nie jest inwestowany."
        effect="Ulgę dodajemy osobno do łącznej kwoty."
      />
      <Metric
        label="Pozostałe oszczędności"
        value={formatCurrency(route.cashSavings)}
        description="To budżet pozostały po spłacie kredytu, który nie mieści się w limicie 942 zł miesięcznie na IKZE. Gotówka nie zarabia odsetek."
        effect="Dzięki tej pozycji żadna złotówka budżetu nie znika."
      />
      <Metric
        label="Wpłaty na IKZE"
        value={formatCurrency(route.contributions)}
        description="To suma wpłat przekazanych na IKZE, bez zysków i bez ulgi PIT. Miesięcznie wpłata nie przekracza 942 zł."
        effect="Pokazuje, ile własnych pieniędzy zasiliło IKZE."
      />
      <Metric
        label="Odsetki kredytu"
        value={formatCurrency(route.cumulativeInterest)}
        description="To odsetki zapłacone bankowi od dziś do 65. roku życia. Nie są częścią łącznej kwoty."
        effect="Niższa kwota oznacza mniejszy koszt kredytu."
      />
      <Metric
        label="Saldo kredytu w wieku 65 lat"
        value={formatCurrency(route.loanBalance)}
        description="To kapitał kredytu, który pozostaje do spłaty w wieku 65 lat. Zero oznacza, że kredyt jest już spłacony."
        effect="Pokazuje, czy po zakończeniu porównania zostaje dług."
      />
      <Metric
        label="Czas do spłaty kredytu"
        value={payoffLabel(route.payoffMonths)}
        description="To czas od dziś do ostatniej raty przy nadpłatach w tym sposobie. Liczymy go z bieżących danych kredytu."
        effect="Krótszy czas oznacza wcześniejsze wyjście z długu."
      />
      <Metric
        label="Mniej odsetek niż bez tego budżetu"
        value={formatCurrency(route.interestSaved)}
        description="Porównujemy odsetki z tym sposobem z planem kredytu bez dodatkowego budżetu. Różnica pokazuje oszczędność na odsetkach."
        effect="Wyższa kwota oznacza większą oszczędność na koszcie kredytu."
      />
    </SimpleGrid>
  </Card>
);

type MetricProps = {
  label: string;
  value: string;
  description: string;
  effect: string;
};

const Metric = ({ label, value, description, effect }: MetricProps) => (
  <Stack gap={1}>
    <Text size="xs" c="dimmed">
      {label}{" "}
      <InputHelp title={label} description={description} effect={effect} />
    </Text>
    <Text fw={700}>{value}</Text>
  </Stack>
);

export default IkzeComparison;
