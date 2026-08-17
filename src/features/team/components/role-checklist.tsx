import { Checkbox, SimpleGrid, Text } from "@chakra-ui/react";

import type { IdentityRoleDto } from "@/api/team.api";

export function RoleChecklist({ onChange, roles, value }: {
  onChange: (value: string[]) => void;
  roles: IdentityRoleDto[];
  value: string[];
}) {
  return (
    <SimpleGrid columns={{ base: 1, sm: 2 }} gap="2">
      {roles.map((role) => {
        const name = role.name ?? "";
        return (
          <Checkbox.Root
            checked={value.includes(name)}
            key={role.id ?? name}
            onCheckedChange={(event) => onChange(event.checked ? [...value, name] : value.filter((item) => item !== name))}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
            <Checkbox.Label><Text fontSize="sm">{name}</Text></Checkbox.Label>
          </Checkbox.Root>
        );
      })}
    </SimpleGrid>
  );
}
