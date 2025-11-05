/**
 * Portability Page
 * Main page for operator portability management
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Box, Typography, Tabs, Tab } from '@mui/material';
import { InitiatePortabilityForm, PortabilityProgress } from '../contexts/portability/components';
import { usePortabilityStatus } from '../contexts/portability/hooks';

export const PortabilityPage: React.FC = () => {
  const { t } = useTranslation('common');
  const { portabilityStatus } = usePortabilityStatus();
  const [activeTab, setActiveTab] = useState(0);
  const [currentPortabilityId, setCurrentPortabilityId] = useState<string | null>(null);

  const hasOngoingPortability = portabilityStatus && !portabilityStatus.canInitiate;

  const handleTabChange = (_event: React.ChangeEvent<unknown>, newValue: number) => {
    setActiveTab(newValue);
  };

  const handlePortabilityInitiated = (portabilityId: string) => {
    setCurrentPortabilityId(portabilityId);
    setActiveTab(1); // Switch to progress tab
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('portabilityPage.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {t('portabilityPage.subtitle')}
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label={t('portabilityPage.tabs.initiate')} disabled={!!hasOngoingPortability} />
            <Tab label={t('portabilityPage.tabs.track')} disabled={!hasOngoingPortability && currentPortabilityId === null} />
          </Tabs>
        </Box>

        {activeTab === 0 && !hasOngoingPortability && (
          <InitiatePortabilityForm
            onSuccess={handlePortabilityInitiated}
            onCancel={() => console.log('Cancelled')}
          />
        )}

        {activeTab === 1 && (hasOngoingPortability || currentPortabilityId) && (
          <PortabilityProgress
            portabilityId={
              currentPortabilityId || portabilityStatus?.process?.portabilityId || ''
            }
            onCancel={() => {
              setCurrentPortabilityId(null);
              setActiveTab(0);
            }}
            onComplete={() => {
              console.log('Portability completed!');
            }}
          />
        )}
    </Container>
  );
};

