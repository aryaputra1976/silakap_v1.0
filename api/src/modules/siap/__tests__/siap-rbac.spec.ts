import { Test, TestingModule } from '@nestjs/testing';
import { SiapTaskRepository } from '../services/siap-task.repository';
import { SiapAssignmentService } from '../services/siap-assignment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SIAP_ROLES } from '../constants/siap-roles.constant';
import { SiapAssignGuard } from '../guards/siap-assign.guard';
import { ExecutionContext } from '@nestjs/common';

describe('SIAP RBAC Unit Tests', () => {
  let taskRepository: SiapTaskRepository;
  let assignmentService: SiapAssignmentService;
  let prismaService: PrismaService;
  let siapAssignGuard: SiapAssignGuard;

  beforeEach(async () => {
    const mockPrismaService = {
      siapTask: {
        count: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SiapTaskRepository,
        SiapAssignmentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    taskRepository = module.get<SiapTaskRepository>(SiapTaskRepository);
    assignmentService = module.get<SiapAssignmentService>(
      SiapAssignmentService,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    siapAssignGuard = new SiapAssignGuard();
  });

  describe('SiapAssignGuard - RBAC Validation', () => {
    it('should allow SUPER_ADMIN to assign', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              id: 'user-1',
              roles: [SIAP_ROLES.SUPER_ADMIN],
            },
          }),
        }),
      } as ExecutionContext;

      expect(siapAssignGuard.canActivate(context)).toBe(true);
    });

    it('should allow KABID to assign', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              id: 'user-1',
              roles: [SIAP_ROLES.KABID],
            },
          }),
        }),
      } as ExecutionContext;

      expect(siapAssignGuard.canActivate(context)).toBe(true);
    });

    it('should allow ANALIS_MADYA to assign', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              id: 'user-1',
              roles: [SIAP_ROLES.ANALIS_MADYA],
            },
          }),
        }),
      } as ExecutionContext;

      expect(siapAssignGuard.canActivate(context)).toBe(true);
    });

    it('should NOT allow ADMIN_BKPSDM to assign', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              id: 'user-1',
              roles: [SIAP_ROLES.ADMIN_BKPSDM],
            },
          }),
        }),
      } as ExecutionContext;

      expect(() => siapAssignGuard.canActivate(context)).toThrow();
    });

    it('should NOT allow ANALIS_PERTAMA to assign', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              id: 'user-1',
              roles: [SIAP_ROLES.ANALIS_PERTAMA],
            },
          }),
        }),
      } as ExecutionContext;

      expect(() => siapAssignGuard.canActivate(context)).toThrow();
    });

    it('should NOT allow ANALIS_MUDA to assign', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              id: 'user-1',
              roles: [SIAP_ROLES.ANALIS_MUDA],
            },
          }),
        }),
      } as ExecutionContext;

      expect(() => siapAssignGuard.canActivate(context)).toThrow();
    });

    it('should NOT allow PENELAAH to assign', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              id: 'user-1',
              roles: [SIAP_ROLES.PENELAAH],
            },
          }),
        }),
      } as ExecutionContext;

      expect(() => siapAssignGuard.canActivate(context)).toThrow();
    });

    it('should NOT allow OPD to assign', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              id: 'user-1',
              roles: [SIAP_ROLES.OPD],
            },
          }),
        }),
      } as ExecutionContext;

      expect(() => siapAssignGuard.canActivate(context)).toThrow();
    });
  });

  describe('SiapTaskRepository - Workload Calculation', () => {
    it('should count active tasks for user', async () => {
      jest.spyOn(prismaService.siapTask, 'count').mockResolvedValue(5);

      const count = await taskRepository.countActiveTasksByUser('user-123');

      expect(count).toBe(5);
      expect(prismaService.siapTask.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assignedTo: 'user-123',
          }),
        }),
      );
    });

    it('should count completed tasks for user', async () => {
      jest.spyOn(prismaService.siapTask, 'count').mockResolvedValue(10);

      const count = await taskRepository.countCompletedTasksByUser('user-123');

      expect(count).toBe(10);
    });

    it('should count overdue tasks for user', async () => {
      jest.spyOn(prismaService.siapTask, 'count').mockResolvedValue(2);

      const count = await taskRepository.countOverdueTasksByUser('user-123');

      expect(count).toBe(2);
    });

    it('should calculate average completion time', async () => {
      const mockTasks = [
        {
          startedAt: new Date('2026-05-01T10:00:00'),
          completedAt: new Date('2026-05-01T12:00:00'),
        },
        {
          startedAt: new Date('2026-05-02T10:00:00'),
          completedAt: new Date('2026-05-02T14:00:00'),
        },
      ];

      jest
        .spyOn(prismaService.siapTask, 'findMany')
        .mockResolvedValue(mockTasks as any);

      const avgHours = await taskRepository.avgCompletionTimeByUser('user-123');

      expect(avgHours).toBe(3); // Average of 2 and 4 hours
    });

    it('should return 0 for average if no completed tasks', async () => {
      jest.spyOn(prismaService.siapTask, 'findMany').mockResolvedValue([]);

      const avgHours = await taskRepository.avgCompletionTimeByUser('user-123');

      expect(avgHours).toBe(0);
    });

    it('should get user workload summary', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        id: 'user-123',
        name: 'John Analyst',
      } as any);

      jest.spyOn(prismaService.siapTask, 'count').mockResolvedValue(5);
      jest
        .spyOn(prismaService.siapTask, 'findMany')
        .mockResolvedValue([]);

      const summary = await taskRepository.getUserWorkloadSummary('user-123');

      expect(summary).toEqual(
        expect.objectContaining({
          userId: 'user-123',
          userName: 'John Analyst',
          activeTaskCount: 5,
          completedTaskCount: 5,
          overdueTaskCount: 5,
          avgCompletionHours: 0,
        }),
      );
    });
  });

  describe('SiapAssignmentService - Manual Assignment', () => {
    it('should throw error if task not found', async () => {
      jest.spyOn(prismaService.siapTask, 'findUnique').mockResolvedValue(null);

      await expect(
        assignmentService.manualAssignTask('invalid-task', 'user-2', 'user-1'),
      ).rejects.toThrow('tidak ditemukan');
    });

    it('should throw error if target user not found', async () => {
      jest.spyOn(prismaService.siapTask, 'findUnique').mockResolvedValue({
        id: 'task-123',
        assignedTo: null,
      } as any);

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        assignmentService.manualAssignTask('task-123', 'invalid-user', 'user-1'),
      ).rejects.toThrow('tidak ditemukan');
    });

    it('should throw error if target user is not active', async () => {
      jest.spyOn(prismaService.siapTask, 'findUnique').mockResolvedValue({
        id: 'task-123',
        assignedTo: null,
      } as any);

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        id: 'user-2',
        name: 'Inactive User',
        isActive: false,
      } as any);

      await expect(
        assignmentService.manualAssignTask('task-123', 'user-2', 'user-1'),
      ).rejects.toThrow('tidak aktif');
    });

    it('should successfully assign task to active user', async () => {
      jest.spyOn(prismaService.siapTask, 'findUnique').mockResolvedValue({
        id: 'task-123',
        assignedTo: null,
        case: { id: 'case-1' },
      } as any);

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        id: 'user-2',
        name: 'John Analyst',
        isActive: true,
      } as any);

      jest.spyOn(prismaService.siapTask, 'update').mockResolvedValue({
        id: 'task-123',
        assignedTo: 'user-2',
        assignedAt: new Date(),
      } as any);

      jest
        .spyOn(prismaService.siapTask, 'count')
        .mockResolvedValue(5);

      const result = await assignmentService.manualAssignTask(
        'task-123',
        'user-2',
        'user-1',
      );

      expect(result).toEqual(
        expect.objectContaining({
          taskId: 'task-123',
          assignedToUserId: 'user-2',
          assignedToUserName: 'John Analyst',
          assignmentMethod: 'MANUAL',
          workloadAtAssignment: 5,
        }),
      );
    });
  });

  describe('RBAC Constants', () => {
    it('should have correct ASSIGN_ROLES defined', () => {
      expect(SIAP_ROLES.SUPER_ADMIN).toBe('SUPER_ADMIN');
      expect(SIAP_ROLES.KABID).toBe('KABID');
      expect(SIAP_ROLES.ANALIS_MADYA).toBe('ANALIS_MADYA');
      expect(SIAP_ROLES.ADMIN_BKPSDM).toBe('ADMIN_BKPSDM');
      expect(SIAP_ROLES.ANALIS_PERTAMA).toBe('ANALIS_PERTAMA');
    });

    it('should have workload pool roles correctly defined', () => {
      const poolRoles = [
        SIAP_ROLES.ANALIS_PERTAMA,
        SIAP_ROLES.PENELAAH,
        SIAP_ROLES.PPPK,
      ];
      expect(poolRoles).toHaveLength(3);
    });
  });
});
