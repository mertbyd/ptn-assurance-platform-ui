"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ModuleShell } from "@/components/shell/module-shell";
import { useAuthStore } from "@/stores/auth-store";
import { TestAgentProvider, useTestAgent } from "@/features/test-agent/test-agent-context";
import { TabScenarios } from "./components/scenarios-tab";
import { TabRuns } from "./components/runs-tab";
import { AuthoringTab } from "./components/authoring-tab";

const GS = `
@keyframes fadeUp { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);} }
@keyframes spin    { to{transform:rotate(360deg);} }
@keyframes dotP    { 0%,100%{opacity:.5;transform:scale(1);}50%{opacity:1;transform:scale(1.4);} }
`;

export default function TestPage() {
  const { session, isHydrated, hydrate } = useAuthStore();
  const router = useRouter();

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (isHydrated && !session) router.replace("/login");
  }, [isHydrated, session, router]);

  if (!session) return null;

  return <TestAgentProvider><TestWorkspace /></TestAgentProvider>;
}

function TestWorkspace() {
  const { conversation } = useTestAgent();
  const [tab, setTab] = useState("authoring");
  const [runScenarioId, setRunScenarioId] = useState<string | undefined>();

  return (
    <>
      <style>{GS}</style>
      <ModuleShell
        mod="test"
        name="Test Platform"
        tabs={[
          { key: "authoring", label: "Agent ile Yazarlık" },
          { key: "scenarios", label: "Senaryolar" },
          { key: "runs",      label: "Koşumlar" },
        ]}
        tab={tab}
        onTab={setTab}
        agentConversation={conversation}
      >
        {tab === "authoring" && <AuthoringTab />}
        {tab === "scenarios" && (
          <TabScenarios
            onRunScenario={(id) => { setRunScenarioId(id); setTab("runs"); }}
          />
        )}
        {tab === "runs" && (
          <TabRuns initialScenarioId={runScenarioId} />
        )}
      </ModuleShell>
    </>
  );
}
