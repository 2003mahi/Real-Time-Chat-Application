import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertRoomSchema, insertMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Room routes
  app.get("/api/rooms", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRooms = await storage.getUserRooms(userId);
      res.json(userRooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.post("/api/rooms", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const roomData = insertRoomSchema.parse({
        ...req.body,
        createdBy: userId,
      });

      const room = await storage.createRoom(roomData);
      res.status(201).json(room);
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ message: "Failed to create room" });
    }
  });

  app.post("/api/rooms/:roomId/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const roomId = parseInt(req.params.roomId);

      if (isNaN(roomId)) {
        return res.status(400).json({ message: "Invalid room ID" });
      }

      const room = await storage.getRoomById(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      await storage.joinRoom(userId, roomId);
      res.json({ message: "Joined room successfully" });
    } catch (error) {
      console.error("Error joining room:", error);
      res.status(500).json({ message: "Failed to join room" });
    }
  });

  app.post("/api/rooms/:roomId/leave", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const roomId = parseInt(req.params.roomId);

      if (isNaN(roomId)) {
        return res.status(400).json({ message: "Invalid room ID" });
      }

      await storage.leaveRoom(userId, roomId);
      res.json({ message: "Left room successfully" });
    } catch (error) {
      console.error("Error leaving room:", error);
      res.status(500).json({ message: "Failed to leave room" });
    }
  });

  // Message routes
  app.get("/api/rooms/:roomId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const since = req.query.since ? new Date(req.query.since as string) : undefined;

      if (isNaN(roomId)) {
        return res.status(400).json({ message: "Invalid room ID" });
      }

      let messages;
      if (since) {
        messages = await storage.getLatestMessages(roomId, since);
      } else {
        messages = await storage.getMessages(roomId, limit, offset);
      }

      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/rooms/:roomId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const roomId = parseInt(req.params.roomId);

      if (isNaN(roomId)) {
        return res.status(400).json({ message: "Invalid room ID" });
      }

      const messageData = insertMessageSchema.parse({
        content: req.body.content,
        userId,
        roomId,
      });

      const message = await storage.createMessage(messageData);
      const messageWithUser = await storage.getMessages(roomId, 1);
      
      res.status(201).json(messageWithUser[0] || message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Room members route
  app.get("/api/rooms/:roomId/members", isAuthenticated, async (req: any, res) => {
    try {
      const roomId = parseInt(req.params.roomId);

      if (isNaN(roomId)) {
        return res.status(400).json({ message: "Invalid room ID" });
      }

      const members = await storage.getRoomMembers(roomId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching room members:", error);
      res.status(500).json({ message: "Failed to fetch room members" });
    }
  });

  // Get all available rooms (for discovery)
  app.get("/api/rooms/all", isAuthenticated, async (req: any, res) => {
    try {
      const allRooms = await storage.getRooms();
      res.json(allRooms);
    } catch (error) {
      console.error("Error fetching all rooms:", error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
