import type { Guid, PagedResultDto, PagedResultRequestDto } from "@/types/api.types";

// Tenant genelindeki rapor alicisi; belirli bir plan veya operator kaydina bagli degildir.
export interface ComparisonRecipientDto {
  id: Guid;
  name?: string | null;
  email: string;
  creationTime: string;
  isActive: boolean;
}

export interface CreateComparisonRecipientDto {
  name?: string | null;
  email: string;
  isActive: boolean;
}

export type UpdateComparisonRecipientDto = CreateComparisonRecipientDto;

export interface ComparisonRecipientListInputDto extends PagedResultRequestDto {
  sorting?: string;
}

export interface ComparisonNotificationSettingsDto {
  sendWhenNoDifferences: boolean;
}

export type ComparisonRecipientPage = PagedResultDto<ComparisonRecipientDto>;
