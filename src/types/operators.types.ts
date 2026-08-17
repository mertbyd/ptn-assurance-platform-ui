import type { Guid } from "@/types/api.types";

export interface OperatorDto {
  id: Guid;
  userId: Guid;
  userName: string;
  email: string;
  isActive: boolean;
}

export interface CreateOperatorDto {
  userId: Guid;
  isActive: boolean;
}

export type UpdateOperatorDto = CreateOperatorDto;
