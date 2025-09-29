import { Divider, Group, Stack, Text, Title } from "@mantine/core";
import type { LoanComputationResult } from "./loanCalculations";
import { formatCurrency } from "./utils";
import { memo } from "react";

type Props = {
  result: LoanComputationResult;
  overpayment: number | "";
};

const Summary = ({ result, overpayment }: Props) => {
  const payoffYears = Math.floor(result.payoffMonths / 12);
  const payoffMonthsRemainder = result.payoffMonths % 12;
  const numericOverpayment = Number(overpayment);

  return (
    <Stack gap="sm">
      <Title order={3}>Podsumowanie</Title>
      <Text fw={600} size="lg">
        Miesięczna rata (z nadpłatą):{" "}
        {formatCurrency(result.actualFirstPayment)}
      </Text>
      <Text c="dimmed" size="sm">
        Podstawowa rata (bez nadpłaty): {formatCurrency(result.monthlyPayment)}
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
  );
};

export default memo(Summary);
