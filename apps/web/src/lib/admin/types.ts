export type AdminUserRecord = {
  id: string;
  username: string;
  name: string;
  email: string | null;
  nip: string | null;
  phone: string | null;
  status: string;
  unitKerja: {
    id: string;
    kode: string;
    nama: string;
  } | null;
  roles: Array<{
    code: string;
    name: string;
  }>;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminRoleRecord = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
  permissionCount: number;
};

export type AdminPermissionRecord = {
  id: string;
  code: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  isActive: boolean;
};

export type AdminSettingsSummary = {
  users: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
  };
  roles: {
    total: number;
    active: number;
    system: number;
  };
  permissions: {
    total: number;
    active: number;
  };
};
