import { 
  users, type User, type InsertUser,
  stations, type Station, type InsertStation,
  reviews, type Review, type InsertReview,
  favorites, type Favorite, type InsertFavorite,
  promotions, type Promotion, type InsertPromotion,
  chargingSessions, type ChargingSession, type InsertChargingSession,
  rewards, type Reward, type InsertReward,
  userRewards, type UserReward, type InsertUserReward
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, like, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User-related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStats(userId: number, pointsToAdd: number, kwhToAdd: number): Promise<User>;
  
  // Station-related methods
  getStations(filters?: {
    status?: string[];
    connectorTypes?: string[];
    isFree?: boolean;
    minPower?: number;
  }): Promise<Station[]>;
  getStationById(id: number): Promise<Station | undefined>;
  getStationsByOwner(ownerId: number): Promise<Station[]>;
  createStation(station: InsertStation): Promise<Station>;
  updateStation(id: number, data: Partial<InsertStation>): Promise<Station>;
  
  // Review-related methods
  getReviewsByStation(stationId: number): Promise<Review[]>;
  getUserReviews(userId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Favorite-related methods
  getUserFavorites(userId: number): Promise<Station[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, stationId: number): Promise<void>;
  isFavorite(userId: number, stationId: number): Promise<boolean>;
  
  // Promotion-related methods
  getPromotionsByStation(stationId: number): Promise<Promotion[]>;
  createPromotion(promotion: InsertPromotion): Promise<Promotion>;
  
  // Charging session-related methods
  startChargingSession(session: InsertChargingSession): Promise<ChargingSession>;
  endChargingSession(id: number, kwhCharged: number): Promise<ChargingSession>;
  getUserChargingSessions(userId: number): Promise<ChargingSession[]>;
  
  // Reward-related methods
  getAllRewards(): Promise<Reward[]>;
  getRewardById(id: number): Promise<Reward | undefined>;
  getUserRewards(userId: number): Promise<(UserReward & { reward: Reward })[]>;
  claimReward(userReward: InsertUserReward): Promise<UserReward>;
  useReward(userRewardId: number): Promise<UserReward>;
  
  // Session storage for authentication
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User-related methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUserStats(userId: number, pointsToAdd: number, kwhToAdd: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        totalPoints: sql`${users.totalPoints} + ${pointsToAdd}`,
        totalCharges: sql`${users.totalCharges} + 1`,
        totalKwh: sql`${users.totalKwh} + ${kwhToAdd}`,
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Station-related methods
  async getStations(filters?: {
    status?: string[];
    connectorTypes?: string[];
    isFree?: boolean;
    minPower?: number;
  }): Promise<Station[]> {
    let query = db.select().from(stations);
    
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        query = query.where(inArray(stations.status, filters.status));
      }
      
      if (filters.connectorTypes && filters.connectorTypes.length > 0) {
        // This is a more complex query for checking array overlap
        query = query.where(sql`${stations.connectorTypes} && ${filters.connectorTypes}`);
      }
      
      if (filters.isFree !== undefined) {
        query = query.where(eq(stations.isFree, filters.isFree));
      }
      
      if (filters.minPower !== undefined) {
        query = query.where(sql`${stations.power} >= ${filters.minPower}`);
      }
    }
    
    return await query;
  }

  async getStationById(id: number): Promise<Station | undefined> {
    const [station] = await db.select().from(stations).where(eq(stations.id, id));
    return station;
  }

  async getStationsByOwner(ownerId: number): Promise<Station[]> {
    return await db.select().from(stations).where(eq(stations.ownerId, ownerId));
  }

  async createStation(station: InsertStation): Promise<Station> {
    const [newStation] = await db.insert(stations).values(station).returning();
    return newStation;
  }

  async updateStation(id: number, data: Partial<InsertStation>): Promise<Station> {
    const [updatedStation] = await db
      .update(stations)
      .set(data)
      .where(eq(stations.id, id))
      .returning();
    return updatedStation;
  }

  // Review-related methods
  async getReviewsByStation(stationId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.stationId, stationId))
      .orderBy(desc(reviews.createdAt));
  }

  async getUserReviews(userId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  // Favorite-related methods
  async getUserFavorites(userId: number): Promise<Station[]> {
    const result = await db
      .select({
        station: stations,
      })
      .from(favorites)
      .innerJoin(stations, eq(favorites.stationId, stations.id))
      .where(eq(favorites.userId, userId));
    
    return result.map(r => r.station);
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const [newFavorite] = await db.insert(favorites).values(favorite).returning();
    return newFavorite;
  }

  async removeFavorite(userId: number, stationId: number): Promise<void> {
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.stationId, stationId)
        )
      );
  }

  async isFavorite(userId: number, stationId: number): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.stationId, stationId)
        )
      );
    return !!favorite;
  }

  // Promotion-related methods
  async getPromotionsByStation(stationId: number): Promise<Promotion[]> {
    return await db
      .select()
      .from(promotions)
      .where(eq(promotions.stationId, stationId))
      .orderBy(desc(promotions.createdAt));
  }

  async createPromotion(promotion: InsertPromotion): Promise<Promotion> {
    const [newPromotion] = await db.insert(promotions).values(promotion).returning();
    return newPromotion;
  }

  // Charging session-related methods
  async startChargingSession(session: InsertChargingSession): Promise<ChargingSession> {
    const [newSession] = await db.insert(chargingSessions).values(session).returning();
    return newSession;
  }

  async endChargingSession(id: number, kwhCharged: number): Promise<ChargingSession> {
    // Get the station to calculate price
    const [chargingSession] = await db
      .select()
      .from(chargingSessions)
      .where(eq(chargingSessions.id, id));
    
    if (!chargingSession) {
      throw new Error("Charging session not found");
    }
    
    const [station] = await db
      .select()
      .from(stations)
      .where(eq(stations.id, chargingSession.stationId));
    
    if (!station) {
      throw new Error("Station not found");
    }
    
    // Calculate price and points
    const endTime = new Date();
    const totalPrice = station.isFree ? 0 : (station.pricePerKwh || 0) * kwhCharged;
    const pointsEarned = Math.floor(kwhCharged * 10); // 10 points per kWh
    
    // Update user stats
    await this.updateUserStats(chargingSession.userId, pointsEarned, kwhCharged);
    
    // Update the charging session
    const [updatedSession] = await db
      .update(chargingSessions)
      .set({
        endTime,
        kwhCharged,
        pointsEarned,
        totalPrice,
        status: "completed",
      })
      .where(eq(chargingSessions.id, id))
      .returning();
    
    return updatedSession;
  }

  async getUserChargingSessions(userId: number): Promise<ChargingSession[]> {
    return await db
      .select()
      .from(chargingSessions)
      .where(eq(chargingSessions.userId, userId))
      .orderBy(desc(chargingSessions.startTime));
  }

  // Reward-related methods
  async getAllRewards(): Promise<Reward[]> {
    return await db.select().from(rewards);
  }

  async getRewardById(id: number): Promise<Reward | undefined> {
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, id));
    return reward;
  }

  async getUserRewards(userId: number): Promise<(UserReward & { reward: Reward })[]> {
    const result = await db
      .select({
        userReward: userRewards,
        reward: rewards,
      })
      .from(userRewards)
      .innerJoin(rewards, eq(userRewards.rewardId, rewards.id))
      .where(eq(userRewards.userId, userId));
    
    return result.map(r => ({ ...r.userReward, reward: r.reward }));
  }

  async claimReward(userReward: InsertUserReward): Promise<UserReward> {
    // Check if user has enough points
    const [user] = await db.select().from(users).where(eq(users.id, userReward.userId));
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, userReward.rewardId));
    
    if (!user || !reward) {
      throw new Error("User or reward not found");
    }
    
    if (user.totalPoints < reward.pointsRequired) {
      throw new Error("Not enough points to claim this reward");
    }
    
    // Deduct points from user
    await db
      .update(users)
      .set({
        totalPoints: user.totalPoints - reward.pointsRequired,
      })
      .where(eq(users.id, user.id));
    
    // Create the user reward
    const [newUserReward] = await db.insert(userRewards).values(userReward).returning();
    return newUserReward;
  }

  async useReward(userRewardId: number): Promise<UserReward> {
    const [userReward] = await db
      .update(userRewards)
      .set({
        isUsed: true,
        usedAt: new Date(),
      })
      .where(eq(userRewards.id, userRewardId))
      .returning();
    
    if (!userReward) {
      throw new Error("User reward not found");
    }
    
    return userReward;
  }
}

export const storage = new DatabaseStorage();
