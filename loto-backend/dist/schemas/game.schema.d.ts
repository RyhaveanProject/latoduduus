import { Document } from 'mongoose';
export type GameDocument = Game & Document;
export declare class Game {
    _id: string;
    roomId: string;
    drawNumbers: number[];
    stage1Winners: string[];
    stage2Winners: string[];
    stage3Winners: string[];
    status: string;
    stage1Prize?: number;
    stage2Prize?: number;
    stage3Prize?: number;
    totalPool: number;
    startedAt: Date;
    completedAt?: Date;
}
export declare const GameSchema: import("mongoose").Schema<Game, import("mongoose").Model<Game, any, any, any, Document<unknown, any, Game> & Game & Required<{
    _id: string;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Game, Document<unknown, {}, import("mongoose").FlatRecord<Game>> & import("mongoose").FlatRecord<Game> & Required<{
    _id: string;
}>>;
//# sourceMappingURL=game.schema.d.ts.map