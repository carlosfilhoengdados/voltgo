import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp, primaryKey, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  totalPoints: integer("total_points").default(0).notNull(),
  totalCharges: integer("total_charges").default(0).notNull(),
  totalKwh: doublePrecision("total_kwh").default(0).notNull(),
});

// Charging stations table
export const stations = pgTable("stations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  connectorTypes: text("connector_types").array().notNull(),
  pricePerKwh: doublePrecision("price_per_kwh"),
  isFree: boolean("is_free").default(false).notNull(),
  power: integer("power").notNull(), // in kW
  openingHours: text("opening_hours").notNull(),
  status: text("status").notNull().default("available"), // available, busy, offline
  hasWifi: boolean("has_wifi").default(false).notNull(),
  hasFreeParking: boolean("has_free_parking").default(false).notNull(),
  hasRestaurant: boolean("has_restaurant").default(false).notNull(),
  hasWaitingArea: boolean("has_waiting_area").default(false).notNull(),
  ownerId: integer("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Promotions table
export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  stationId: integer("station_id").references(() => stations.id).notNull(),
  description: text("description").notNull(),
  pointsValue: integer("points_value").default(0).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  stationId: integer("station_id").references(() => stations.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Favorites table
export const favorites = pgTable("favorites", {
  userId: integer("user_id").references(() => users.id).notNull(),
  stationId: integer("station_id").references(() => stations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.stationId] }),
}));

// Charging sessions table
export const chargingSessions = pgTable("charging_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  stationId: integer("station_id").references(() => stations.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  kwhCharged: doublePrecision("kwh_charged"),
  pointsEarned: integer("points_earned").default(0).notNull(),
  totalPrice: doublePrecision("total_price"),
  status: text("status").notNull().default("in_progress"), // in_progress, completed, cancelled
});

// Rewards table
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pointsRequired: integer("points_required").notNull(),
  type: text("type").notNull(), // discount, free_charge, etc.
  value: doublePrecision("value").notNull(), // percentage or fixed amount
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User rewards table (for redeemed rewards)
export const userRewards = pgTable("user_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  rewardId: integer("reward_id").references(() => rewards.id).notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define table relations
export const usersRelations = relations(users, ({ many }) => ({
  reviews: many(reviews),
  favorites: many(favorites),
  chargingSessions: many(chargingSessions),
  userRewards: many(userRewards),
  ownedStations: many(stations, { relationName: "stationOwner" }),
}));

export const stationsRelations = relations(stations, ({ many, one }) => ({
  reviews: many(reviews),
  favorites: many(favorites),
  chargingSessions: many(chargingSessions),
  promotions: many(promotions),
  owner: one(users, {
    fields: [stations.ownerId],
    references: [users.id],
    relationName: "stationOwner",
  }),
}));

export const promotionsRelations = relations(promotions, ({ one }) => ({
  station: one(stations, {
    fields: [promotions.stationId],
    references: [stations.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  station: one(stations, {
    fields: [reviews.stationId],
    references: [stations.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  station: one(stations, {
    fields: [favorites.stationId],
    references: [stations.id],
  }),
}));

export const chargingSessionsRelations = relations(chargingSessions, ({ one }) => ({
  user: one(users, {
    fields: [chargingSessions.userId],
    references: [users.id],
  }),
  station: one(stations, {
    fields: [chargingSessions.stationId],
    references: [stations.id],
  }),
}));

export const rewardsRelations = relations(rewards, ({ many }) => ({
  userRewards: many(userRewards),
}));

export const userRewardsRelations = relations(userRewards, ({ one }) => ({
  user: one(users, {
    fields: [userRewards.userId],
    references: [users.id],
  }),
  reward: one(rewards, {
    fields: [userRewards.rewardId],
    references: [rewards.id],
  }),
}));

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, totalPoints: true, totalCharges: true, totalKwh: true });
export const insertStationSchema = createInsertSchema(stations).omit({ id: true, createdAt: true });
export const insertPromotionSchema = createInsertSchema(promotions).omit({ id: true, createdAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertFavoriteSchema = createInsertSchema(favorites).omit({ createdAt: true });
export const insertChargingSessionSchema = createInsertSchema(chargingSessions).omit({ id: true, endTime: true, kwhCharged: true, pointsEarned: true, totalPrice: true });
export const insertRewardSchema = createInsertSchema(rewards).omit({ id: true, createdAt: true });
export const insertUserRewardSchema = createInsertSchema(userRewards).omit({ id: true, createdAt: true, isUsed: true, usedAt: true });

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Station = typeof stations.$inferSelect;
export type InsertStation = z.infer<typeof insertStationSchema>;

export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

export type ChargingSession = typeof chargingSessions.$inferSelect;
export type InsertChargingSession = z.infer<typeof insertChargingSessionSchema>;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;

export type UserReward = typeof userRewards.$inferSelect;
export type InsertUserReward = z.infer<typeof insertUserRewardSchema>;
