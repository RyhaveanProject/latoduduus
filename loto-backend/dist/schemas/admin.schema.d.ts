import { Document } from 'mongoose';
export type AdminDocument = Admin & Document;
export declare class Admin {
    _id: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    permissions: string[];
    isSuperAdmin: boolean;
    lastLoginAt?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const AdminSchema: import("mongoose").Schema<Admin, import("mongoose").Model<Admin, any, any, any, Document<unknown, any, Admin> & Admin & Required<{
    _id: string;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Admin, Document<unknown, {}, import("mongoose").FlatRecord<Admin>> & import("mongoose").FlatRecord<Admin> & Required<{
    _id: string;
}>>;
//# sourceMappingURL=admin.schema.d.ts.map