import { createReadService } from "@/services/base.service";
import type { OperatorDto } from "@/types";

export const operatorsService = createReadService<OperatorDto>("/api/operators");
