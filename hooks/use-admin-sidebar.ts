'use client';

import { useSyncExternalStore } from 'react';

// Locale navigation can remount the admin layout. Keep this document's choice.
let collapsed = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return collapsed;
}

function getServerSnapshot() {
  return false;
}

function toggle() {
  collapsed = !collapsed;
  listeners.forEach((listener) => listener());
}

export function useAdminSidebar() {
  return [
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot),
    toggle,
  ] as const;
}
