import { z } from "zod";
import {
  insertUserSchema,
  insertStationSchema,
  insertReviewSchema,
  insertFavoriteSchema,
  insertPromotionSchema,
  insertChargingSessionSchema,
  insertRewardSchema,
  insertUserRewardSchema
} from "@shared/schema";

// Helper to validate and transform ID parameters from strings to numbers
export function validateIdParam(id: string) {
  const schema = z.coerce.number().int().positive();
  return schema.safeParse(id);
}

// User validation
export function validateInsertUserSchema(data: unknown) {
  return insertUserSchema.safeParse(data);
}

// Station validation
export function validateInsertStationSchema(data: unknown) {
  return insertStationSchema.safeParse(data);
}

// Review validation
export function validateInsertReviewSchema(data: unknown) {
  return insertReviewSchema.safeParse(data);
}

// Favorite validation
export function validateInsertFavoriteSchema(data: unknown) {
  return insertFavoriteSchema.safeParse(data);
}

// Promotion validation
export function validateInsertPromotionSchema(data: unknown) {
  return insertPromotionSchema.safeParse(data);
}

// Charging Session validation
export function validateInsertChargingSessionSchema(data: unknown) {
  return insertChargingSessionSchema.safeParse(data);
}

// Reward validation
export function validateInsertRewardSchema(data: unknown) {
  return insertRewardSchema.safeParse(data);
}

// User Reward validation
export function validateInsertUserRewardSchema(data: unknown) {
  return insertUserRewardSchema.safeParse(data);
}
