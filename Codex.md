5. Update Repository Worklog
api/src/modules/siap-worklog/siap-worklog.repository.ts

Tambahkan include attachment ke worklogInclude.

Cari:

const worklogInclude = {

Tambahkan properti:

  attachments: {
    include: {
      document: {
        select: {
          id: true,
          caseId: true,
          documentType: true,
          fileName: true,
          originalFileName: true,
          storagePath: true,
          mimeType: true,
          fileSize: true,
          checksum: true,
          version: true,
          uploadedBy: true,
          uploadedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  },

Lalu tambahkan method di dalam class SiapWorklogRepository:

  async createAttachment(
    data: Prisma.SiapWorklogAttachmentUncheckedCreateInput,
  ) {
    return this.prisma.siapWorklogAttachment.create({
      data,
      include: {
        document: {
          select: {
            id: true,
            caseId: true,
            documentType: true,
            fileName: true,
            originalFileName: true,
            storagePath: true,
            mimeType: true,
            fileSize: true,
            checksum: true,
            version: true,
            uploadedBy: true,
            uploadedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async findAttachmentById(id: string) {
    return this.prisma.siapWorklogAttachment.findUnique({
      where: { id },
      include: {
        worklog: {
          select: {
            id: true,
            userId: true,
            unitKerjaId: true,
            status: true,
          },
        },
        document: {
          select: {
            id: true,
            caseId: true,
            documentType: true,
            fileName: true,
            originalFileName: true,
            storagePath: true,
            mimeType: true,
            fileSize: true,
            checksum: true,
            version: true,
            uploadedBy: true,
            uploadedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async findAttachmentsByWorklogId(worklogId: string) {
    return this.prisma.siapWorklogAttachment.findMany({
      where: {
        worklogId,
      },
      include: {
        document: {
          select: {
            id: true,
            caseId: true,
            documentType: true,
            fileName: true,
            originalFileName: true,
            storagePath: true,
            mimeType: true,
            fileSize: true,
            checksum: true,
            version: true,
            uploadedBy: true,
            uploadedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteAttachment(id: string) {
    return this.prisma.siapWorklogAttachment.delete({
      where: { id },
    });
  }
6. Update Service Worklog
api/src/modules/siap-worklog/siap-worklog.service.ts

Tambahkan import:

import { SiarsipService } from '../siarsip/siarsip.service';
import { UploadWorklogAttachmentDto } from './dto/upload-worklog-attachment.dto';
import { UploadedWorklogAttachmentFile } from './siap-worklog-attachment.types';

Tambahkan SiarsipService di constructor:

    @Inject(SiarsipService)
    private readonly siarsipService: SiarsipService,

Contoh constructor menjadi:

  constructor(
    @Inject(SiapWorklogRepository)
    private readonly worklogRepository: SiapWorklogRepository,
    @Inject(EventBusService)
    private readonly eventBusService: EventBusService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
    @Inject(SiarsipService)
    private readonly siarsipService: SiarsipService,
  ) {}

Tambahkan method berikut di dalam class:

  async uploadAttachment(
    worklogId: string,
    dto: UploadWorklogAttachmentDto,
    file: UploadedWorklogAttachmentFile | undefined,
    user: AuthUser,
    context?: AuditContext,
  ) {
    const worklog = await this.getWorklogForUser(worklogId, user);

    if (!this.canUploadAttachment(worklog, user)) {
      throw new ForbiddenException(
        'Anda tidak berwenang mengunggah bukti dukung buku kerja ini',
      );
    }

    const document = await this.siarsipService.uploadDocument(
      worklog.caseId ?? worklog.id,
      {
        documentType: 'SIAP_WORKLOG_BUKTI',
        description: this.normalizeOptionalText(dto.description),
      },
      file,
      user,
      context,
    );

    const attachment = await this.worklogRepository.createAttachment({
      worklogId: worklog.id,
      documentId: document.id,
      label: this.normalizeNullableText(dto.label),
      description: this.normalizeNullableText(dto.description),
      createdBy: user.id,
    });

    await this.auditService.record({
      entityType: 'SIAP_WORKLOG_ATTACHMENT',
      entityId: attachment.id,
      action: 'WORKLOG_ATTACHMENT_UPLOADED',
      performedBy: user.id,
      afterData: {
        worklogId: worklog.id,
        documentId: document.id,
        label: attachment.label,
        fileName: document.fileName,
        originalFileName: document.originalFileName,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
      },
      context,
    });

    return this.toAttachmentResponse(attachment);
  }

  async findAttachments(worklogId: string, user: AuthUser) {
    const worklog = await this.getWorklogForUser(worklogId, user);
    const attachments = await this.worklogRepository.findAttachmentsByWorklogId(
      worklog.id,
    );

    return attachments.map((item) => this.toAttachmentResponse(item));
  }

  async deleteAttachment(
    worklogId: string,
    attachmentId: string,
    user: AuthUser,
    context?: AuditContext,
  ) {
    const worklog = await this.getWorklogForUser(worklogId, user);

    if (!this.canUploadAttachment(worklog, user)) {
      throw new ForbiddenException(
        'Anda tidak berwenang menghapus bukti dukung buku kerja ini',
      );
    }

    const attachment = await this.worklogRepository.findAttachmentById(
      attachmentId.trim(),
    );

    if (!attachment || attachment.worklogId !== worklog.id) {
      throw new NotFoundException('Bukti dukung tidak ditemukan');
    }

    await this.worklogRepository.deleteAttachment(attachment.id);

    await this.auditService.record({
      entityType: 'SIAP_WORKLOG_ATTACHMENT',
      entityId: attachment.id,
      action: 'WORKLOG_ATTACHMENT_DELETED',
      performedBy: user.id,
      beforeData: {
        worklogId: worklog.id,
        documentId: attachment.documentId,
        label: attachment.label,
        document: attachment.document,
      },
      context,
    });

    return {
      deleted: true,
      id: attachment.id,
    };
  }

  private canUploadAttachment(worklog: SiapWorklogRecord, user: AuthUser) {
    if (worklog.userId === user.id) {
      return [
        SiapWorklogStatus.DRAFT,
        SiapWorklogStatus.REVISION_REQUIRED,
        SiapWorklogStatus.SUBMITTED,
      ].includes(worklog.status);
    }

    if (this.hasAnyRole(user, ['SUPER_ADMIN', 'ADMIN_BKPSDM'])) {
      return true;
    }

    return false;
  }

  private toAttachmentResponse(attachment: {
    id: string;
    worklogId: string;
    documentId: string;
    label: string | null;
    description: string | null;
    createdAt: Date;
    createdBy: string | null;
    document: {
      id: string;
      caseId: string | null;
      documentType: string;
      fileName: string;
      originalFileName: string | null;
      storagePath: string;
      mimeType: string | null;
      fileSize: number | null;
      checksum: string | null;
      version: number;
      uploadedBy: string | null;
      uploadedAt: Date;
      createdAt: Date;
      updatedAt: Date;
    };
  }) {
    return {
      id: attachment.id,
      worklogId: attachment.worklogId,
      documentId: attachment.documentId,
      label: attachment.label,
      description: attachment.description,
      createdAt: attachment.createdAt,
      createdBy: attachment.createdBy,
      document: attachment.document,
    };
  }

Catatan penting: method di atas memakai siarsipService.uploadDocument(), tetapi service SIARSIP sekarang mewajibkan caseId valid karena storage berbasis cases/{caseId}. Untuk worklog tanpa caseId, kita perlu opsi upload khusus worklog supaya tidak gagal.

Jadi tambahkan method baru di SiarsipService.

7. Update SIARSIP Service untuk upload bukti worklog
api/src/modules/siarsip/siarsip.service.ts

Tambahkan method public ini di dalam class SiarsipService:

  async uploadStandaloneDocument(
    ownerId: string,
    documentTypeValue: string,
    file: UploadedDocumentFile | undefined,
    user: AuthUser,
    context?: AuditContext,
  ) {
    if (!file) {
      throw new BadRequestException('File wajib diunggah');
    }

    const documentType = this.normalizeDocumentType(documentTypeValue);
    const extension = this.getAllowedExtension(file.mimetype);

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new BadRequestException('Ukuran file maksimal 2 MB');
    }

    const checksum = createHash('sha256').update(file.buffer).digest('hex');
    const timestamp = Date.now();
    const random = randomBytes(4).toString('hex');
    const storedFileName = `${documentType}-${timestamp}-${random}.${extension}`;
    const relativeStoragePath = ['uploads', 'worklogs', ownerId, storedFileName].join('/');
    const absoluteStoragePath = this.resolveSafeStoragePath(relativeStoragePath);

    await mkdir(resolve(this.getUploadRoot(), 'worklogs', ownerId), {
      recursive: true,
    });
    await writeFile(absoluteStoragePath, file.buffer);

    const created = await this.siarsipRepository.createDocument({
      caseId: null,
      documentType,
      fileName: storedFileName,
      originalFileName: basename(file.originalname),
      storagePath: relativeStoragePath,
      mimeType: file.mimetype,
      fileSize: file.size,
      checksum,
      uploadedBy: user.id,
    });

    await this.auditService.record({
      entityType: 'DOCUMENT',
      entityId: created.id,
      action: 'STANDALONE_DOCUMENT_UPLOADED',
      performedBy: user.id,
      afterData: {
        ownerId,
        documentType,
        fileName: storedFileName,
        originalFileName: basename(file.originalname),
        mimeType: file.mimetype,
        fileSize: file.size,
        checksum,
      },
      context,
    });

    return this.toDocumentResponse(created);
  }

Lalu ubah method resolveSafeStoragePath() agar menerima folder worklogs. Saat ini validasinya sudah berdasarkan uploads root, jadi path uploads/worklogs/... aman. Tidak perlu ubah.

Sekarang di SiapWorklogService.uploadAttachment(), ganti bagian upload dokumen:

    const document = await this.siarsipService.uploadDocument(
      worklog.caseId ?? worklog.id,
      {
        documentType: 'SIAP_WORKLOG_BUKTI',
        description: this.normalizeOptionalText(dto.description),
      },
      file,
      user,
      context,
    );

menjadi:

    const document = worklog.caseId
      ? await this.siarsipService.uploadDocument(
          worklog.caseId,
          {
            documentType: 'SIAP_WORKLOG_BUKTI',
            description: this.normalizeOptionalText(dto.description),
          },
          file,
          user,
          context,
        )
      : await this.siarsipService.uploadStandaloneDocument(
          worklog.id,
          'SIAP_WORKLOG_BUKTI',
          file,
          user,
          context,
        );
8. Update Controller Worklog
api/src/modules/siap-worklog/siap-worklog.controller.ts

Tambahkan import:

  Delete,
  UploadedFile,
  UseInterceptors,

dari @nestjs/common.

Tambahkan import multer:

import { FileInterceptor } from '@nestjs/platform-express';

Tambahkan DTO:

import { UploadWorklogAttachmentDto } from './dto/upload-worklog-attachment.dto';

Tambahkan endpoint berikut di dalam controller:

  @Get(':id/attachments')
  async findAttachments(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.worklogService.findAttachments(id, user);
    return ok(result);
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Param('id') id: string,
    @Body() dto: UploadWorklogAttachmentDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.worklogService.uploadAttachment(
      id,
      dto,
      file,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Bukti dukung berhasil diunggah');
  }

  @Delete(':id/attachments/:attachmentId')
  async deleteAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.worklogService.deleteAttachment(
      id,
      attachmentId,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Bukti dukung berhasil dihapus');
  }
9. Update Module Worklog
api/src/modules/siap-worklog/siap-worklog.module.ts

Tambahkan import:

import { SiarsipModule } from '../siarsip/siarsip.module';

Lalu tambahkan ke imports:

SiarsipModule,

Final imports:

imports: [AuthModule, PrismaModule, EventsModule, AuditModule, SiarsipModule],
B. Frontend Phase 10E
1. Tambahkan type
apps/web/src/lib/api/types.ts

Tambahkan:

export type SiapWorklogAttachment = {
  id: string;
  worklogId: string;
  documentId: string;
  label: string | null;
  description: string | null;
  createdAt: string;
  createdBy: string | null;
  document: DocumentRecord;
};

Tambahkan field di type SiapWorklog:

  attachments?: SiapWorklogAttachment[];
2. Tambahkan attachment section ke halaman Buku Kerja Saya
apps/web/src/pages/workspace/siap-worklogs-page.tsx

Tambahkan import icon:

import { Download, Paperclip, Trash2, Upload } from 'lucide-react';

Tambahkan type import:

  SiapWorklogAttachment,

Tambahkan state:

  const [attachmentTarget, setAttachmentTarget] = useState<SiapWorklog | null>(null);
  const [attachments, setAttachments] = useState<SiapWorklogAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [attachmentLabel, setAttachmentLabel] = useState('');
  const [attachmentDescription, setAttachmentDescription] = useState('');

Tambahkan functions:

  async function openAttachments(item: SiapWorklog) {
    setAttachmentTarget(item);
    setAttachmentLabel('');
    setAttachmentDescription('');
    await loadAttachments(item.id);
  }

  async function loadAttachments(worklogId: string) {
    setError('');

    try {
      const result = await apiClient.get<SiapWorklogAttachment[]>(
        `/siap/worklogs/${worklogId}/attachments`,
      );

      setAttachments(result);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat bukti dukung',
      );
    }
  }

  async function uploadAttachment(file: File) {
    if (!attachmentTarget) {
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('label', attachmentLabel || file.name);
      formData.append('description', attachmentDescription);

      await apiClient.upload<SiapWorklogAttachment>(
        `/siap/worklogs/${attachmentTarget.id}/attachments`,
        formData,
      );

      setAttachmentLabel('');
      setAttachmentDescription('');
      await loadAttachments(attachmentTarget.id);
      await load();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal upload bukti dukung',
      );
    } finally {
      setUploading(false);
    }
  }

  async function deleteAttachment(attachmentId: string) {
    if (!attachmentTarget) {
      return;
    }

    setError('');

    try {
      await apiClient.delete(
        `/siap/worklogs/${attachmentTarget.id}/attachments/${attachmentId}`,
      );

      await loadAttachments(attachmentTarget.id);
      await load();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal menghapus bukti dukung',
      );
    }
  }

  async function downloadAttachment(item: SiapWorklogAttachment) {
    await apiClient.download(
      `/siarsip/documents/${item.documentId}/download`,
      item.document.originalFileName ?? item.document.fileName,
    );
  }

Kalau apiClient.delete() belum ada, tambahkan di client.ts. Kalau belum ada upload() dan download(), Anda sudah punya dari phase sebelumnya. Bila delete belum ada, tambahkan method:

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, {
      method: 'DELETE',
    });
  }

Tambahkan tombol attachment di kolom aksi:

<ActionButton
  icon={Paperclip}
  onClick={() => void openAttachments(item)}
  variant="secondary"
>
  Bukti
</ActionButton>

Tambahkan panel attachment sebelum section daftar buku kerja:

{attachmentTarget ? (
  <SectionCard
    title="Bukti Dukung Buku Kerja"
    description={attachmentTarget.title}
    actions={
      <ActionButton
        icon={X}
        onClick={() => {
          setAttachmentTarget(null);
          setAttachments([]);
        }}
        variant="secondary"
      >
        Tutup
      </ActionButton>
    }
  >
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Label Bukti">
          <input
            className={inputClass}
            value={attachmentLabel}
            onChange={(event) => setAttachmentLabel(event.target.value)}
            placeholder="Contoh: Rekap verifikasi berkas"
          />
        </Field>

        <Field label="Deskripsi">
          <input
            className={inputClass}
            value={attachmentDescription}
            onChange={(event) => setAttachmentDescription(event.target.value)}
            placeholder="Keterangan singkat bukti dukung"
          />
        </Field>
      </div>

      <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50">
        <Upload className="size-4" />
        {uploading ? 'Mengunggah...' : 'Upload Bukti PDF/JPG/PNG'}
        <input
          className="sr-only"
          disabled={uploading}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void uploadAttachment(file);
            }
            event.currentTarget.value = '';
          }}
        />
      </label>

      <DataTable
        items={attachments}
        rowKey={(item) => item.id}
        empty="Belum ada bukti dukung"
        columns={[
          {
            key: 'name',
            header: 'Bukti',
            render: (item) => (
              <div>
                <div className="font-semibold text-zinc-950">
                  {item.label ?? item.document.originalFileName ?? item.document.fileName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.document.mimeType ?? '-'} · {formatFileSize(item.document.fileSize)}
                </div>
                {item.description ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                ) : null}
              </div>
            ),
          },
          {
            key: 'date',
            header: 'Tanggal',
            render: (item) => formatDateTime(item.createdAt),
          },
          {
            key: 'actions',
            header: 'Aksi',
            render: (item) => (
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  icon={Download}
                  onClick={() => void downloadAttachment(item)}
                  variant="secondary"
                >
                  Download
                </ActionButton>
                <ActionButton
                  icon={Trash2}
                  onClick={() => void deleteAttachment(item.id)}
                  variant="danger"
                >
                  Hapus
                </ActionButton>
              </div>
            ),
          },
        ]}
      />
    </div>
  </SectionCard>
) : null}

Pastikan import formatFileSize dan formatDateTime dari ui.tsx:

  formatDateTime,
  formatFileSize,
3. Tambahkan viewer di halaman Review Buku Kerja
apps/web/src/pages/workspace/siap-worklog-team-page.tsx

Tambahkan tombol di kolom aksi:

<ActionButton
  icon={Paperclip}
  onClick={() => void openAttachments(item)}
  variant="secondary"
>
  Bukti
</ActionButton>