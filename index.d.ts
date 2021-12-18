declare module 'mongoose-nanoid'

import { Schema } from 'mongoose'

export default function nanoidPlugin(schema: Schema, length?: number): void
