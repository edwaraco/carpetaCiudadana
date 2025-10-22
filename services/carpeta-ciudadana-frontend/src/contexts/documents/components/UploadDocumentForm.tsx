/**
 * Upload Document Form Component
 * Supports drag-and-drop file upload with metadata
 */

import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Paper,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  AttachFile as FileIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useUploadDocument } from '../hooks';
import { DocumentMetadata, DocumentType, DocumentContext } from '../domain/types';

interface UploadDocumentFormProps {
  onSuccess?: (documentId: string) => void;
  onCancel?: () => void;
}

interface FormData {
  title: string;
  type: DocumentType;
  context: DocumentContext;
  issueDate?: Date;
  expirationDate?: Date;
  tags: string;
  entidadEmisora?: string;
  isCertified: boolean;
}

export const UploadDocumentForm: React.FC<UploadDocumentFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { uploadDocument, isLoading, error, data } = useUploadDocument();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    defaultValues: {
      title: '',
      type: 'OTHER',
      context: 'OTHER',
      tags: '',
      isCertified: false,
    },
  });

  const isCertified = watch('isCertified');

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

    const tags = formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const metadata: DocumentMetadata = {
      title: formData.title,
      type: formData.type,
      context: formData.context,
      tags,
      issueDate: formData.issueDate,
      expirationDate: formData.expirationDate,
      entidadEmisora: formData.entidadEmisora,
    };

    try {
      await uploadDocument({
        file: selectedFile,
        metadata,
        isCertified: formData.isCertified,
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
          <Typography variant="h6">Document Uploaded Successfully!</Typography>
          <Typography variant="body2" color="text.secondary">
            Document ID: {data.documentId}
          </Typography>
          <Button variant="contained" onClick={() => onSuccess?.(data.documentId)}>
            View Document
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Upload Document
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
                Drag and drop your document here
              </Typography>
              <Typography variant="body2" color="text.secondary">
                or click to browse (PDF, JPEG, PNG - max 10MB)
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Document Metadata */}
        <Box display="flex" flexDirection="column" gap={2}>
          <Controller
            name="title"
            control={control}
            rules={{ required: 'Title is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Document Title"
                fullWidth
                required
                error={!!errors.title}
                helperText={errors.title?.message}
              />
            )}
          />

          <Box display="flex" gap={2}>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel id="document-type-label">Document Type</InputLabel>
                  <Select
                    {...field}
                    labelId="document-type-label"
                    id="document-type-select"
                    label="Document Type"
                  >
                    <MenuItem value="CEDULA">Cedula</MenuItem>
                    <MenuItem value="PASSPORT">Passport</MenuItem>
                    <MenuItem value="DIPLOMA">Diploma</MenuItem>
                    <MenuItem value="CERTIFICATE">Certificate</MenuItem>
                    <MenuItem value="LICENSE">License</MenuItem>
                    <MenuItem value="TAX_DOCUMENT">Tax Document</MenuItem>
                    <MenuItem value="MEDICAL_RECORD">Medical Record</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              )}
            />

            <Controller
              name="context"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel id="context-label">Context</InputLabel>
                  <Select
                    {...field}
                    labelId="context-label"
                    id="context-select"
                    label="Context"
                  >
                    <MenuItem value="CIVIL_REGISTRY">Civil Registry</MenuItem>
                    <MenuItem value="EDUCATION">Education</MenuItem>
                    <MenuItem value="HEALTH">Health</MenuItem>
                    <MenuItem value="TAX">Tax</MenuItem>
                    <MenuItem value="LABOR">Labor</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Box>

          {isCertified && (
            <Controller
              name="entidadEmisora"
              control={control}
              rules={{ required: isCertified ? 'Issuing entity is required for certified documents' : false }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Issuing Entity"
                  fullWidth
                  required={isCertified}
                  error={!!errors.entidadEmisora}
                  helperText={errors.entidadEmisora?.message}
                />
              )}
            />
          )}

          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Tags (comma-separated)"
                fullWidth
                helperText="e.g., important, education, 2024"
              />
            )}
          />

          <Controller
            name="isCertified"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Checkbox {...field} checked={field.value} />}
                label="This is a certified document (digitally signed by authority)"
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
          >
            {isLoading ? 'Uploading...' : 'Upload Document'}
          </Button>
          {onCancel && (
            <Button variant="outlined" fullWidth onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
        </Box>
      </form>
    </Paper>
  );
};

