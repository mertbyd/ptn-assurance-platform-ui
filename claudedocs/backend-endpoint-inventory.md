# Backend HTTP yüzey envanteri — kaynak doğrulamalı

- Üretim: 2026-08-17, controller kaynağından çıkarıldı (rota sabitleri + kalıtım zinciri çözülerek)
- Doğrulama: Test Module 65 = `OutwardSurfaceTests.ExpectedControllerActionCount` (geçen test)
- Doğrulama: checker toplamı 53+72=125 = ADR-0025 "iki checker 125 action"
- Çözümlenemeyen sabit: 0/190

| # | Modül | Controller | Metot | Rota | İzin | Kaynak |
|---|---|---|---|---|---|---|
| 1 | Test Module | AuthoringSessionController | POST | `/api/test-module/authoring/sessions` | `TestModule.Scenarios.Create` | kendi |
| 2 | Test Module | AuthoringSessionController | GET | `/api/test-module/authoring/sessions/{id:guid}` | `TestModule.Scenarios.Update` | kendi |
| 3 | Test Module | AuthoringSessionController | POST | `/api/test-module/authoring/sessions/{id:guid}/answer` | `TestModule.Scenarios.Update` | kendi |
| 4 | Test Module | AuthoringSessionController | POST | `/api/test-module/authoring/sessions/{id:guid}/step` | `TestModule.Scenarios.Update` | kendi |
| 5 | Test Module | AuthoringSessionController | POST | `/api/test-module/authoring/sessions/{id:guid}/database-step` | `TestModule.Scenarios.Update` | kendi |
| 6 | Test Module | AuthoringSourceController | POST | `/api/test-module/authoring/business-rules` | `TestModule.Bridge.ManageSources` | kendi |
| 7 | Test Module | AuthoringSourceController | POST | `/api/test-module/authoring/profile-packs` | `TestModule.Bridge.ManageSources` | kendi |
| 8 | Test Module | AuthoringSourceController | GET | `/api/test-module/authoring/profile-packs` | `TestModule.Bridge.ManageSources` | kendi |
| 9 | Test Module | BusinessInvariantController | POST | `/api/test-module/invariants/check` | `TestModule.Bridge.Invariant` | kendi |
| 10 | Test Module | PtnBridgeController | POST | `/api/test-module/bridge/ground` | `TestModule.Bridge.Ground` | kendi |
| 11 | Test Module | PtnBridgeController | POST | `/api/test-module/bridge/explain` | `TestModule.Bridge.Explain` | kendi |
| 12 | Test Module | PtnBridgeController | POST | `/api/test-module/bridge/validate` | `TestModule.Bridge.Validate` | kendi |
| 13 | Test Module | PtnBridgeController | POST | `/api/test-module/bridge/knowledge` | `TestModule.Bridge.Knowledge` | kendi |
| 14 | Test Module | PtnBridgeController | GET | `/api/test-module/bridge/tools` | `TestModule.Bridge.Knowledge` | kendi |
| 15 | Test Module | PtnBridgeController | POST | `/api/test-module/bridge/agent-profile` | `TestModule.Bridge.Profile` | kendi |
| 16 | Test Module | PtnBridgeController | POST | `/api/test-module/bridge/tool-budget` | `TestModule.Bridge.Profile` | kendi |
| 17 | Test Module | PtnBridgeController | POST | `/api/test-module/bridge/task-status` | `TestModule.Bridge.Task` | kendi |
| 18 | Test Module | PtnBridgeController | POST | `/api/test-module/bridge/overlay-suggestion` | `TestModule.Bridge.PatchSuggest` | kendi |
| 19 | Test Module | ScenarioCoverageController | GET | `/api/test-module/coverage` | `TestModule.Scenarios` | kendi |
| 20 | Test Module | TestScenarioController | POST | `/api/test-module/scenarios/compile-preview` | `TestModule.Scenarios.Update` | kendi |
| 21 | Test Module | TestScenarioController | GET | `/api/test-module/scenarios/{id:guid}` | `TestModule.Scenarios` | kendi |
| 22 | Test Module | TestScenarioController | GET | `/api/test-module/scenarios` | `TestModule.Scenarios` | kendi |
| 23 | Test Module | TestScenarioController | POST | `/api/test-module/scenarios` | `TestModule.Scenarios.Create` | kendi |
| 24 | Test Module | TestScenarioController | PUT | `/api/test-module/scenarios/{id:guid}` | `TestModule.Scenarios.Update` | kendi |
| 25 | Test Module | TestScenarioController | DELETE | `/api/test-module/scenarios/{id:guid}` | `TestModule.Scenarios.Delete` | kendi |
| 26 | Test Module | TestScenarioController | POST | `/api/test-module/scenarios/{id:guid}/submit-for-approval` | `TestModule.Scenarios.Update` | kendi |
| 27 | Test Module | TestScenarioController | POST | `/api/test-module/scenarios/{id:guid}/evaluate-publication` | `TestModule.Scenarios.Publish` | kendi |
| 28 | Test Module | TestScenarioController | POST | `/api/test-module/scenarios/{id:guid}/publish` | `TestModule.Scenarios.Publish` | kendi |
| 29 | Test Module | TestScenarioController | POST | `/api/test-module/scenarios/{id:guid}/deprecate` | `TestModule.Scenarios.Update` | kendi |
| 30 | Test Module | TestScenarioController | POST | `/api/test-module/scenarios/{id:guid}/quarantine` | `TestModule.Scenarios.Quarantine` | kendi |
| 31 | Test Module | TestScenarioController | POST | `/api/test-module/scenarios/{id:guid}/quarantine/release` | `TestModule.Scenarios.Quarantine` | kendi |
| 32 | Test Module | TestScenarioController | PUT | `/api/test-module/scenarios/{id:guid}/schedule` | `TestModule.Scenarios.Schedule` | kendi |
| 33 | Test Module | TestFailureCategoryController | GET | `/api/test-module/lookups/failure-categories/{id:guid}` | `TestModule.Lookups` | kendi |
| 34 | Test Module | TestFailureCategoryController | GET | `/api/test-module/lookups/failure-categories` | `TestModule.Lookups` | kendi |
| 35 | Test Module | TestOutcomeStatusController | GET | `/api/test-module/lookups/outcome-statuses/{id:guid}` | `TestModule.Lookups` | kendi |
| 36 | Test Module | TestOutcomeStatusController | GET | `/api/test-module/lookups/outcome-statuses` | `TestModule.Lookups` | kendi |
| 37 | Test Module | TestRunStatusController | GET | `/api/test-module/lookups/run-statuses/{id:guid}` | `TestModule.Lookups` | kendi |
| 38 | Test Module | TestRunStatusController | GET | `/api/test-module/lookups/run-statuses` | `TestModule.Lookups` | kendi |
| 39 | Test Module | TestScenarioStateController | GET | `/api/test-module/lookups/scenario-states/{id:guid}` | `TestModule.Lookups` | kendi |
| 40 | Test Module | TestScenarioStateController | GET | `/api/test-module/lookups/scenario-states` | `TestModule.Lookups` | kendi |
| 41 | Test Module | TestTriggerKindController | GET | `/api/test-module/lookups/trigger-kinds/{id:guid}` | `TestModule.Lookups` | kendi |
| 42 | Test Module | TestTriggerKindController | GET | `/api/test-module/lookups/trigger-kinds` | `TestModule.Lookups` | kendi |
| 43 | Test Module | ScenarioHealthController | GET | `/api/test-module/scenario-health` | `TestModule.Runs.View` | kendi |
| 44 | Test Module | ScenarioHealthController | GET | `/api/test-module/scenario-health/{scenarioKey}` | `TestModule.Runs.View` | kendi |
| 45 | Test Module | TestEnvironmentController | GET | `/api/test-module/environments` | `TestModule.Runs.View` | kendi |
| 46 | Test Module | TestEnvironmentController | POST | `/api/test-module/environments` | `TestModule.Runs.ManageEnvironments` | kendi |
| 47 | Test Module | TestEnvironmentController | PUT | `/api/test-module/environments/{key}` | `TestModule.Runs.ManageEnvironments` | kendi |
| 48 | Test Module | TestEnvironmentController | DELETE | `/api/test-module/environments/{key}` | `TestModule.Runs.ManageEnvironments` | kendi |
| 49 | Test Module | TestEnvironmentController | POST | `/api/test-module/environments/{key}/sandbox/reset` | `TestModule.Runs.SandboxReset` | kendi |
| 50 | Test Module | TestFindingController | GET | `/api/test-module/findings` | `TestModule.Runs.View` | kendi |
| 51 | Test Module | TestRunController | GET | `/api/test-module/runs/{id:guid}` | `TestModule.Runs.View` | kendi |
| 52 | Test Module | TestRunController | GET | `/api/test-module/runs` | `TestModule.Runs.View` | kendi |
| 53 | Test Module | TestRunController | POST | `/api/test-module/runs/{id:guid}/cancel` | `TestModule.Runs.Cancel` | kendi |
| 54 | Test Module | TestRunController | GET | `/api/test-module/runs/results/{id:guid}/artifacts/{format}` | `TestModule.Runs.View` | kendi |
| 55 | Test Module | TestRunController | GET | `/api/test-module/runs/{id:guid}/har` | `TestModule.Runs.View` | kendi |
| 56 | Test Module | TestRunController | GET | `/api/test-module/runs/{id:guid}/report` | `TestModule.Runs.View` | kendi |
| 57 | Test Module | TestRunController | GET | `/api/test-module/runs/{id:guid}/dry-run-contradiction` | `TestModule.Runs.View` | kendi |
| 58 | Test Module | TestRunController | POST | `/api/test-module/runs/{id:guid}/export` | `TestModule.Runs.Export` | kendi |
| 59 | Test Module | TestRunController | GET | `/api/test-module/runs/results/{id:guid}/artifacts` | `TestModule.Runs.View` | kendi |
| 60 | Test Module | TestRunController | GET | `/api/test-module/runs/results/{id:guid}` | `TestModule.Runs.View` | kendi |
| 61 | Test Module | TestRunController | POST | `/api/test-module/runs` | `TestModule.Runs.Trigger` | kendi |
| 62 | Test Module | TestRunController | POST | `/api/test-module/runs/trigger` | `TestModule.Runs.Trigger` | kendi |
| 63 | Test Module | TestRunController | POST | `/api/test-module/runs/webhook` | `ANONYMOUS` | kendi |
| 64 | Test Module | TestRunController | POST | `/api/test-module/runs/{id:guid}/start` | `TestModule.Runs.Start` | kendi |
| 65 | Test Module | TestRunController | POST | `/api/test-module/runs/{id:guid}/terminal` | `TestModule.Runs.WriteResult` | kendi |
| 66 | API Contract Checker | ResponseConformanceController | POST | `/api/contract-checks/conformance/response` | `ApiContractChecker.Conformance.Execute` | kendi |
| 67 | API Contract Checker | ResponseConformanceController | POST | `/api/contract-checks/conformance/request` | `ApiContractChecker.Conformance.Execute` | kendi |
| 68 | API Contract Checker | ResponseConformanceController | POST | `/api/contract-checks/conformance/request-example` | `ApiContractChecker.Conformance.Execute` | kendi |
| 69 | API Contract Checker | ResponseConformanceController | POST | `/api/contract-checks/conformance/operation-bindings` | `ApiContractChecker.Conformance.Execute` | kendi |
| 70 | API Contract Checker | ResponseConformanceController | POST | `/api/contract-checks/conformance/assertion-derivability` | `ApiContractChecker.Conformance.Execute` | kendi |
| 71 | API Contract Checker | ResponseConformanceController | POST | `/api/contract-checks/conformance/sample-sets` | `ApiContractChecker.Conformance.GenerateSamples` | kendi |
| 72 | API Contract Checker | ResponseConformanceController | POST | `/api/contract-checks/conformance/operation-links` | `ApiContractChecker.Conformance.SuggestLinks` | kendi |
| 73 | API Contract Checker | DiagnosisController | POST | `/api/contract-checks/diagnosis` | `ApiContractChecker.Diagnosis.Execute` | kendi |
| 74 | API Contract Checker | CheckRunStatusController | GET | `/api/api-contract/lookups/check-run-statuses/{id}` | `ApiContractChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 75 | API Contract Checker | CheckRunStatusController | GET | `/api/api-contract/lookups/check-run-statuses` | `ApiContractChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 76 | API Contract Checker | CheckRunStatusController | POST | `/api/api-contract/lookups/check-run-statuses` | `ApiContractChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 77 | API Contract Checker | CheckRunStatusController | PUT | `/api/api-contract/lookups/check-run-statuses/{id}` | `ApiContractChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 78 | API Contract Checker | CheckRunStatusController | POST | `/api/api-contract/lookups/check-run-statuses/{id}/passivate` | `ApiContractChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 79 | API Contract Checker | DifferenceDirectionController | GET | `/api/api-contract/lookups/difference-directions/{id}` | `ApiContractChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 80 | API Contract Checker | DifferenceDirectionController | GET | `/api/api-contract/lookups/difference-directions` | `ApiContractChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 81 | API Contract Checker | DifferenceDirectionController | POST | `/api/api-contract/lookups/difference-directions` | `ApiContractChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 82 | API Contract Checker | DifferenceDirectionController | PUT | `/api/api-contract/lookups/difference-directions/{id}` | `ApiContractChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 83 | API Contract Checker | DifferenceDirectionController | POST | `/api/api-contract/lookups/difference-directions/{id}/passivate` | `ApiContractChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 84 | API Contract Checker | DifferenceKindController | GET | `/api/api-contract/lookups/difference-kinds/{id}` | `ApiContractChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 85 | API Contract Checker | DifferenceKindController | GET | `/api/api-contract/lookups/difference-kinds` | `ApiContractChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 86 | API Contract Checker | DifferenceKindController | POST | `/api/api-contract/lookups/difference-kinds` | `ApiContractChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 87 | API Contract Checker | DifferenceKindController | PUT | `/api/api-contract/lookups/difference-kinds/{id}` | `ApiContractChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 88 | API Contract Checker | DifferenceKindController | POST | `/api/api-contract/lookups/difference-kinds/{id}/passivate` | `ApiContractChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 89 | API Contract Checker | DifferenceSeverityController | GET | `/api/api-contract/lookups/difference-severities/{id}` | `ApiContractChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 90 | API Contract Checker | DifferenceSeverityController | GET | `/api/api-contract/lookups/difference-severities` | `ApiContractChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 91 | API Contract Checker | DifferenceSeverityController | POST | `/api/api-contract/lookups/difference-severities` | `ApiContractChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 92 | API Contract Checker | DifferenceSeverityController | PUT | `/api/api-contract/lookups/difference-severities/{id}` | `ApiContractChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 93 | API Contract Checker | DifferenceSeverityController | POST | `/api/api-contract/lookups/difference-severities/{id}/passivate` | `ApiContractChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 94 | API Contract Checker | SpecFormatController | GET | `/api/api-contract/lookups/spec-formats/{id}` | `ApiContractChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 95 | API Contract Checker | SpecFormatController | GET | `/api/api-contract/lookups/spec-formats` | `ApiContractChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 96 | API Contract Checker | SpecFormatController | POST | `/api/api-contract/lookups/spec-formats` | `ApiContractChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 97 | API Contract Checker | SpecFormatController | PUT | `/api/api-contract/lookups/spec-formats/{id}` | `ApiContractChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 98 | API Contract Checker | SpecFormatController | POST | `/api/api-contract/lookups/spec-formats/{id}/passivate` | `ApiContractChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 99 | API Contract Checker | ContractCheckRunController | POST | `/api/checks` | `ApiContractChecker.Checks.Execute` | kendi |
| 100 | API Contract Checker | ContractCheckRunController | GET | `/api/checks/{id}/status` | `ApiContractChecker.Checks.View` | kendi |
| 101 | API Contract Checker | ContractCheckRunController | GET | `/api/checks/{id}/report` | `ApiContractChecker.Checks.View` | kendi |
| 102 | API Contract Checker | ContractCheckRunController | GET | `/api/checks/{id}/findings` | `ApiContractChecker.Checks.View` | kendi |
| 103 | API Contract Checker | ContractCheckRunController | GET | `/api/checks/{id}` | `ApiContractChecker.Checks.View` | miras ‹EntityReadControllerBase› |
| 104 | API Contract Checker | ContractCheckRunController | GET | `/api/checks` | `ApiContractChecker.Checks.View` | miras ‹EntityReadControllerBase› |
| 105 | API Contract Checker | SpecSnapshotController | GET | `/api/sources/{id}/documents/{documentId}/snapshots` | `ApiContractChecker.Sources.View` | kendi |
| 106 | API Contract Checker | SpecSnapshotController | GET | `/api/snapshots/{id}` | `ApiContractChecker.Sources.View` | kendi |
| 107 | API Contract Checker | SpecSnapshotController | GET | `/api/snapshots/{id}/operations` | `ApiContractChecker.Sources.View` | kendi |
| 108 | API Contract Checker | SpecSnapshotController | POST | `/api/snapshots/{id}/operations/find` | `ApiContractChecker.Sources.View` | kendi |
| 109 | API Contract Checker | SpecSnapshotController | POST | `/api/snapshots/{id}/schemas/describe` | `ApiContractChecker.Sources.View` | kendi |
| 110 | API Contract Checker | SpecSnapshotController | GET | `/api/snapshots/authoring-results/{resultRef}` | `ApiContractChecker.Sources.View` | kendi |
| 111 | API Contract Checker | SpecSourceController | POST | `/api/sources` | `ApiContractChecker.Sources.Manage` | kendi |
| 112 | API Contract Checker | SpecSourceController | PUT | `/api/sources/{id}` | `ApiContractChecker.Sources.Manage` | kendi |
| 113 | API Contract Checker | SpecSourceController | POST | `/api/sources/{id}/passivate` | `ApiContractChecker.Sources.Manage` | kendi |
| 114 | API Contract Checker | SpecSourceController | POST | `/api/sources/{id}/test` | `ApiContractChecker.Sources.Manage` | kendi |
| 115 | API Contract Checker | SpecSourceController | POST | `/api/sources/{id}/documents/{documentId}/monitoring` | `ApiContractChecker.Sources.Manage` | kendi |
| 116 | API Contract Checker | SpecSourceController | POST | `/api/sources/{id}/documents/{documentId}/snapshot` | `ApiContractChecker.Sources.Manage` | kendi |
| 117 | API Contract Checker | SpecSourceController | GET | `/api/sources/{id}` | `ApiContractChecker.Sources.View` | miras ‹EntityReadControllerBase› |
| 118 | API Contract Checker | SpecSourceController | GET | `/api/sources` | `ApiContractChecker.Sources.View` | miras ‹EntityReadControllerBase› |
| 119 | Database Checker | AssertionController | POST | `/api/comparison/assertions/row` | `DatabaseChecker.Assertions.Execute` | kendi |
| 120 | Database Checker | AssertionController | POST | `/api/comparison/assertions/count` | `DatabaseChecker.Assertions.Execute` | kendi |
| 121 | Database Checker | AssertionController | POST | `/api/comparison/assertions/absent` | `DatabaseChecker.Assertions.Execute` | kendi |
| 122 | Database Checker | AssertionController | POST | `/api/comparison/assertions/batch` | `DatabaseChecker.Assertions.Execute` | kendi |
| 123 | Database Checker | AssertionController | POST | `/api/comparison/assertions/derivability` | `DatabaseChecker.Assertions.ValidateDerivability` | kendi |
| 124 | Database Checker | WriteSetCapabilityController | POST | `/capabilities/write-set/probe` | `DatabaseChecker.Capabilities.Probe` | kendi |
| 125 | Database Checker | WriteSetCapabilityController | POST | `/capabilities/write-set/capture` | `DatabaseChecker.Capabilities.Capture` | kendi |
| 126 | Database Checker | WriteSetCapabilityController | POST | `/capabilities/write-set/release` | `DatabaseChecker.Capabilities.Capture` | kendi |
| 127 | Database Checker | SchemaComparisonController | POST | `/api/comparison/schema-comparison` | `DatabaseChecker.Connections.Manage` | kendi |
| 128 | Database Checker | DatabaseConnectionController | POST | `/api/connections/database-connections` | `DatabaseChecker.Connections.Manage` | kendi |
| 129 | Database Checker | DatabaseConnectionController | PUT | `/api/connections/database-connections/{id}` | `DatabaseChecker.Connections.Manage` | kendi |
| 130 | Database Checker | DatabaseConnectionController | POST | `/api/connections/database-connections/{id}/passivate` | `DatabaseChecker.Connections.Manage` | kendi |
| 131 | Database Checker | DatabaseConnectionController | POST | `/api/connections/database-connections/{id}/test-connection` | `DatabaseChecker.Connections.Manage` | kendi |
| 132 | Database Checker | DatabaseConnectionController | GET | `/api/connections/database-connections/{id}` | `DatabaseChecker.Connections.View` | miras ‹EntityReadControllerBase› |
| 133 | Database Checker | DatabaseConnectionController | GET | `/api/connections/database-connections` | `DatabaseChecker.Connections.View` | miras ‹EntityReadControllerBase› |
| 134 | Database Checker | ComparisonDefinitionController | POST | `/api/definitions/comparison-definitions` | `DatabaseChecker.Definitions.Manage` | kendi |
| 135 | Database Checker | ComparisonDefinitionController | PUT | `/api/definitions/comparison-definitions/{id}` | `DatabaseChecker.Definitions.Manage` | kendi |
| 136 | Database Checker | ComparisonDefinitionController | GET | `/api/definitions/comparison-definitions/{id}` | `DatabaseChecker.Definitions.View` | miras ‹EntityReadControllerBase› |
| 137 | Database Checker | ComparisonDefinitionController | GET | `/api/definitions/comparison-definitions` | `DatabaseChecker.Definitions.View` | miras ‹EntityReadControllerBase› |
| 138 | Database Checker | DiagnosisController | POST | `/api/comparison/diagnosis` | `DatabaseChecker.Diagnosis.Execute` | kendi |
| 139 | Database Checker | ComparisonConfidenceController | GET | `/api/database-comparison/lookups/comparison-confidences/{id}` | `DatabaseChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 140 | Database Checker | ComparisonConfidenceController | GET | `/api/database-comparison/lookups/comparison-confidences` | `DatabaseChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 141 | Database Checker | ComparisonConfidenceController | POST | `/api/database-comparison/lookups/comparison-confidences` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 142 | Database Checker | ComparisonConfidenceController | PUT | `/api/database-comparison/lookups/comparison-confidences/{id}` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 143 | Database Checker | ComparisonConfidenceController | DELETE | `/api/database-comparison/lookups/comparison-confidences/{id}` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 144 | Database Checker | ComparisonRunStatusController | GET | `/api/database-comparison/lookups/comparison-run-statuses/{id}` | `DatabaseChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 145 | Database Checker | ComparisonRunStatusController | GET | `/api/database-comparison/lookups/comparison-run-statuses` | `DatabaseChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 146 | Database Checker | ComparisonRunStatusController | POST | `/api/database-comparison/lookups/comparison-run-statuses` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 147 | Database Checker | ComparisonRunStatusController | PUT | `/api/database-comparison/lookups/comparison-run-statuses/{id}` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 148 | Database Checker | ComparisonRunStatusController | DELETE | `/api/database-comparison/lookups/comparison-run-statuses/{id}` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 149 | Database Checker | ComparisonTypeController | GET | `/api/database-comparison/lookups/comparison-types/{id}` | `DatabaseChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 150 | Database Checker | ComparisonTypeController | GET | `/api/database-comparison/lookups/comparison-types` | `DatabaseChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 151 | Database Checker | ComparisonTypeController | POST | `/api/database-comparison/lookups/comparison-types` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 152 | Database Checker | ComparisonTypeController | PUT | `/api/database-comparison/lookups/comparison-types/{id}` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 153 | Database Checker | ComparisonTypeController | DELETE | `/api/database-comparison/lookups/comparison-types/{id}` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 154 | Database Checker | DatabaseEngineController | GET | `/api/database-comparison/lookups/database-engines/{id}` | `DatabaseChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 155 | Database Checker | DatabaseEngineController | GET | `/api/database-comparison/lookups/database-engines` | `DatabaseChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 156 | Database Checker | DatabaseEngineController | POST | `/api/database-comparison/lookups/database-engines` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 157 | Database Checker | DatabaseEngineController | PUT | `/api/database-comparison/lookups/database-engines/{id}` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 158 | Database Checker | DatabaseEngineController | DELETE | `/api/database-comparison/lookups/database-engines/{id}` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 159 | Database Checker | DifferenceKindController | GET | `/api/database-comparison/lookups/difference-kinds/{id}` | `DatabaseChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 160 | Database Checker | DifferenceKindController | GET | `/api/database-comparison/lookups/difference-kinds` | `DatabaseChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 161 | Database Checker | DifferenceKindController | POST | `/api/database-comparison/lookups/difference-kinds` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 162 | Database Checker | DifferenceKindController | PUT | `/api/database-comparison/lookups/difference-kinds/{id}` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 163 | Database Checker | DifferenceKindController | DELETE | `/api/database-comparison/lookups/difference-kinds/{id}` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 164 | Database Checker | ReportFormatController | GET | `/api/database-comparison/lookups/report-formats/{id}` | `DatabaseChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 165 | Database Checker | ReportFormatController | GET | `/api/database-comparison/lookups/report-formats` | `DatabaseChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 166 | Database Checker | ReportFormatController | POST | `/api/database-comparison/lookups/report-formats` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 167 | Database Checker | ReportFormatController | PUT | `/api/database-comparison/lookups/report-formats/{id}` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 168 | Database Checker | ReportFormatController | DELETE | `/api/database-comparison/lookups/report-formats/{id}` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 169 | Database Checker | SchemaObjectTypeController | GET | `/api/database-comparison/lookups/schema-object-types/{id}` | `DatabaseChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 170 | Database Checker | SchemaObjectTypeController | GET | `/api/database-comparison/lookups/schema-object-types` | `DatabaseChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 171 | Database Checker | SchemaObjectTypeController | POST | `/api/database-comparison/lookups/schema-object-types` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 172 | Database Checker | SchemaObjectTypeController | PUT | `/api/database-comparison/lookups/schema-object-types/{id}` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 173 | Database Checker | SchemaObjectTypeController | DELETE | `/api/database-comparison/lookups/schema-object-types/{id}` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 174 | Database Checker | ScopeKindController | GET | `/api/database-comparison/lookups/scope-kinds/{id}` | `DatabaseChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 175 | Database Checker | ScopeKindController | GET | `/api/database-comparison/lookups/scope-kinds` | `DatabaseChecker.Lookups.View` | miras ‹LookupControllerBase› |
| 176 | Database Checker | ScopeKindController | POST | `/api/database-comparison/lookups/scope-kinds` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 177 | Database Checker | ScopeKindController | PUT | `/api/database-comparison/lookups/scope-kinds/{id}` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 178 | Database Checker | ScopeKindController | DELETE | `/api/database-comparison/lookups/scope-kinds/{id}` | `DatabaseChecker.Lookups.Manage` | miras ‹LookupControllerBase› |
| 179 | Database Checker | ProjectionController | POST | `/api/comparison/projections/rows` | `DatabaseChecker.Projections.Execute` | kendi |
| 180 | Database Checker | ComparisonRunController | GET | `/api/comparison/runs/{id}/detail` | `DatabaseChecker.Runs.View` | kendi |
| 181 | Database Checker | ComparisonRunController | POST | `/api/comparison/runs/execute` | `DatabaseChecker.Runs.Create` | kendi |
| 182 | Database Checker | ComparisonRunController | GET | `/api/comparison/runs/{id}/report` | `DatabaseChecker.Runs.View` | kendi |
| 183 | Database Checker | ComparisonRunController | GET | `/api/comparison/runs/{id}/findings` | `DatabaseChecker.Runs.View` | kendi |
| 184 | Database Checker | ComparisonRunController | GET | `/api/comparison/runs/{id}` | `DatabaseChecker.Runs.View` | miras ‹EntityReadControllerBase› |
| 185 | Database Checker | ComparisonRunController | GET | `/api/comparison/runs` | `DatabaseChecker.Runs.View` | miras ‹EntityReadControllerBase› |
| 186 | Database Checker | SchemaDiscoveryController | GET | `/api/comparison/schema-discovery/{connectionId}/schemas` | `DatabaseChecker.Connections.View` | kendi |
| 187 | Database Checker | SchemaDiscoveryController | GET | `/api/comparison/schema-discovery/{connectionId}/objects` | `DatabaseChecker.Connections.View` | kendi |
| 188 | Database Checker | SchemaDiscoveryController | GET | `/api/comparison/schema-discovery/{connectionId}/snapshot` | `DatabaseChecker.Connections.View` | kendi |
| 189 | Database Checker | SchemaDiscoveryController | GET | `/api/comparison/schema-discovery/{connectionId}/fingerprint` | `DatabaseChecker.Connections.View` | kendi |
| 190 | Database Checker | SchemaDiscoveryController | GET | `/api/comparison/schema-discovery/{connectionId}/tables/{schema}/{table}/describe` | `DatabaseChecker.Connections.View` | kendi |
