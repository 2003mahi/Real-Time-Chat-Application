import {
  users,
  rooms,
  messages,
  roomMembers,
  type User,
  type UpsertUser,
  type Room,
  type InsertRoom,
  type Message,
  type InsertMessage,
  type InsertRoomMember,
  type MessageWithUser,
  type RoomWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Room operations
  getRooms(): Promise<RoomWithDetails[]>;
  getRoomById(id: number): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  joinRoom(userId: string, roomId: number): Promise<void>;
  leaveRoom(userId: string, roomId: number): Promise<void>;
  getUserRooms(userId: string): Promise<Room[]>;
  
  // Message operations
  getMessages(roomId: number, limit?: number, offset?: number): Promise<MessageWithUser[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getLatestMessages(roomId: number, since?: Date): Promise<MessageWithUser[]>;
  
  // User presence
  getRoomMembers(roomId: number): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Room operations
  async getRooms(): Promise<RoomWithDetails[]> {
    const roomsWithDetails = await db
      .select({
        id: rooms.id,
        name: rooms.name,
        description: rooms.description,
        createdBy: rooms.createdBy,
        createdAt: rooms.createdAt,
        updatedAt: rooms.updatedAt,
        creator: users,
        memberCount: sql<number>`count(${roomMembers.id})`.as('memberCount'),
      })
      .from(rooms)
      .leftJoin(users, eq(rooms.createdBy, users.id))
      .leftJoin(roomMembers, eq(rooms.id, roomMembers.roomId))
      .groupBy(rooms.id, users.id);

    return roomsWithDetails.map(room => ({
      ...room,
      creator: room.creator || { id: '', email: null, firstName: null, lastName: null, profileImageUrl: null, createdAt: null, updatedAt: null }
    }));
  }

  async getRoomById(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const [newRoom] = await db.insert(rooms).values(room).returning();
    // Automatically add creator as member
    await this.joinRoom(room.createdBy, newRoom.id);
    return newRoom;
  }

  async joinRoom(userId: string, roomId: number): Promise<void> {
    await db.insert(roomMembers)
      .values({ userId, roomId })
      .onConflictDoNothing();
  }

  async leaveRoom(userId: string, roomId: number): Promise<void> {
    await db.delete(roomMembers)
      .where(and(
        eq(roomMembers.userId, userId),
        eq(roomMembers.roomId, roomId)
      ));
  }

  async getUserRooms(userId: string): Promise<Room[]> {
    const userRooms = await db
      .select({ room: rooms })
      .from(roomMembers)
      .innerJoin(rooms, eq(roomMembers.roomId, rooms.id))
      .where(eq(roomMembers.userId, userId));

    return userRooms.map(r => r.room);
  }

  // Message operations
  async getMessages(roomId: number, limit = 50, offset = 0): Promise<MessageWithUser[]> {
    const msgs = await db
      .select({
        message: messages,
        user: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.roomId, roomId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    return msgs.map(m => ({ ...m.message, user: m.user })).reverse();
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getLatestMessages(roomId: number, since?: Date): Promise<MessageWithUser[]> {
    let query = db
      .select({
        message: messages,
        user: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.roomId, roomId))
      .orderBy(desc(messages.createdAt));

    if (since) {
      query = db
        .select({
          message: messages,
          user: users,
        })
        .from(messages)
        .innerJoin(users, eq(messages.userId, users.id))
        .where(and(
          eq(messages.roomId, roomId),
          sql`${messages.createdAt} > ${since}`
        ))
        .orderBy(desc(messages.createdAt));
    }

    const msgs = await query.limit(50);
    return msgs.map(m => ({ ...m.message, user: m.user })).reverse();
  }

  async getRoomMembers(roomId: number): Promise<User[]> {
    const members = await db
      .select({ user: users })
      .from(roomMembers)
      .innerJoin(users, eq(roomMembers.userId, users.id))
      .where(eq(roomMembers.roomId, roomId));

    return members.map(m => m.user);
  }
}

export const storage = new DatabaseStorage();
