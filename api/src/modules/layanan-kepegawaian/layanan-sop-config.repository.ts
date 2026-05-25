import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type LayananSopConfigRow = {
  id: string;
  sopKey: string;
  code: string;
  title: string;
  shortLabel: string;
  description: string;
  rhkCodes: Prisma.JsonValue;
  sortOrder: number;
  isActive: boolean;
  updatedAt: Date;
};

@Injectable()
export class LayananSopConfigRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findAll(): Promise<LayananSopConfigRow[]> {
    return this.prisma.layananSopConfig.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  findAllActive(): Promise<LayananSopConfigRow[]> {
    return this.prisma.layananSopConfig.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findBySopKey(sopKey: string): Promise<LayananSopConfigRow | null> {
    return this.prisma.layananSopConfig.findUnique({ where: { sopKey } });
  }

  async partialUpdate(
    sopKey: string,
    data: {
      title?: string;
      shortLabel?: string;
      description?: string;
      rhkCodes?: string[];
      sortOrder?: number;
      isActive?: boolean;
    },
  ): Promise<LayananSopConfigRow> {
    const update: Prisma.LayananSopConfigUpdateInput = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.shortLabel !== undefined) update.shortLabel = data.shortLabel;
    if (data.description !== undefined) update.description = data.description;
    if (data.rhkCodes !== undefined) update.rhkCodes = data.rhkCodes as Prisma.InputJsonValue;
    if (data.sortOrder !== undefined) update.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) update.isActive = data.isActive;

    return this.prisma.layananSopConfig.update({
      where: { sopKey },
      data: update,
    });
  }

  upsert(
    sopKey: string,
    data: Omit<LayananSopConfigRow, 'id' | 'updatedAt'>,
  ) {
    const payload: Prisma.LayananSopConfigCreateInput = {
      sopKey: data.sopKey,
      code: data.code,
      title: data.title,
      shortLabel: data.shortLabel,
      description: data.description,
      rhkCodes: data.rhkCodes as Prisma.InputJsonValue,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    };
    return this.prisma.layananSopConfig.upsert({
      where: { sopKey },
      create: payload,
      update: payload,
    });
  }
}
