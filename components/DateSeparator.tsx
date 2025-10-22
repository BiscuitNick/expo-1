import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatDateSeparator } from '../utils/dateUtils';

interface DateSeparatorProps {
  date: Date;
}

export default function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>{formatDateSeparator(date)}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    marginHorizontal: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
