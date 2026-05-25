import React from 'react';
import { View, Text } from 'react-native';

interface DashboardScreenProps {
  onNavigateToSearch?: () => void;
}

export const DashboardScreen = ({ onNavigateToSearch }: DashboardScreenProps) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Dashboard Screen</Text>
    </View>
  );
};
