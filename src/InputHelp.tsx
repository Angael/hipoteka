import { ActionIcon, HoverCard, Stack, Text } from "@mantine/core";
import { memo } from "react";

type Props = {
  title: string;
  description: string;
  effect: string;
};

const InputHelp = ({ title, description, effect }: Props) => (
  <HoverCard width={310} shadow="md" position="top" withArrow openDelay={180}>
    <HoverCard.Target>
      <ActionIcon
        variant="subtle"
        color="teal"
        size="sm"
        radius="xl"
        aria-label={`Wyjaśnienie: ${title}`}
      >
        i
      </ActionIcon>
    </HoverCard.Target>
    <HoverCard.Dropdown>
      <Stack gap={6}>
        <Text fw={700} size="sm">{title}</Text>
        <Text size="sm" lh={1.45}>{description}</Text>
        <Text size="xs" c="teal.8" fw={600} lh={1.4}>{effect}</Text>
      </Stack>
    </HoverCard.Dropdown>
  </HoverCard>
);

export default memo(InputHelp);
