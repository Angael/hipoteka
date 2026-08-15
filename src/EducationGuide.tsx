import {
  Badge,
  Box,
  Card,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title
} from "@mantine/core";
import { memo } from "react";

const inputGuides = [
  {
    number: "01",
    title: "Pozostały kapitał",
    description:
      "To dług, który został jeszcze do oddania bankowi. Nie wpisuj tu sumy wszystkich przyszłych rat ani ceny mieszkania.",
    direction: "Mniej = lepiej",
    color: "teal",
    effect:
      "Im niższy kapitał, tym mniej pieniędzy nalicza odsetki. Nadpłata obniża właśnie tę kwotę, dlatego zmniejsza także kolejne odsetki."
  },
  {
    number: "02",
    title: "Oprocentowanie roczne",
    description:
      "Cena pożyczenia pieniędzy podana w procentach rocznie. Bank nalicza odsetki od aktualnego zadłużenia w każdym miesiącu.",
    direction: "Mniej = zdecydowanie lepiej",
    color: "teal",
    effect:
      "Mała różnica procentowa działa przez wiele lat. Efekt narasta z czasem: wyższe oprocentowanie zwiększa odsetki, a wolniejsza spłata kapitału zwiększa następne odsetki."
  },
  {
    number: "03",
    title: "Liczba pozostałych rat",
    description:
      "Ile miesięcznych rat zostało do końca. Dla planowanego kredytu pomnóż liczbę lat przez 12, np. 25 lat to 300 rat.",
    direction: "Mniej = taniej, ale rata jest wyższa",
    color: "yellow",
    effect:
      "Dłuższy okres obniża pojedynczą ratę, lecz daje bankowi więcej miesięcy na naliczanie odsetek. To wygodniejsze dziś, ale zwykle droższe łącznie."
  },
  {
    number: "04",
    title: "Rata kapitałowo-odsetkowa",
    description:
      "Część raty przeznaczona na kapitał i odsetki. Nie obejmuje ubezpieczenia ani innych opłat.",
    direction: "Dla obecnego kredytu: przepisz z banku",
    color: "blue",
    effect:
      "W planowanym kredycie wpisz 0, aby kalkulator wyliczył ratę. W trwającym kredycie podaj kwotę z harmonogramu, bo bank mógł zastosować własne zaokrąglenia."
  },
  {
    number: "05",
    title: "Odsetki w pierwszej racie",
    description:
      "Odsetkowa część najbliższej raty. Może nieznacznie różnić się od prostego miesięcznego wyliczenia banku.",
    direction: "Dla obecnego kredytu: przepisz z harmonogramu",
    color: "blue",
    effect:
      "Podaj ją, jeśli śledzisz istniejący kredyt. Dla nowego kredytu wpisz 0 — kalkulator użyje standardowego oprocentowania miesięcznego."
  },
  {
    number: "06",
    title: "Miesięczne koszty dodatkowe",
    description:
      "Ubezpieczenie i inne stałe opłaty doliczane do raty. Nie zmniejszają zadłużenia.",
    direction: "Mniej = lepiej",
    color: "teal",
    effect:
      "Koszt 100 zł wygląda niewinnie, ale przez 300 miesięcy oznacza 30 000 zł. Ta kwota zwiększa wydatek, lecz nie spłaca ani złotówki kapitału."
  },
  {
    number: "07",
    title: "Miesięczna nadpłata",
    description:
      "Dodatkowa kwota przeznaczona bezpośrednio na spłatę kapitału ponad zwykłą ratę.",
    direction: "Więcej = zwykle lepiej",
    color: "teal",
    effect:
      "Szybciej obniża dług, więc bank nalicza mniej odsetek w kolejnych miesiącach. Najpierw zachowaj jednak poduszkę finansową i sprawdź zasady nadpłat w umowie."
  }
] as const;

const Step = ({ number, children }: { number: string; children: React.ReactNode }) => (
  <Group align="flex-start" wrap="nowrap" gap="md">
    <ThemeIcon size={34} radius="xl" variant="light" color="teal">
      {number}
    </ThemeIcon>
    <Text lh={1.55}>{children}</Text>
  </Group>
);

const EducationGuide = () => (
  <Stack gap="xl">
    <Paper
      p={{ base: "lg", md: 32 }}
      radius="lg"
      style={{
        background:
          "linear-gradient(125deg, var(--mantine-color-dark-8), var(--mantine-color-teal-9))",
        color: "white"
      }}
    >
      <Text tt="uppercase" fw={700} size="xs" opacity={0.72} lts={1.4}>
        Kredyt bez bankowego żargonu
      </Text>
      <Title order={2} mt="xs" maw={720}>
        Najpierw ustal, czy planujesz kredyt, czy śledzisz ten już uruchomiony
      </Title>
      <Text mt="md" maw={760} opacity={0.86} lh={1.6}>
        Te dwa przypadki wymagają innych danych. Kalkulator obsługuje oba — ważne,
        aby nie mieszać ceny mieszkania, pierwotnej kwoty kredytu i aktualnego
        zadłużenia.
      </Text>
    </Paper>

    <Tabs defaultValue="existing" variant="pills" color="teal">
      <Tabs.List grow>
        <Tabs.Tab value="existing">Mam już kredyt</Tabs.Tab>
        <Tabs.Tab value="planned">Dopiero planuję kredyt</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="existing" pt="lg">
        <Card withBorder radius="lg" p={{ base: "lg", md: "xl" }}>
          <Badge color="teal" variant="light" mb="md">
            Najdokładniejszy wariant
          </Badge>
          <Title order={3}>Przepisz aktualny stan, nie dane z dnia podpisania umowy</Title>
          <Text c="dimmed" mt="xs" mb="xl" maw={820}>
            Otwórz najnowszy harmonogram albo bankowość internetową. Stary kapitał
            i pierwotny okres kredytu zafałszują wynik.
          </Text>
          <Stack gap="lg">
            <Step number="1">Wpisz <b>kwotę pozostałą do spłaty</b> jako pozostały kapitał.</Step>
            <Step number="2">Wpisz <b>aktualne oprocentowanie</b> i liczbę <b>rat pozostałych do spłaty</b>.</Step>
            <Step number="3">Przepisz z harmonogramu ratę kapitałowo-odsetkową oraz odsetki z najbliższej raty.</Step>
            <Step number="4">Dodaj ubezpieczenie i stałe opłaty, a potem sprawdzaj różne nadpłaty.</Step>
          </Stack>
        </Card>
      </Tabs.Panel>

      <Tabs.Panel value="planned" pt="lg">
        <Card withBorder radius="lg" p={{ base: "lg", md: "xl" }}>
          <Badge color="blue" variant="light" mb="md">
            Wynik orientacyjny
          </Badge>
          <Title order={3}>Zamień cenę nieruchomości na faktyczną kwotę kredytu</Title>
          <Text c="dimmed" mt="xs" mb="xl" maw={820}>
            To symulacja, nie oferta banku. Rzeczywista rata zależy też od prowizji,
            ubezpieczeń, zmiany stóp i sposobu wypłaty kredytu.
          </Text>
          <Stack gap="lg">
            <Step number="1"><b>Cena nieruchomości minus wkład własny</b> daje przybliżony kapitał kredytu.</Step>
            <Step number="2">Wpisz szacowane oprocentowanie. Sprawdź też wariant wyższy o 1–2 punkty procentowe.</Step>
            <Step number="3">Pomnóż planowane lata przez 12 i wpisz wynik jako liczbę rat.</Step>
            <Step number="4">Ustaw ratę kapitałowo-odsetkową i odsetki pierwszej raty na <b>0</b>. Kalkulator wyliczy je sam.</Step>
            <Step number="5">Dodaj przewidywane opłaty miesięczne. Porównaj wynik bez nadpłaty i z bezpieczną nadpłatą.</Step>
          </Stack>
        </Card>
      </Tabs.Panel>
    </Tabs>

    <Box>
      <Text tt="uppercase" fw={700} size="xs" c="teal.8" lts={1.2}>
        Słownik pól
      </Text>
      <Title order={2} mt={4} mb="lg">
        Co zmienia każda liczba?
      </Title>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {inputGuides.map((guide) => (
          <Card key={guide.number} withBorder radius="lg" p="lg">
            <Group justify="space-between" align="flex-start" mb="md">
              <ThemeIcon size={42} radius="md" variant="light" color={guide.color}>
                {guide.number}
              </ThemeIcon>
              <Badge color={guide.color} variant="light">
                {guide.direction}
              </Badge>
            </Group>
            <Title order={3}>{guide.title}</Title>
            <Text mt="xs" lh={1.55}>{guide.description}</Text>
            <Divider my="md" />
            <Text size="sm" c="dimmed" lh={1.55}>{guide.effect}</Text>
          </Card>
        ))}
      </SimpleGrid>
    </Box>

    <Paper p="lg" radius="lg" bg="yellow.0" bd="1px solid var(--mantine-color-yellow-3)">
      <Text fw={700}>Ważne: kalkulator pokazuje scenariusz, nie gwarancję.</Text>
      <Text size="sm" mt={4} c="dimmed">
        Przy oprocentowaniu zmiennym wynik zmieni się razem ze stopą procentową.
        Przed decyzją sprawdź ofertę banku, RRSO, prowizje i warunki wcześniejszej spłaty.
      </Text>
    </Paper>
  </Stack>
);

export default memo(EducationGuide);
