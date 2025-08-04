import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { insertUserSchema, insertPostSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

interface AuthenticatedRequest extends Express.Request {
  user?: any;
}

// Middleware to verify JWT token
const authenticateToken = (req: AuthenticatedRequest, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const connectedClients = new Map<string, WebSocket>();

  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      ws.close(1008, 'Token required');
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const userId = decoded.id;
      connectedClients.set(userId, ws);
      
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'chat_message') {
            // Save message to storage
            const savedMessage = await storage.createMessage({
              senderId: userId,
              receiverId: message.receiverId,
              content: message.content,
              gemCost: 1,
            });

            // Forward message to recipient if online
            const recipientWs = connectedClients.get(message.receiverId);
            if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
              recipientWs.send(JSON.stringify({
                type: 'new_message',
                message: savedMessage,
              }));
            }

            // Also check for assigned workers and forward message
            const sender = await storage.getUser(userId);
            const recipient = await storage.getUser(message.receiverId);
            
            if (sender?.role === 'fan' && recipient?.role === 'model') {
              // Find workers assigned to this model
              const workers = await storage.getUsersByRole('worker');
              for (const worker of workers) {
                const assignments = await storage.getWorkerAssignments(worker.id);
                if (assignments.some(model => model.id === message.receiverId)) {
                  const workerWs = connectedClients.get(worker.id);
                  if (workerWs && workerWs.readyState === WebSocket.OPEN) {
                    workerWs.send(JSON.stringify({
                      type: 'new_message',
                      message: savedMessage,
                    }));
                  }
                }
              }
            }

            // Send confirmation back to sender
            ws.send(JSON.stringify({
              type: 'message_sent',
              message: savedMessage,
            }));
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        connectedClients.delete(userId);
      });
    } catch (error) {
      ws.close(1008, 'Invalid token');
    }
  });

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = await storage.createUser(userData);
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
      
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      res.status(400).json({ message: 'Invalid user data', error });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      res.status(500).json({ message: 'Login failed', error });
    }
  });

  // User routes
  app.get('/api/users/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user', error });
    }
  });

  app.put('/api/users/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const updates = req.body;
      delete updates.password; // Don't allow password updates through this endpoint
      
      const user = await storage.updateUser(req.user.id, updates);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user', error });
    }
  });

  app.get('/api/users/models', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const models = await storage.getUsersByRole('model');
      const modelsWithoutPasswords = models.map(({ password, ...model }) => model);
      res.json(modelsWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get models', error });
    }
  });

  // Post routes
  app.post('/api/posts', authenticateToken, upload.array('media', 5), async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user.role !== 'model') {
        return res.status(403).json({ message: 'Only models can create posts' });
      }

      const postData = insertPostSchema.parse({
        ...req.body,
        modelId: req.user.id,
        isPremium: req.body.isPremium === 'true',
        gemCost: parseInt(req.body.gemCost) || 0,
      });

      // Handle uploaded files
      if (req.files) {
        const files = req.files as Express.Multer.File[];
        postData.media = files.map(file => `/uploads/${file.filename}`);
      }

      const post = await storage.createPost(postData);
      res.json(post);
    } catch (error) {
      res.status(400).json({ message: 'Failed to create post', error });
    }
  });

  app.get('/api/posts/feed', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user.role !== 'fan') {
        return res.status(403).json({ message: 'Only fans can access feed' });
      }

      const posts = await storage.getFeedPosts(req.user.id);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get feed', error });
    }
  });

  app.get('/api/posts/model/:modelId', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const posts = await storage.getPostsByModel(req.params.modelId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get posts', error });
    }
  });

  app.post('/api/posts/:postId/like', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const success = await storage.likePost(req.user.id, req.params.postId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: 'Failed to like post', error });
    }
  });

  app.delete('/api/posts/:postId/like', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const success = await storage.unlikePost(req.user.id, req.params.postId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: 'Failed to unlike post', error });
    }
  });

  app.post('/api/posts/:postId/save', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const success = await storage.savePost(req.user.id, req.params.postId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: 'Failed to save post', error });
    }
  });

  app.delete('/api/posts/:postId/save', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const success = await storage.unsavePost(req.user.id, req.params.postId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: 'Failed to unsave post', error });
    }
  });

  // Follow routes
  app.post('/api/follow/:modelId', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user.role !== 'fan') {
        return res.status(403).json({ message: 'Only fans can follow models' });
      }

      const success = await storage.followModel(req.user.id, req.params.modelId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: 'Failed to follow model', error });
    }
  });

  app.delete('/api/follow/:modelId', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const success = await storage.unfollowModel(req.user.id, req.params.modelId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: 'Failed to unfollow model', error });
    }
  });

  app.get('/api/following', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const models = await storage.getFollowedModels(req.user.id);
      const modelsWithoutPasswords = models.map(({ password, ...model }) => model);
      res.json(modelsWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get followed models', error });
    }
  });

  // Message routes
  app.get('/api/messages/:userId', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const messages = await storage.getMessages(req.user.id, req.params.userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get messages', error });
    }
  });

  app.post('/api/messages', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id,
      });

      // Check if fan has enough gems
      if (req.user.role === 'fan') {
        const user = await storage.getUser(req.user.id);
        if (!user || user.gems < messageData.gemCost) {
          return res.status(400).json({ message: 'Insufficient gems' });
        }

        // Deduct gems
        await storage.createGemTransaction({
          userId: req.user.id,
          amount: messageData.gemCost,
          type: 'spend',
          description: 'Message sent',
        });
      }

      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      res.status(400).json({ message: 'Failed to send message', error });
    }
  });

  // Gem routes
  app.post('/api/gems/purchase', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { amount, packageType } = req.body;
      
      // Mock payment processing
      const transaction = await storage.createGemTransaction({
        userId: req.user.id,
        amount: parseInt(amount),
        type: 'purchase',
        description: `Purchased ${packageType} package`,
      });
      
      res.json({ success: true, transaction });
    } catch (error) {
      res.status(500).json({ message: 'Failed to purchase gems', error });
    }
  });

  app.get('/api/gems/history', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const history = await storage.getUserGemHistory(req.user.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get gem history', error });
    }
  });

  // Worker routes
  app.get('/api/worker/assignments', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user.role !== 'worker') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const models = await storage.getWorkerAssignments(req.user.id);
      const modelsWithoutPasswords = models.map(({ password, ...model }) => model);
      res.json(modelsWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get assignments', error });
    }
  });

  app.get('/api/worker/conversations', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user.role !== 'worker') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const conversations = await storage.getWorkerConversations(req.user.id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get conversations', error });
    }
  });

  // Admin routes
  app.post('/api/admin/assign-worker', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { workerId, modelId } = req.body;
      const assignment = await storage.assignWorkerToModel(workerId, modelId);
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to assign worker', error });
    }
  });

  app.get('/api/admin/users', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { role } = req.query;
      const users = role ? await storage.getUsersByRole(role as string) : 
                          [...await storage.getUsersByRole('fan'), 
                           ...await storage.getUsersByRole('model'), 
                           ...await storage.getUsersByRole('worker')];
      
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get users', error });
    }
  });

  // Database seeding API - only works if database is empty
  app.post('/api/admin/seed-database', async (req, res) => {
    try {
      // Check if there are already users in the database
      const existingUsers = await storage.getUsersByRole('admin');
      if (existingUsers.length > 0) {
        return res.status(400).json({ message: 'Database already contains data. Seeding is only allowed on empty database.' });
      }

      // Create sample data
      const sampleData = {
        admin: {
          username: 'admin',
          email: 'admin@fanconnect.com',
          password: 'admin123',
          role: 'admin' as const,
          bio: 'System Administrator'
        },
        workers: [
          {
            username: 'worker1',
            email: 'worker1@fanconnect.com',
            password: 'worker123',
            role: 'worker' as const,
            bio: 'Customer support specialist'
          },
          {
            username: 'worker2',
            email: 'worker2@fanconnect.com',
            password: 'worker123',
            role: 'worker' as const,
            bio: 'Content moderator'
          },
          {
            username: 'worker3',
            email: 'worker3@fanconnect.com',
            password: 'worker123',
            role: 'worker' as const,
            bio: 'Chat support agent'
          }
        ],
        models: [
          {
            username: 'bella_rose',
            email: 'bella@fanconnect.com',
            password: 'model123',
            role: 'model' as const,
            bio: 'Fashion and lifestyle content creator ✨'
          },
          {
            username: 'sofia_star',
            email: 'sofia@fanconnect.com',
            password: 'model123',
            role: 'model' as const,
            bio: 'Fitness enthusiast and wellness coach 💪'
          },
          {
            username: 'luna_night',
            email: 'luna@fanconnect.com',
            password: 'model123',
            role: 'model' as const,
            bio: 'Artist and creative soul 🎨'
          },
          {
            username: 'ruby_charm',
            email: 'ruby@fanconnect.com',
            password: 'model123',
            role: 'model' as const,
            bio: 'Travel blogger and photographer 📸'
          },
          {
            username: 'amber_glow',
            email: 'amber@fanconnect.com',
            password: 'model123',
            role: 'model' as const,
            bio: 'Music lover and dancer 🎵'
          }
        ],
        fans: [
          {
            username: 'fan_john',
            email: 'john@fanconnect.com',
            password: 'fan123',
            role: 'fan' as const,
            bio: 'Love following amazing creators!'
          },
          {
            username: 'fan_mike',
            email: 'mike@fanconnect.com',
            password: 'fan123',
            role: 'fan' as const,
            bio: 'Always here to support great content'
          },
          {
            username: 'fan_alex',
            email: 'alex@fanconnect.com',
            password: 'fan123',
            role: 'fan' as const,
            bio: 'Huge fan of creative content'
          }
        ]
      };

      // Create admin
      const admin = await storage.createUser(sampleData.admin);
      
      // Create workers
      const workers = [];
      for (const workerData of sampleData.workers) {
        const worker = await storage.createUser(workerData);
        workers.push(worker);
      }

      // Create models
      const models = [];
      for (const modelData of sampleData.models) {
        const model = await storage.createUser(modelData);
        models.push(model);
      }

      // Create fans
      const fans = [];
      for (const fanData of sampleData.fans) {
        const fan = await storage.createUser(fanData);
        fans.push(fan);
      }

      // Create sample posts for each model
      const samplePosts = [
        { title: 'Welcome to my world! ✨', content: 'So excited to share my journey with you all. This is just the beginning of something amazing!' },
        { title: 'Behind the scenes 📸', content: 'Here\'s a little peek into my daily routine. Can\'t wait to show you more exclusive content!' },
        { title: 'Premium content unlocked 💎', content: 'This exclusive post is just for my special supporters. Thank you for believing in me!', isPremium: true, gemCost: 10 },
        { title: 'Good morning sunshine ☀️', content: 'Starting the day with positive vibes. What are your plans for today?' },
        { title: 'Special announcement! 🎉', content: 'I have some exciting news to share with you all. Stay tuned for more updates!' }
      ];

      const createdPosts = [];
      for (const model of models) {
        // Create 2-3 posts per model
        const postsForModel = samplePosts.slice(0, Math.floor(Math.random() * 2) + 2);
        for (const postData of postsForModel) {
          const post = await storage.createPost({
            ...postData,
            modelId: model.id,
            isPremium: postData.isPremium || false,
            gemCost: postData.gemCost || null
          });
          createdPosts.push(post);
        }
      }

      res.json({
        message: 'Database seeded successfully!',
        created: {
          admin: 1,
          workers: workers.length,
          models: models.length,
          fans: fans.length,
          posts: createdPosts.length
        },
        credentials: {
          admin: { email: 'admin@fanconnect.com', password: 'admin123' },
          worker: { email: 'worker1@fanconnect.com', password: 'worker123' },
          model: { email: 'bella@fanconnect.com', password: 'model123' },
          fan: { email: 'john@fanconnect.com', password: 'fan123' }
        }
      });
    } catch (error) {
      console.error('Seeding error:', error);
      res.status(500).json({ message: 'Failed to seed database', error: error.message });
    }
  });

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    // In production, you'd want to serve these from a CDN or proper file server
    res.sendFile(path.resolve(`uploads/${req.path}`));
  });

  return httpServer;
}
