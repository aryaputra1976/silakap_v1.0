export type Role = string;

export type AuthUser = {
  id: string;
  username: string;
  name: string;
  email: string | null;
  roles: string[];
  unitKerjaId: string | null;
  unitKerja: {
    id: string;
    kode: string;
    nama: string;
  } | null;
};

export type JwtPayload = {
  sub: string;
  username: string;
  name: string;
  email: string | null;
  roles: string[];
  unitKerjaId: string | null;
  unitKerja: AuthUser['unitKerja'];
};
