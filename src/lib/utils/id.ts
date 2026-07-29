import { nanoid } from 'nanoid';

export function uuid(): string {
  return nanoid(12);
}

export function uuidWithPrefix(prefix: string): string {
  return `${prefix}_${nanoid(10)}`;
}
