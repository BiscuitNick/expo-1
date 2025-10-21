/**
 * Date utility functions for formatting timestamps in the messaging app
 */

/**
 * Get relative time string (e.g., "2m ago", "1h ago", "Just now")
 * Used for recent messages and last seen timestamps
 */
export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Just now (0-30 seconds)
  if (diffInSeconds < 30) {
    return 'Just now';
  }

  // Seconds ago (30-59 seconds)
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }

  // Minutes ago (1-59 minutes)
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  // Hours ago (1-23 hours)
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  // Days ago (1-6 days)
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  // Weeks ago (1-3 weeks)
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  // For older messages, return absolute date
  return formatAbsoluteDate(date);
};

/**
 * Get short time format (e.g., "2:30 PM")
 * Used for message timestamps within conversations
 */
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Get absolute date format (e.g., "Jan 15, 2024")
 * Used for older messages
 */
export const formatAbsoluteDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Get date with time (e.g., "Jan 15, 2:30 PM")
 * Used for detailed timestamps
 */
export const formatDateWithTime = (date: Date): string => {
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const timeStr = formatTime(date);
  return `${dateStr}, ${timeStr}`;
};

/**
 * Get smart timestamp for message bubbles
 * - "Just now" for very recent messages (< 30s)
 * - "2:30 PM" for messages today
 * - "Yesterday, 2:30 PM" for messages yesterday
 * - "Mon, 2:30 PM" for messages this week
 * - "Jan 15, 2:30 PM" for older messages this year
 * - "Jan 15, 2024, 2:30 PM" for messages from previous years
 */
export const formatMessageTimestamp = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Just now (< 30 seconds)
  if (diffInSeconds < 30) {
    return 'Just now';
  }

  // Same day - just show time
  if (isSameDay(date, now)) {
    return formatTime(date);
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return `Yesterday, ${formatTime(date)}`;
  }

  // This week (last 7 days) - show day name
  const diffInDays = Math.floor(diffInSeconds / (24 * 60 * 60));
  if (diffInDays < 7) {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `${dayName}, ${formatTime(date)}`;
  }

  // This year - show month and day
  if (date.getFullYear() === now.getFullYear()) {
    return formatDateWithTime(date);
  }

  // Previous years - show full date
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = formatTime(date);
  return `${dateStr}, ${timeStr}`;
};

/**
 * Get smart timestamp for conversation list (last message)
 * - "Just now" for very recent (< 30s)
 * - "2m ago" for recent (< 1 hour)
 * - "2:30 PM" for today
 * - "Yesterday" for yesterday
 * - "Monday" for this week
 * - "Jan 15" for this year
 * - "Jan 15, 2024" for previous years
 */
export const formatConversationTimestamp = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Just now (< 30 seconds)
  if (diffInSeconds < 30) {
    return 'Just now';
  }

  // Recent (< 1 hour) - show relative time
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }

  // Same day - show time
  if (isSameDay(date, now)) {
    return formatTime(date);
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  }

  // This week (last 7 days) - show day name
  const diffInDays = Math.floor(diffInSeconds / (24 * 60 * 60));
  if (diffInDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  // This year - show month and day
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  // Previous years - show full date
  return formatAbsoluteDate(date);
};

/**
 * Get date separator text for grouping messages
 * - "Today" for today
 * - "Yesterday" for yesterday
 * - "Monday, January 15" for this week
 * - "January 15" for this year
 * - "January 15, 2024" for previous years
 */
export const formatDateSeparator = (date: Date): string => {
  const now = new Date();

  // Today
  if (isSameDay(date, now)) {
    return 'Today';
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  }

  // This week - show day and date
  const diffInDays = getDaysDifference(date, now);
  if (diffInDays < 7) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  // This year - show month and day
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    });
  }

  // Previous years - show full date
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Check if two dates are on the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Get the number of days between two dates
 */
export const getDaysDifference = (date1: Date, date2: Date): number => {
  const diffInMilliseconds = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
};

/**
 * Check if a date needs a date separator in message list
 * Returns true if the message is the first of a new day
 */
export const shouldShowDateSeparator = (
  currentMessage: Date,
  previousMessage: Date | null
): boolean => {
  if (!previousMessage) {
    return true; // Always show separator for first message
  }

  return !isSameDay(currentMessage, previousMessage);
};

/**
 * Group messages by date
 * Returns an array of date strings that should have separators
 */
export const getMessageDateGroups = (messages: { timestamp: Date }[]): Date[] => {
  const dateGroups: Date[] = [];
  let lastDate: Date | null = null;

  messages.forEach((message) => {
    if (!lastDate || !isSameDay(message.timestamp, lastDate)) {
      dateGroups.push(message.timestamp);
      lastDate = message.timestamp;
    }
  });

  return dateGroups;
};

/**
 * Format typing indicator timestamp
 * Shows how long someone has been typing
 */
export const formatTypingDuration = (startTime: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);

  if (diffInSeconds < 5) {
    return 'typing...';
  }

  if (diffInSeconds < 60) {
    return 'typing...';
  }

  // If someone has been "typing" for more than a minute, they probably stopped
  return 'was typing';
};

/**
 * Format last seen timestamp
 * Used for user online status
 */
export const formatLastSeen = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Very recent (< 30 seconds) - consider as "online"
  if (diffInSeconds < 30) {
    return 'Active now';
  }

  // Recent (< 5 minutes)
  if (diffInSeconds < 300) {
    return 'Active recently';
  }

  // Show relative time for recent activity
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `Active ${minutes}m ago`;
  }

  // Hours ago
  const diffInHours = Math.floor(diffInSeconds / 3600);
  if (diffInHours < 24) {
    return `Active ${diffInHours}h ago`;
  }

  // Days ago
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Active ${diffInDays}d ago`;
  }

  // For longer periods, just say "Active a while ago"
  return 'Active a while ago';
};
