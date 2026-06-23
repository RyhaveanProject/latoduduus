import { RoomsService } from './rooms.service';
import { CreateRoomDto, JoinRoomDto, UpdateRoomDto, SendMessageDto, RoomDto, RoomListDto } from '../../dtos/room.dto';
export declare class RoomsController {
    private roomsService;
    constructor(roomsService: RoomsService);
    createRoom(createRoomDto: CreateRoomDto, userId: string): Promise<RoomDto>;
    joinRoom(joinRoomDto: JoinRoomDto, userId: string): Promise<RoomDto>;
    leaveRoom(roomId: string, userId: string): Promise<{
        message: string;
    }>;
    addSpectator(roomId: string, userId: string): Promise<RoomDto>;
    sendMessage(roomId: string, sendMessageDto: SendMessageDto, userId: string): Promise<RoomDto>;
    getRoomById(roomId: string): Promise<RoomDto>;
    updateRoom(roomId: string, updateRoomDto: UpdateRoomDto, userId: string): Promise<RoomDto>;
    listRooms(page?: number, limit?: number): Promise<RoomListDto>;
    getPublicRooms(page?: number, limit?: number): Promise<RoomListDto>;
    getPrizePool(roomId: string): Promise<{
        prizePool: number;
    }>;
}
//# sourceMappingURL=rooms.controller.d.ts.map