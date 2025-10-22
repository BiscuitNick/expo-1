import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatLastSeen } from '../utils/dateUtils';

export interface StatusIndicatorProps {
  isOnline: boolean;
  lastSeen?: Date;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  showDot?: boolean;
}

export default function StatusIndicator({
  isOnline,
  lastSeen,
  size = 'small',
  showText = false,
  showDot = true,
}: StatusIndicatorProps) {
  const dotSize = size === 'small' ? 8 : size === 'medium' ? 10 : 12;
  const fontSize = size === 'small' ? 12 : size === 'medium' ? 14 : 16;

  const getStatusText = () => {
    if (isOnline) {
      return 'Active now';
    }
    if (lastSeen) {
      return formatLastSeen(lastSeen);
    }
    return 'Offline';
  };

  return (
    <View style={styles.container}>
      {showDot && (
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
            },
            isOnline ? styles.onlineDot : styles.offlineDot,
          ]}
        />
      )}
      {showText && (
        <Text
          style={[
            styles.statusText,
            { fontSize },
            isOnline ? styles.onlineText : styles.offlineText,
          ]}
        >
          {getStatusText()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  onlineDot: {
    backgroundColor: '#4CAF50',
  },
  offlineDot: {
    backgroundColor: '#9E9E9E',
  },
  statusText: {
    fontWeight: '500',
  },
  onlineText: {
    color: '#4CAF50',
  },
  offlineText: {
    color: '#666',
  },
});
