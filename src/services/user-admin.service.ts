import type {
  GetPermissionListResultDto,
  Guid,
  IdentityUserDto,
  IdentityUserUpdateDto,
  InviteMemberDto,
  UpdatePermissionsDto,
} from "@/types";
import { authService } from "@/services/auth.service";
import { identityRolesService, identityUsersService } from "@/services/identity.service";
import { permissionsService } from "@/services/permissions.service";
import { tenantUsersService } from "@/services/tenants.service";

// Kullanici yonetim ekraninin (AdminUsersWorkspace) veri kaynagini soyutlar.
//
// Ayni ekran iki baglamda calisir:
//  - HOST (tenantId yok): host admin kendi HOST kullanicilarini yonetir -> stok ABP
//    /api/identity/* + /api/permission-management/* uclari dogru calisir.
//  - TENANT (tenantId var): host admin bir TENANT'in kullanicilarini yonetir -> stok
//    uclar tenant'i token claim'inden cozdugu ve host admin'in claim'i olmadigi icin
//    hep HOST'ta calisirdi. Bu baglamda route-tabanli /api/multi-tenancy/tenants/{id}/users
//    uclari kullanilir (backend CurrentTenant.Change ile hedef tenant kapsaminda calisir).
//
// Iki baglam ayni yeteneklere (listele/duzenle/sil/davet/izin) sahiptir; ekran tek tip
// kalsin diye fark burada, tek yerde cozulur.

// Liste satiri icin normallestirilmis gorunum (host + tenant listeleri ayni ABP IdentityUserDto'yu doner).
export interface UserListItem {
  id: Guid;
  userName: string;
  email?: string | null;
  name?: string | null;
  surname?: string | null;
  isActive: boolean;
  emailConfirmed: boolean;
  roleNames?: string[] | null;
}

export interface AssignableRole {
  id: Guid;
  name: string;
}

export interface UserAdminClient {
  listUsers(): Promise<UserListItem[]>;
  // Duzenleme icin tam kullanici (concurrencyStamp, phoneNumber vb.); liste satiri bunlari tasimaz.
  getUserForEdit(userId: Guid): Promise<IdentityUserDto>;
  getUserRoles(userId: Guid): Promise<string[]>;
  listAssignableRoles(): Promise<AssignableRole[]>;
  updateUser(userId: Guid, dto: IdentityUserUpdateDto): Promise<unknown>;
  deleteUser(userId: Guid): Promise<void>;
  invite(dto: InviteMemberDto): Promise<unknown>;
  getUserPermissions(userId: Guid): Promise<GetPermissionListResultDto>;
  updateUserPermissions(userId: Guid, dto: UpdatePermissionsDto): Promise<void>;
}

function hostUserAdminClient(): UserAdminClient {
  return {
    async listUsers() {
      const result = await identityUsersService.getList({ maxResultCount: 1000, sorting: "userName" });
      return result.items;
    },
    getUserForEdit: (userId) => identityUsersService.getById(userId),
    async getUserRoles(userId) {
      const result = await identityUsersService.getRoles(userId);
      return result.items.map((role) => role.name);
    },
    async listAssignableRoles() {
      const result = await identityRolesService.getAll();
      return result.items.map((role) => ({ id: role.id, name: role.name }));
    },
    updateUser: (userId, dto) => identityUsersService.update(userId, dto),
    deleteUser: (userId) => identityUsersService.remove(userId),
    invite: (dto) => authService.inviteMember(dto),
    getUserPermissions: (userId) => permissionsService.getForUser(userId),
    updateUserPermissions: (userId, dto) => permissionsService.updateForUser(userId, dto),
  };
}

function tenantUserAdminClient(tenantId: string): UserAdminClient {
  return {
    async listUsers() {
      const result = await tenantUsersService.getList(tenantId, { maxResultCount: 1000 });
      return result.items;
    },
    getUserForEdit: (userId) => tenantUsersService.get(tenantId, userId),
    async getUserRoles(userId) {
      const result = await tenantUsersService.getRoles(tenantId, userId);
      return result.items.map((role) => role.name);
    },
    async listAssignableRoles() {
      const result = await tenantUsersService.getAssignableRoles(tenantId);
      return result.items.map((role) => ({ id: role.id, name: role.name }));
    },
    updateUser: (userId, dto) => tenantUsersService.update(tenantId, userId, dto),
    deleteUser: (userId) => tenantUsersService.remove(tenantId, userId),
    invite: (dto) => tenantUsersService.invite(tenantId, dto),
    getUserPermissions: (userId) => tenantUsersService.getPermissions(tenantId, userId),
    updateUserPermissions: (userId, dto) => tenantUsersService.updatePermissions(tenantId, userId, dto),
  };
}

export function makeUserAdminClient(tenantId?: string): UserAdminClient {
  return tenantId ? tenantUserAdminClient(tenantId) : hostUserAdminClient();
}
