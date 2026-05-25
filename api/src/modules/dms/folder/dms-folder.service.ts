import { Inject, Injectable } from '@nestjs/common';
import { AuthUser } from '../../auth/auth.types';
import { getDmsAccessScope } from '../constants/dms-permission.constant';
import {
  DmsFolderAggregateRow,
  DmsFolderRepository,
} from './dms-folder.repository';

export interface DmsCategoryNode {
  category: string;
  count: number;
}

export interface DmsYearNode {
  year: number | null;
  total: number;
  categories: DmsCategoryNode[];
}

export interface DmsFolderNode {
  unitKerjaId: string | null;
  unitKerjaKode: string | null;
  unitKerjaNama: string | null;
  total: number;
  years: DmsYearNode[];
}

export interface DmsFolderTree {
  nodes: DmsFolderNode[];
  grandTotal: number;
}

@Injectable()
export class DmsFolderService {
  constructor(
    @Inject(DmsFolderRepository)
    private readonly folderRepository: DmsFolderRepository,
  ) {}

  async getFolderTree(user: AuthUser): Promise<DmsFolderTree> {
    const scope = getDmsAccessScope(user);

    const where =
      scope === 'ALL'
        ? {}
        : scope === 'UNIT'
          ? { unitKerjaIds: user.unitKerjaId ? [user.unitKerjaId] : [] }
          : { onlyOwnedBy: user.id };

    const rows = await this.folderRepository.aggregateFolders(where);
    return this.buildTree(rows);
  }

  private buildTree(rows: DmsFolderAggregateRow[]): DmsFolderTree {
    const nodeMap = new Map<string, DmsFolderNode>();
    let grandTotal = 0;

    for (const row of rows) {
      const nodeKey = row.unit_kerja_id ?? '__shared__';
      const count = Number(row.doc_count);
      grandTotal += count;

      if (!nodeMap.has(nodeKey)) {
        nodeMap.set(nodeKey, {
          unitKerjaId: row.unit_kerja_id,
          unitKerjaKode: row.unit_kerja_kode,
          unitKerjaNama: row.unit_kerja_nama ?? 'Tanpa Unit Kerja',
          total: 0,
          years: [],
        });
      }

      const node = nodeMap.get(nodeKey)!;
      node.total += count;

      const yearKey = row.year ?? -1;
      let yearNode = node.years.find((y) => y.year === row.year);
      if (!yearNode) {
        yearNode = { year: row.year, total: 0, categories: [] };
        node.years.push(yearNode);
      }

      yearNode.total += count;
      yearNode.categories.push({ category: row.category, count });
    }

    return {
      nodes: Array.from(nodeMap.values()),
      grandTotal,
    };
  }
}
