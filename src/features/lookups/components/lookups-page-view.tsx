"use client";

import { Box, Button, Flex, Grid, Stack, Text } from "@chakra-ui/react";
import { Braces, Compass, GitBranch, ListChecks, Plus, ShieldAlert, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { lookupKinds, type LookupDto, type LookupKind } from "@/api/lookups.api";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel } from "@/components/ui/panel";
import { ErrorState, LoadingState } from "@/components/ui/screen-state";
import { usePermissionsQuery } from "@/features/permissions";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";
import { emptyGrantedPermissions, hasPermission, Permissions } from "@/lib/permissions";

import { useLookupsQuery, usePassivateLookupMutation } from "../hooks/use-lookup-queries";
import { LookupFormDialog } from "./lookup-form-dialog";
import { LookupList } from "./lookup-list";
import { PassivateLookupDialog } from "./passivate-lookup-dialog";

const icons: Record<LookupKind, LucideIcon> = { checkRunStatuses: ListChecks, differenceDirections: Compass, differenceKinds: GitBranch, differenceSeverities: ShieldAlert, specFormats: Braces };

export function LookupsPageView() {
  const [kind, setKind] = useState<LookupKind>("checkRunStatuses");
  const [formItem, setFormItem] = useState<LookupDto | null>();
  const [passivatingItem, setPassivatingItem] = useState<LookupDto>();
  const query = useLookupsQuery(kind);
  const passivate = usePassivateLookupMutation();
  const { data: granted = emptyGrantedPermissions } = usePermissionsQuery();
  const canManage = hasPermission(granted, Permissions.lookups.manage);
  const requestError = (query.error ?? passivate.error) instanceof ApiRequestError ? (query.error ?? passivate.error) as ApiRequestError : null;
  const confirmPassivate = async () => {
    if (!passivatingItem?.id) return;
    try { await passivate.mutateAsync({ id: passivatingItem.id, kind }); setPassivatingItem(undefined); } catch { /* Page owns safe feedback. */ }
  };

  return (
    <Stack gap="7">
      <PageHeading actions={<Button bg="accent.solid" color="ink.onAccent" disabled={!canManage} onClick={() => setFormItem(null)}><Plus size={16} />{t.lookups.actions.create}</Button>} description={t.lookups.description} eyebrow={t.lookups.eyebrow} title={t.lookups.title} />
      {requestError && <ErrorState description={getApiErrorMessage(requestError)} onRetry={() => void query.refetch()} title={t.lookups.loadErrorTitle} />}
      <Grid gap="5" templateColumns={{ base: "1fr", lg: "minmax(240px, 0.62fr) minmax(0, 1.7fr)" }}>
        <Panel description={t.lookups.families.description} title={t.lookups.families.title}><Stack gap="2" p="3">
          {lookupKinds.map((itemKind) => { const Icon = icons[itemKind]; const selected = itemKind === kind; return <Button bg={selected ? "accent.soft" : "transparent"} color={selected ? "accent.solid" : "ink.body"} h="auto" justifyContent="flex-start" key={itemKind} onClick={() => setKind(itemKind)} px="3" py="3" variant="ghost"><Flex align="center" gap="3"><Flex align="center" bg={selected ? "accent.solid" : "app.subtle"} borderRadius="9px" color={selected ? "ink.onAccent" : "accent.solid"} h="8" justify="center" w="8"><Icon size={15} /></Flex><Box textAlign="left"><Text fontSize="sm" fontWeight="700">{t.lookups.kinds[itemKind].title}</Text><Text color="ink.muted" fontSize="11px" fontWeight="400">{t.lookups.kinds[itemKind].short}</Text></Box></Flex></Button>; })}
        </Stack></Panel>
        <Panel description={t.lookups.kinds[kind].description} title={t.lookups.kinds[kind].title}>{query.isPending ? <Box p="5"><LoadingState /></Box> : <LookupList canManage={canManage} items={query.data?.items ?? []} onCreate={() => setFormItem(null)} onEdit={setFormItem} onPassivate={setPassivatingItem} />}</Panel>
      </Grid>
      <LookupFormDialog item={formItem ?? undefined} kind={kind} onClose={() => setFormItem(undefined)} open={formItem !== undefined} />
      <PassivateLookupDialog isPending={passivate.isPending} item={passivatingItem} onClose={() => setPassivatingItem(undefined)} onConfirm={() => void confirmPassivate()} />
    </Stack>
  );
}
