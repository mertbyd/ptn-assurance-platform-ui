import { apiClient } from "@/lib/api-client";
import { requireEntityId } from "@/lib/guid";
import type { Guid, PagedResultDto, PagedResultRequestDto } from "@/types";

function normalizePaging(input?: PagedResultRequestDto) {
  return {
    SkipCount: input?.skipCount ?? 0,
    MaxResultCount: input?.maxResultCount ?? 100,
    Sorting: input?.sorting,
  };
}

export function createReadService<TDto>(path: string) {
  return {
    getList(input?: PagedResultRequestDto): Promise<PagedResultDto<TDto>> {
      return apiClient.get(path, {
        params: normalizePaging(input),
      });
    },

    getById(id: Guid): Promise<TDto> {
      return apiClient.get(`${path}/${requireEntityId(id)}`);
    },
  } as const;
}

export function createCreateUpdateService<TDto, TCreateDto, TUpdateDto>(path: string) {
  const readService = createReadService<TDto>(path);

  return {
    ...readService,

    create(dto: TCreateDto): Promise<TDto> {
      return apiClient.post(path, dto);
    },

    update(id: Guid, dto: TUpdateDto): Promise<TDto> {
      return apiClient.put(`${path}/${requireEntityId(id)}`, dto);
    },

  } as const;
}

export function createCrudService<TDto, TCreateDto, TUpdateDto>(path: string) {
  const mutableService = createCreateUpdateService<TDto, TCreateDto, TUpdateDto>(path);

  return {
    ...mutableService,

    remove(id: Guid): Promise<void> {
      return apiClient.delete(`${path}/${requireEntityId(id)}`);
    },
  } as const;
}
