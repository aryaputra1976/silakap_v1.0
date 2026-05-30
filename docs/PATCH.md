  async function mutateTask(
    id: string,
    action: 'start' | 'complete' | 'return',
    note?: string,
  ) {
    setWorkingId(id);
    setError('');

    try {
      if (action === 'start') {
        await apiClient.post(`/siap/tasks/${id}/start`);
      } else if (action === 'complete') {
        const finalNote = note?.trim() || 'Verifikasi selesai dan diteruskan';
        await apiClient.post(`/siap/tasks/${id}/complete`, { note: finalNote });
      } else if (action === 'return') {
        await apiClient.post(`/siap/tasks/${id}/return`, {
          reason: note?.trim() || '',
          targetRole: 'OPD_OPERATOR',
        });
      }

      await load();

      if (verifyModalOpen && selectedTask?.id === id) {
        await loadVerificationDetail(id);
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Aksi tugas gagal');
    } finally {
      setWorkingId('');
    }
  }