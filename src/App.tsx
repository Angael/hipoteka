import {
  Card,
  Container,
  NumberInput,
  Stack,
  Table,
  Text,
  Title
} from "@mantine/core";

// Wartości początkowe:
// Kapitał 580_000
// Oprocentowanie 6,5%
// 30 lat
// Nadpłata miesięczna 1_400

function App() {
  // TODO: Ten kod istnieje tylko po to by LLM się nim zasugerował, bo może nie znasz biblioteki Mantine
  // const rows = elements.map((element) => (
  //   <Table.Tr key={element.name}>
  //     <Table.Td>{element.position}</Table.Td>
  //     <Table.Td>{element.name}</Table.Td>
  //     <Table.Td>{element.symbol}</Table.Td>
  //     <Table.Td>{element.mass}</Table.Td>
  //   </Table.Tr>
  // ));

  return (
    <Container mt="lg">
      <Stack>
        <Title order={1}>Kalkulator hipoteki</Title>

        {/* Dane do wpisania: Długość kredytu, wysokość kredytu, oprocentowanie, okres kredytowania */}
        <NumberInput label="Długość kredytu (w latach)" />
        <NumberInput label="Wysokość kredytu" />
        <NumberInput label="Oprocentowanie" />
        <NumberInput label="Okres kredytowania (w latach)" />
        <NumberInput label="Nadpłata miesięczna" />

        {/* Wynik: miesięczna rata */}
        <Card bg="gray.1">
          <Text>Miesięczna rata: </Text>
          <Text>W tym</Text>
          <Text>Kapitał: </Text>
          <Text>Odsetki: </Text>
        </Card>

        {/* Tabela opłat */}
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Miesiąc</Table.Th>
              <Table.Th>Pozostały kapitał</Table.Th>
              <Table.Th>Rata</Table.Th>
              <Table.Th>Odsetki</Table.Th>
              <Table.Th>Nadpłata</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Stack>
    </Container>
  );
}

export default App;
