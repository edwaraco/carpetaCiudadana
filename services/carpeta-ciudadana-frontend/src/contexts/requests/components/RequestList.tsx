/**
 * Request List Component
 * Displays list of document requests with filtering
 */

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Pagination,
  Tabs,
  Tab,
} from '@mui/material';
import { useRequests } from '../hooks';
import { RequestCard } from './RequestCard';

interface RequestListProps {
  onViewDetails?: (requestId: string) => void;
  onRespond?: (requestId: string) => void;
}

export const RequestList: React.FC<RequestListProps> = ({ onViewDetails, onRespond }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'completed'>('all');
  const { requests, isLoading, error, pagination, refetch } = useRequests(currentPage);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    refetch(page);
  };

  const handleTabChange = (_event: React.ChangeEvent<unknown>, newValue: 'all' | 'pending' | 'completed') => {
    setFilterTab(newValue);
  };

  const filterRequests = () => {
    switch (filterTab) {
      case 'pending':
        return requests.filter((req) =>
          ['CREATED', 'NOTIFIED', 'IN_PROCESS'].includes(req.requestStatus)
        );
      case 'completed':
        return requests.filter((req) =>
          ['COMPLETED', 'REJECTED', 'EXPIRED', 'CANCELLED'].includes(req.requestStatus)
        );
      default:
        return requests;
    }
  };

  const filteredRequests = filterRequests();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Document Requests</Typography>
      </Box>

      {/* Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={filterTab} onChange={handleTabChange}>
          <Tab label={`All (${requests.length})`} value="all" />
          <Tab
            label={`Pending (${requests.filter((r) => ['CREATED', 'NOTIFIED', 'IN_PROCESS'].includes(r.requestStatus)).length})`}
            value="pending"
          />
          <Tab
            label={`Completed (${requests.filter((r) => ['COMPLETED', 'REJECTED', 'EXPIRED', 'CANCELLED'].includes(r.requestStatus)).length})`}
            value="completed"
          />
        </Tabs>
      </Box>

      {filteredRequests.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No {filterTab !== 'all' ? filterTab : ''} requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filterTab === 'pending'
              ? 'You have no pending document requests'
              : filterTab === 'completed'
              ? 'You have no completed requests'
              : 'No document requests have been received'}
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredRequests.map((request) => (
              <Grid item xs={12} md={6} key={request.requestId}>
                <RequestCard
                  request={request}
                  onViewDetails={onViewDetails}
                  onRespond={onRespond}
                />
              </Grid>
            ))}
          </Grid>

          {pagination && pagination.totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={pagination.totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

