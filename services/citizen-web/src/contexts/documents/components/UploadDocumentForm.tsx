/**
 * Upload Document Form Component
 * Supports drag-and-drop file upload with metadata
 */

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  AttachFile as FileIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useUploadDocument } from '@/contexts/documents/hooks';
import { DocumentMetadata, DocumentType, DocumentContext } from '@/contexts/documents/domain/types';

interface UploadDocumentFormProps {
  onSuccess?: (documentId: string) => void;
  onCancel?: () => void;
}

interface FormData {
  title: string;
  type: DocumentType;
  context: DocumentContext;
  issueDate?: Date;
  issuingEntity?: string;
}

export const UploadDocumentForm: React.FC<UploadDocumentFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation('documents');
  const { uploadDocument, isLoading, error, data } = useUploadDocument();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title: '',
      type: 'OTHER',
      context: 'OTHER',
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFormSubmit = async (formData: FormData) => {
    if (!selectedFile) {
      return;
    }

    const metadata: DocumentMetadata = {
      title: formData.title,
      type: formData.type,
      context: formData.context,
      issueDate: formData.issueDate,
      issuingEntity: formData.issuingEntity,
    };

    try {
      await uploadDocument({
        file: selectedFile,
        metadata,
      });

      if (onSuccess && data) {
        onSuccess(data.documentId);
      }
    } catch (err) {
      // Error is already handled by the hook
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  if (data) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CheckIcon sx={{ fontSize: 64, color: 'success.main' }} />
          <Typography variant="h6">{t('upload.success')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('detail.fields.id')}: {data.documentId}
          </Typography>
          <Button variant="contained" onClick={() => onSuccess?.(data.documentId)}>
            {t('detail.actions.view')}
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {t('upload.title')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {/* File Upload Area */}
        <Paper
          variant="outlined"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            p: 4,
            mb: 3,
            textAlign: 'center',
            bgcolor: isDragging ? 'action.hover' : 'background.default',
            cursor: 'pointer',
            border: isDragging ? 2 : 1,
            borderColor: isDragging ? 'primary.main' : 'divider',
            borderStyle: 'dashed',
          }}
          onClick={handleBrowseClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
          />

          {selectedFile ? (
            <Box>
              <FileIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="body1" gutterBottom>
                {selectedFile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            </Box>
          ) : (
            <Box>
              <UploadIcon sx={{ fontSize: 48, color: 'action.active', mb: 1 }} />
              <Typography variant="body1" gutterBottom>
                {isDragging ? t('upload.dragDrop.active') : t('upload.dragDrop.inactive')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('upload.form.file.helperText')}
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Document Metadata */}
        <Box display="flex" flexDirection="column" gap={2}>
          <Controller
            name="title"
            control={control}
            rules={{ required: t('upload.form.title.required') }}
            render={({ field }) => (
              <TextField
                {...field}
                label={t('upload.form.title.label')}
                placeholder={t('upload.form.title.placeholder')}
                fullWidth
                required
                error={!!errors.title}
                helperText={errors.title?.message}
                data-testid="document-title-input"
              />
            )}
          />

          <Box display="flex" gap={2}>
            <Controller
              name="type"
              control={control}
              rules={{ required: t('upload.form.type.required') }}
              render={({ field }) => (
                <FormControl fullWidth required error={!!errors.type}>
                  <InputLabel id="document-type-label">{t('upload.form.type.label')}</InputLabel>
                  <Select
                    {...field}
                    labelId="document-type-label"
                    label={t('upload.form.type.label')}
                    data-testid="document-type-select"
                  >
                    <MenuItem value="CEDULA">{t('documentTypes.CEDULA')}</MenuItem>
                    <MenuItem value="DIPLOMA">{t('documentTypes.DIPLOMA')}</MenuItem>
                    <MenuItem value="GRADUATION_CERTIFICATE">{t('documentTypes.GRADUATION_CERTIFICATE')}</MenuItem>
                    <MenuItem value="MEDICAL_CERTIFICATE">{t('documentTypes.MEDICAL_CERTIFICATE')}</MenuItem>
                    <MenuItem value="DEED">{t('documentTypes.DEED')}</MenuItem>
                    <MenuItem value="TAX_RETURN">{t('documentTypes.TAX_RETURN')}</MenuItem>
                    <MenuItem value="PASSPORT">{t('documentTypes.PASSPORT')}</MenuItem>
                    <MenuItem value="BACKGROUND_CHECK">{t('documentTypes.BACKGROUND_CHECK')}</MenuItem>
                    <MenuItem value="OTHER">{t('documentTypes.OTHER')}</MenuItem>
                  </Select>
                </FormControl>
              )}
            />

            <Controller
              name="context"
              control={control}
              rules={{ required: t('upload.form.context.required') }}
              render={({ field }) => (
                <FormControl fullWidth required error={!!errors.context}>
                  <InputLabel id="context-label">{t('upload.form.context.label')}</InputLabel>
                  <Select
                    {...field}
                    labelId="context-label"
                    label={t('upload.form.context.label')}
                    data-testid="document-context-select"
                  >
                    <MenuItem value="EDUCATION">{t('documentContexts.EDUCATION')}</MenuItem>
                    <MenuItem value="HEALTH">{t('documentContexts.HEALTH')}</MenuItem>
                    <MenuItem value="NOTARY">{t('documentContexts.NOTARY')}</MenuItem>
                    <MenuItem value="CIVIL_REGISTRY">{t('documentContexts.CIVIL_REGISTRY')}</MenuItem>
                    <MenuItem value="TAXES">{t('documentContexts.TAXES')}</MenuItem>
                    <MenuItem value="EMPLOYMENT">{t('documentContexts.EMPLOYMENT')}</MenuItem>
                    <MenuItem value="IMMIGRATION">{t('documentContexts.IMMIGRATION')}</MenuItem>
                    <MenuItem value="OTHER">{t('documentContexts.OTHER')}</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Box>

          <Controller
            name="issueDate"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t('upload.form.issueDate.label')}
                type="date"
                fullWidth
                helperText={t('upload.form.issueDate.helperText')}
                error={!!errors.issueDate}
                InputLabelProps={{
                  shrink: true,
                }}
                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                data-testid="document-issue-date-input"
              />
            )}
          />

          <Controller
            name="issuingEntity"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t('upload.form.issuingEntity.label')}
                fullWidth
                helperText={t('upload.form.issuingEntity.helperText')}
                error={!!errors.issuingEntity}
                data-testid="document-issuing-entity-input"
              />
            )}
          />
        </Box>

        {/* Actions */}
        <Box display="flex" gap={2} mt={3}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={!selectedFile || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <UploadIcon />}
            data-testid="upload-submit-button"
          >
            {isLoading ? t('upload.actions.uploading') : t('upload.actions.upload')}
          </Button>
          {onCancel && (
            <Button
              variant="outlined"
              fullWidth
              onClick={onCancel}
              disabled={isLoading}
              data-testid="upload-cancel-button"
            >
              {t('upload.actions.cancel')}
            </Button>
          )}
        </Box>
      </form>
    </Paper>
  );
};

