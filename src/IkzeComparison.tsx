import { AreaChart } from "@mantine/charts";
import {
  Badge,
  Card,
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

const IKZE_LIMIT_2026 = 11_304;
const TAX_THRESHOLD = 120_000;
const WITHDRAWAL_TAX = 0.1;

const profiles = {
  cautious: { label: "Ostrożny · 3%", returnRate: 0.03 },
  balanced: { label: "Mieszany · 5%", returnRate: 0.05 },
  etf: { label: "Globalny ETF · 7%", returnRate: 0.07 }
} as const;

type Profile = keyof typeof profiles;

type Props = {
  parameters: LoanParameters;
};

const IkzeComparison = ({ parameters }: Props) => {
  const [monthlyBudget, setMonthlyBudget] = useState<number | string>(500);
  const [taxableIncome, setTaxableIncome] = useState<number | string>(100_000);
  const [profile, setProfile] = useState<Profile>("balanced");
  const budget = typeof monthlyBudget === "number" ? Math.max(monthlyBudget, 0) : 0;
  const income = typeof taxableIncome === "number" ? Math.max(taxableIncome, 0) : 0;

  const result = useMemo(() => {
    const years = Math.max(Math.ceil(parameters.termMonths / 12), 1);
    const annualContribution = Math.min(budget * 12, IKZE_LIMIT_2026);
    const monthlyContribution = annualContribution / 12;
    const annualReturn = profiles[profile].returnRate;
    const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
    const baseline = generateAmortizationSchedule({
      ...parameters,
      monthlyOverpayment: 0,
      oneTimeOverpayment: 0
    });
    const overpaid = generateAmortizationSchedule({
      ...parameters,
      monthlyOverpayment: budget,
      oneTimeOverpayment: 0
    });
    const interestSaved = Math.max(
      baseline.totalInterestPaid - overpaid.totalInterestPaid,
      0
    );
    const monthsSaved = Math.max(baseline.payoffMonths - overpaid.payoffMonths, 0);
    const deductionAt32 = Math.min(
      annualContribution,
      Math.max(income - TAX_THRESHOLD, 0)
    );
    const deductionAt12 = Math.min(
      annualContribution - deductionAt32,
      Math.max(income - deductionAt32, 0)
    );
    const annualTaxSaving = deductionAt32 * 0.32 + deductionAt12 * 0.12;
    let ikzeBalance = 0;
    let contributions = 0;
    const chartData = [];

    for (let month = 1; month <= years * 12; month += 1) {
      ikzeBalance = ikzeBalance * (1 + monthlyReturn) + monthlyContribution;
      contributions += monthlyContribution;
      if (month % 12 === 0) {
        const elapsedYears = month / 12;
        const taxSavings = annualTaxSaving * elapsedYears;
        const netIkze = ikzeBalance * (1 - WITHDRAWAL_TAX);
        chartData.push({
          year: `Rok ${elapsedYears}`,
          ikzeBenefit: Math.max(netIkze + taxSavings - contributions, 0),
          overpaymentBenefit: interestSaved * Math.min(month / baseline.payoffMonths, 1)
        });
      }
    }

    const netIkze = ikzeBalance * (1 - WITHDRAWAL_TAX);
    const totalTaxSaving = annualTaxSaving * years;
    const ikzeBenefit = netIkze + totalTaxSaving - contributions;

    return {
      years,
      annualContribution,
      monthlyContribution,
      annualTaxSaving,
      totalTaxSaving,
      netIkze,
      ikzeBenefit,
      interestSaved,
      monthsSaved,
      chartData,
      winner: ikzeBenefit > interestSaved ? "ikze" : "mortgage"
    };
  }, [budget, income, parameters, profile]);

  return (
    <Stack gap="md" mt="sm">
      <Card withBorder radius="lg" p="lg">
        <Text tt="uppercase" size="xs" fw={700} c="teal.8" lts={1.1}>
          Ten sam miesięczny budżet, dwa zastosowania
        </Text>
        <Title order={2} mt={4}>IKZE czy nadpłata kredytu?</Title>
        <Text c="dimmed" mt="xs" maw={850} lh={1.55}>
          Porównujemy dodatkową korzyść ponad wpłacony przez Ciebie kapitał:
          zaoszczędzone odsetki kontra zysk inwestycyjny, ulgę PIT i 10% podatku
          przy prawidłowej wypłacie z IKZE.
        </Text>
      </Card>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        <NumberInput
          label="Miesięczny budżet (PLN)"
          value={monthlyBudget}
          onChange={setMonthlyBudget}
          min={0}
          step={100}
          decimalScale={2}
        />
        <NumberInput
          label="Roczny dochód po kosztach i składkach, przed ulgą IKZE (PLN)"
          value={taxableIncome}
          onChange={setTaxableIncome}
          min={0}
          step={5_000}
        />
        <Stack gap={5}>
          <Text size="sm" fw={500}>Założony średni wynik inwestycji</Text>
          <SegmentedControl
            fullWidth
            value={profile}
            onChange={(value) => setProfile(value as Profile)}
            data={Object.entries(profiles).map(([value, item]) => ({
              value,
              label: item.label
            }))}
          />
        </Stack>
      </SimpleGrid>

      {budget * 12 > IKZE_LIMIT_2026 && (
        <Text size="sm" c="orange.8">
          Limit IKZE na 2026 r. to {formatCurrency(IKZE_LIMIT_2026)}. Nadwyżka
          miesięcznego budżetu nie jest doliczana do symulacji IKZE.
        </Text>
      )}

      <Card
        withBorder
        radius="lg"
        p={{ base: "lg", md: "xl" }}
        bg={result.winner === "ikze" ? "teal.0" : "blue.0"}
      >
        <Badge color={result.winner === "ikze" ? "teal" : "blue"} mb="sm">
          Lepszy wynik w tej symulacji
        </Badge>
        <Title order={2}>
          {result.winner === "ikze" ? "IKZE" : "Nadpłata kredytu"}
        </Title>
        <Text mt="xs" c="dimmed">
          Różnica prognozowanych korzyści: {formatCurrency(
            Math.abs(result.ikzeBenefit - result.interestSaved)
          )}. Nadpłata daje pewny efekt równy kosztowi unikniętych odsetek;
          wynik inwestycji nie jest gwarantowany.
        </Text>
      </Card>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Card withBorder radius="lg" p="lg">
          <Text size="sm" c="dimmed">Nadpłata kredytu</Text>
          <Text fz={30} fw={800} c="blue.8">{formatCurrency(result.interestSaved)}</Text>
          <Text>zaoszczędzonych odsetek · {result.monthsSaved} mies. szybciej</Text>
        </Card>
        <Card withBorder radius="lg" p="lg">
          <Text size="sm" c="dimmed">IKZE po {result.years} latach</Text>
          <Text fz={30} fw={800} c="teal.8">{formatCurrency(result.ikzeBenefit)}</Text>
          <Text>dodatkowej korzyści ponad wpłaty</Text>
        </Card>
        <Card withBorder radius="lg" p="lg">
          <Text size="sm" c="dimmed">Szacowana ulga PIT rocznie</Text>
          <Text fz={24} fw={800}>{formatCurrency(result.annualTaxSaving)}</Text>
          <Text size="xs" c="dimmed">Uwzględnia część dochodu w progach 12% i 32%</Text>
        </Card>
        <Card withBorder radius="lg" p="lg">
          <Text size="sm" c="dimmed">Wartość IKZE po podatku 10%</Text>
          <Text fz={24} fw={800}>{formatCurrency(result.netIkze)}</Text>
          <Text size="xs" c="dimmed">Przy wypłacie po 65. roku życia i wpłatach w min. 5 latach</Text>
        </Card>
      </SimpleGrid>

      <Card withBorder radius="lg" p="lg">
        <Title order={3} mb="md">Jak rośnie dodatkowa korzyść</Title>
        <AreaChart
          h={300}
          data={result.chartData}
          dataKey="year"
          series={[
            { name: "overpaymentBenefit", label: "Nadpłata", color: "blue.7" },
            { name: "ikzeBenefit", label: "IKZE", color: "teal.7" }
          ]}
          withLegend
          curveType="monotone"
          yAxisProps={{ width: 82 }}
        />
      </Card>

      <Card withBorder radius="lg" p="lg" bg="yellow.0">
        <Text fw={700}>Założenia i ograniczenia</Text>
        <Text size="sm" c="dimmed" mt={5} lh={1.5}>
          Limit IKZE 2026: 11 304 zł. Skala PIT: 12% do 120 000 zł i 32% od
          nadwyżki. Preferencyjna wypłata IKZE jest obciążona 10% podatkiem od
          całej kwoty. Profile 3%, 5% i 7% to scenariusze, nie obietnice; „globalny
          ETF” może w pojedynczych latach mocno tracić. Kalkulator nie uwzględnia
          opłat produktu, inflacji ani zmian prawa i limitów w kolejnych latach.
        </Text>
      </Card>
    </Stack>
  );
};

export default IkzeComparison;
