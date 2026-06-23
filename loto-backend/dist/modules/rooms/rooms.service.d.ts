import { Model } from 'mongoose';
import { RoomDocument } from '../../schemas/room.schema';
import { CreateRoomDto, JoinRoomDto, UpdateRoomDto, SendMessageDto, RoomDto, RoomListDto } from '../../dtos/room.dto';
export declare class RoomsService {
    private roomModel;
    constructor(roomModel: Model<RoomDocument>);
    createRoom(createRoomDto: CreateRoomDto, ownerId: string): Promise<RoomDto>;
    joinRoom(joinRoomDto: JoinRoomDto, userId: string): Promise<RoomDto>;
    leaveRoom(roomId: string, userId: string): Promise<void>;
    addSpectator(roomId: string, userId: string): Promise<RoomDto>;
    sendMessage(roomId: string, sendMessageDto: SendMessageDto, userId: string): Promise<RoomDto>;
    getRoomsList(page?: number, limit?: number, visibility?: string): Promise<RoomListDto>;
    getRoomById(roomId: string): Promise<RoomDto>;
    updateRoom(roomId: string, updateRoomDto: UpdateRoomDto, userId: string): Promise<RoomDto>;
    getPublicRooms(page?: number, limit?: number): Promise<RoomListDto>;
    calculatePrizePool(roomId: string): Promise<number>;
    private mapRoomToDto;
}
//# sourceMappingURL=rooms.service.d.ts.map