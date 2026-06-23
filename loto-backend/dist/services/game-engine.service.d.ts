export interface LottoCard {
    row: number;
    numbers: number[];
}
export interface GameTicket {
    id: string;
    userId: string;
    gameId: string;
    roomId: string;
    card: LottoCard[];
    markedNumbers: number[];
    stage1Completed: boolean;
    stage2Completed: boolean;
    stage3Completed: boolean;
    entryFee: number;
}
export declare class GameEngineService {
    /**
     * Generate a real Russian Lotto card (билет)
     * - 3 rows x 9 columns
     * - 5 numbers per row, 4 blank cells per row (15 numbers total)
     * - Column 1: 1-9, Columns 2-8: (col)*10 to (col)*10+9, Column 9: 80-90
     * - No number repeats anywhere on the card
     */
    generateCard(): LottoCard[];
    /**
     * Distribute 15 filled cells across 9 columns (1-3 per column).
     */
    private generateColumnFillCounts;
    /**
     * Assign which columns are filled in each row (5 per row),
     * respecting each column's total fill count.
     */
    private assignColumnsToRows;
    /**
     * Pick `count` unique random items from an array.
     */
    private pickRandomUnique;
    /**
     * Draw random numbers for the game
     * Returns array of 90 numbers shuffled
     */
    generateDrawSequence(): number[];
    /**
     * Shuffle array using Fisher-Yates algorithm
     */
    private shuffleArray;
    /**
     * Mark a number on the card
     */
    markNumber(ticket: GameTicket, drawnNumber: number): {
        marked: boolean;
        markedNumbers: number[];
    };
    /**
     * Check if first row is completed
     */
    isFirstRowCompleted(ticket: GameTicket): boolean;
    /**
     * Check if any row is completed
     */
    isAnyRowCompleted(ticket: GameTicket): boolean;
    /**
     * Check if full card is completed
     */
    isFullCardCompleted(ticket: GameTicket): boolean;
    /**
     * Get completion status of all rows
     */
    getRowStatus(ticket: GameTicket): boolean[];
    /**
     * Calculate prize distribution for multiple winners
     */
    distributePrizes(totalPool: number, winnerCounts: {
        stage1: number;
        stage2: number;
        stage3: number;
    }): {
        stage1Prize: number;
        stage2Prize: number;
        stage3Prize: number;
    };
    /**
     * Validate ticket structure
     */
    validateTicket(ticket: any): boolean;
    /**
     * Get card completion percentage
     */
    getCompletionPercentage(ticket: GameTicket): number;
}
//# sourceMappingURL=game-engine.service.d.ts.map