import { type LucideIcon } from 'lucide-react';
import type { AppModuleKey } from '@/lib/rbac/policies';
import type { AppRole } from '@/lib/rbac/roles';

export interface MenuItem {
  title?: string;
  icon?: LucideIcon;
  path?: string;
  rootPath?: string;
  childrenIndex?: number;
  heading?: string;
  children?: MenuConfig;
  disabled?: boolean;
  collapse?: boolean;
  collapseTitle?: string;
  expandTitle?: string;
  badge?: string;
  separator?: boolean;
  moduleKey?: AppModuleKey;
  allowedRoles?: AppRole[];
  requiredPermission?: string;
}

export type MenuConfig = MenuItem[];
