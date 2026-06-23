export declare class CreateGameDto {
    roomId: string;
    entryFee: number;
    maxPlayers: number;
}
export declare class GenerateCardDto {
    gameId: string;
    userId: string;
}
export declare class DrawNumberDto {
    gameId: string;
    number: number;
}
export declare class CheckWinnerDto {
    gameId: string;
    ticketId: string;
    stage: string;
}
export declare class GameCard {
    row: number;
    numbers: number[];
}
export declare class LottoCard {
    card: GameCard[];
}
export declare class GameTicket {
    id: string;
    userId: string;
    gameId: string;
    roomId: string;
    card: GameCard[];
    markedNumbers: number[];
    stage1Completed: boolean;
    stage2Completed: boolean;
    stage3Completed: boolean;
}
export declare class GameStateDto {
    id: string;
    roomId: string;
    status: string;
    drawNumbers: number[];
    stage1Winners: string[];
    stage2Winners: string[];
    stage3Winners: string[];
    totalPool: number;
    stage1Prize?: number;
    stage2Prize?: number;
    stage3Prize?: number;
}
//# sourceMappingURL=game.dto.d.ts.map