import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createUuid(): string {
  return crypto?.randomUUID?.call(crypto) ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
