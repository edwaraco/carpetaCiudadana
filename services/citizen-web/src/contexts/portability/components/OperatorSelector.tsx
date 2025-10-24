/**
 * Operator Selector Component
 * Displays available operators for portability
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Radio,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { CheckCircle as ActiveIcon } from '@mui/icons-material';
import { useOperators } from '../hooks';

interface OperatorSelectorProps {
  onSelectOperator: (operatorId: string) => void;
  selectedOperatorId?: string;
}

export const OperatorSelector: React.FC<OperatorSelectorProps> = ({
  onSelectOperator,
  selectedOperatorId,
}) => {
  const { operators, isLoading, error } = useOperators();
  const [selected, setSelected] = useState<string>(selectedOperatorId || '');

  const handleSelect = (operatorId: string) => {
    setSelected(operatorId);
    onSelectOperator(operatorId);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (operators.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No operators available for portability at this time
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Destination Operator
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Choose the operator you want to transfer your documents to
      </Typography>

      <Grid container spacing={3}>
        {operators.map((operator) => (
          <Grid item xs={12} md={6} key={operator.operatorId}>
            <Card
              sx={{
                border: selected === operator.operatorId ? 2 : 1,
                borderColor: selected === operator.operatorId ? 'primary.main' : 'divider',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: 2,
                },
              }}
              onClick={() => handleSelect(operator.operatorId)}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Radio checked={selected === operator.operatorId} />
                    <Typography variant="h6">{operator.operatorName}</Typography>
                  </Box>
                  {operator.active && (
                    <Chip
                      label="Active"
                      size="small"
                      color="success"
                      icon={<ActiveIcon />}
                    />
                  )}
                </Box>

                {operator.description && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {operator.description}
                  </Typography>
                )}

                <Typography variant="caption" color="text.secondary">
                  API: {operator.transferAPIURL}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

