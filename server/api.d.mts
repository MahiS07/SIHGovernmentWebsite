import type { Plugin } from 'vite'

export function localApiPlugin(): Plugin
export function handleApi(req: unknown, res: unknown): Promise<boolean>
