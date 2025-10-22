/**
 * CitizenInfo Component
 * Displays citizen information
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import {
  Person,
  Email,
  Home,
  Business,
  CalendarToday,
  Badge,
} from '@mui/icons-material';
import { Citizen, CitizenStatus } from '../domain/types';
import { format } from 'date-fns';

interface CitizenInfoProps {
  citizen: Citizen;
  showSensitiveData?: boolean;
}

const getStatusColor = (status: CitizenStatus): 'success' | 'warning' | 'error' => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'IN_TRANSIT':
      return 'warning';
    case 'SUSPENDED':
      return 'error';
    default:
      return 'error';
  }
};

const getStatusLabel = (status: CitizenStatus): string => {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'IN_TRANSIT':
      return 'In Transit (Portability)';
    case 'SUSPENDED':
      return 'Suspended';
    default:
      return status;
  }
};

export const CitizenInfo: React.FC<CitizenInfoProps> = ({
  citizen,
  showSensitiveData = true,
}) => {
  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person />
            Citizen Information
          </Typography>
          <Chip
            label={getStatusLabel(citizen.status)}
            color={getStatusColor(citizen.status)}
            size="small"
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          {/* Full Name */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Badge color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Full Name
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {citizen.fullName}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Cedula */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Badge color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Cedula
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {showSensitiveData
                    ? citizen.cedula
                    : `****${citizen.cedula.slice(-4)}`}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Folder Email (Immutable) */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Email color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Folder Email (Permanent)
                </Typography>
                <Typography variant="body1" fontWeight="medium" color="primary">
                  {citizen.folderEmail}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontStyle="italic">
                  This email is immutable and permanent
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Personal Email */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Email color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Personal Email
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {citizen.personalEmail}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Address */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Home color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Address
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {citizen.address}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Current Operator */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Business color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Current Operator
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {citizen.currentOperator}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Registration Date */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarToday color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Registration Date
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {format(new Date(citizen.registrationDate), 'PPP')}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

