import React from 'react';
import { TabScreen } from '@/components/layout/TabScreen';
import { MissionBoard } from '@/components/MissionBoard';

export default function MissionsScreen() {
  return (
    <TabScreen>
      <MissionBoard />
    </TabScreen>
  );
}
