import mitt, { type Emitter } from 'mitt';
import type { AppEvent } from '@/types';

type Events = AppEvent & Record<string, unknown>;

export const eventBus: Emitter<Events> = mitt<Events>();
