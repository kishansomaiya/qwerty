import { MongoClient, Db, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { User, Post, Message, GemTransaction, WorkerAssignment } from '@shared/schema';

const MONGODB_URI = 'mongodb+srv://kishansomaiya271:bC5TvwH1iz1wlTtb@cluster0.mydpp82.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

class Storage {
  private client: MongoClient;
  private db: Db;

  constructor() {
    this.client = new MongoClient(MONGODB_URI);
  }

  async init() {
    await this.client.connect();
    this.db = this.client.db('fanconnect');
    console.log('Connected to MongoDB');
  }

  // User methods
  async createUser(userData: any): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = {
      ...userData,
      password: hashedPassword,
      gems: userData.role === 'fan' ? 100 : 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.db.collection('users').insertOne(user);
    return { ...user, id: result.insertedId.toString() };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.db.collection('users').findOne({ email });
    if (!user) return null;
    return { ...user, id: user._id.toString() };
  }

  async getUser(id: string): Promise<User | null> {
    const user = await this.db.collection('users').findOne({ _id: new ObjectId(id) });
    if (!user) return null;
    return { ...user, id: user._id.toString() };
  }

  async updateUser(id: string, updates: any): Promise<User | null> {
    const result = await this.db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!result) return null;
    return { ...result, id: result._id.toString() };
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const users = await this.db.collection('users').find({ role }).toArray();
    return users.map(user => ({ ...user, id: user._id.toString() }));
  }

  // Post methods
  async createPost(postData: any): Promise<Post> {
    const post = {
      ...postData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.db.collection('posts').insertOne(post);
    return { ...post, id: result.insertedId.toString() };
  }

  async getFeedPosts(userId: string): Promise<Post[]> {
    const posts = await this.db.collection('posts').find({}).sort({ createdAt: -1 }).toArray();
    return posts.map(post => ({ ...post, id: post._id.toString() }));
  }

  async getPostsByModel(modelId: string): Promise<Post[]> {
    const posts = await this.db.collection('posts').find({ modelId }).sort({ createdAt: -1 }).toArray();
    return posts.map(post => ({ ...post, id: post._id.toString() }));
  }

  async likePost(userId: string, postId: string): Promise<boolean> {
    await this.db.collection('likes').insertOne({ userId, postId, createdAt: new Date() });
    return true;
  }

  async unlikePost(userId: string, postId: string): Promise<boolean> {
    await this.db.collection('likes').deleteOne({ userId, postId });
    return true;
  }

  async savePost(userId: string, postId: string): Promise<boolean> {
    await this.db.collection('saved_posts').insertOne({ userId, postId, createdAt: new Date() });
    return true;
  }

  async unsavePost(userId: string, postId: string): Promise<boolean> {
    await this.db.collection('saved_posts').deleteOne({ userId, postId });
    return true;
  }

  // Follow methods
  async followModel(fanId: string, modelId: string): Promise<boolean> {
    await this.db.collection('follows').insertOne({ fanId, modelId, createdAt: new Date() });
    return true;
  }

  async unfollowModel(fanId: string, modelId: string): Promise<boolean> {
    await this.db.collection('follows').deleteOne({ fanId, modelId });
    return true;
  }

  async getFollowedModels(fanId: string): Promise<User[]> {
    const follows = await this.db.collection('follows').find({ fanId }).toArray();
    const modelIds = follows.map(f => new ObjectId(f.modelId));
    const models = await this.db.collection('users').find({ _id: { $in: modelIds } }).toArray();
    return models.map(model => ({ ...model, id: model._id.toString() }));
  }

  // Message methods
  async createMessage(messageData: any): Promise<Message> {
    const message = {
      ...messageData,
      createdAt: new Date()
    };

    const result = await this.db.collection('messages').insertOne(message);

    // Deduct gems if fan is sending message
    if (messageData.senderId) {
      const sender = await this.getUser(messageData.senderId);
      if (sender?.role === 'fan') {
        await this.db.collection('users').updateOne(
          { _id: new ObjectId(messageData.senderId) },
          { $inc: { gems: -1 } }
        );
      }
    }

    return { ...message, id: result.insertedId.toString() };
  }

  async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    const messages = await this.db.collection('messages').find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    }).sort({ createdAt: 1 }).toArray();

    return messages.map(msg => ({ ...msg, id: msg._id.toString() }));
  }

  // Gem methods
  async createGemTransaction(transactionData: any): Promise<GemTransaction> {
    const transaction = {
      ...transactionData,
      createdAt: new Date()
    };

    const result = await this.db.collection('gem_transactions').insertOne(transaction);

    // Update user gems
    await this.db.collection('users').updateOne(
      { _id: new ObjectId(transactionData.userId) },
      { $inc: { gems: transactionData.type === 'purchase' ? transactionData.amount : -transactionData.amount } }
    );

    return { ...transaction, id: result.insertedId.toString() };
  }

  async getUserGemHistory(userId: string): Promise<GemTransaction[]> {
    const transactions = await this.db.collection('gem_transactions').find({ userId }).sort({ createdAt: -1 }).toArray();
    return transactions.map(tx => ({ ...tx, id: tx._id.toString() }));
  }

  // Worker methods
  async assignWorkerToModel(workerId: string, modelId: string): Promise<WorkerAssignment> {
    const assignment = {
      workerId,
      modelId,
      createdAt: new Date()
    };

    const result = await this.db.collection('worker_assignments').insertOne(assignment);
    return { ...assignment, id: result.insertedId.toString() };
  }

  async getWorkerAssignments(workerId: string): Promise<User[]> {
    const assignments = await this.db.collection('worker_assignments').find({ workerId }).toArray();
    const modelIds = assignments.map(a => new ObjectId(a.modelId));
    const models = await this.db.collection('users').find({ _id: { $in: modelIds } }).toArray();
    return models.map(model => ({ ...model, id: model._id.toString() }));
  }

  async getWorkerConversations(workerId: string): Promise<any[]> {
    const assignments = await this.db.collection('worker_assignments').find({ workerId }).toArray();
    const modelIds = assignments.map(a => a.modelId);
    
    const conversations = await this.db.collection('messages').aggregate([
      {
        $match: {
          $or: [
            { receiverId: { $in: modelIds } },
            { senderId: { $in: modelIds } }
          ]
        }
      },
      {
        $group: {
          _id: {
            fan: {
              $cond: [
                { $in: ["$senderId", modelIds] },
                "$receiverId",
                "$senderId"
              ]
            },
            model: {
              $cond: [
                { $in: ["$senderId", modelIds] },
                "$senderId",
                "$receiverId"
              ]
            }
          },
          lastMessage: { $last: "$$ROOT" }
        }
      }
    ]).toArray();

    const result = [];
    for (const conv of conversations) {
      const fan = await this.getUser(conv._id.fan);
      const model = await this.getUser(conv._id.model);
      if (fan && model) {
        result.push({
          id: `${conv._id.fan}-${conv._id.model}`,
          fan: { ...fan, password: undefined },
          model: { ...model, password: undefined },
          lastMessage: conv.lastMessage
        });
      }
    }
    
    return result;
  }

  async getModelWorkers(modelId: string): Promise<User[]> {
    const workerAssignments = await this.db.collection('worker_assignments').find({ modelId }).toArray();
    const workerIds = workerAssignments.map(assignment => new ObjectId(assignment.workerId));
    const workers = await this.db.collection('users').find({ _id: { $in: workerIds } }).toArray();
    return workers.map(worker => ({ ...worker, id: worker._id.toString() }));
  }

  async removeWorkerAssignment(workerId: string, modelId: string): Promise<boolean> {
      const result = await this.db.collection('worker_assignments').deleteOne({ workerId, modelId });
      return result.deletedCount === 1;
  }

  
}

const storage = new Storage();
storage.init().catch(console.error);

export { storage };