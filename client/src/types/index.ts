// User-related types
export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  createdAt: string;
  totalPoints: number;
  totalCharges: number;
  totalKwh: number;
}

export interface InsertUser {
  username: string;
  password: string;
  email: string;
  name: string;
}

// Station-related types
export interface Station {
  id: number;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  connectorTypes: string[];
  pricePerKwh: number | null;
  isFree: boolean;
  power: number;
  openingHours: string;
  status: "available" | "busy" | "offline";
  hasWifi: boolean;
  hasFreeParking: boolean;
  hasRestaurant: boolean;
  hasWaitingArea: boolean;
  ownerId?: number;
  createdAt: string;
}

export interface InsertStation {
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  connectorTypes: string[];
  pricePerKwh: number | null;
  isFree: boolean;
  power: number;
  openingHours: string;
  status: string;
  hasWifi: boolean;
  hasFreeParking: boolean;
  hasRestaurant: boolean;
  hasWaitingArea: boolean;
  ownerId?: number;
}

// Promotion-related types
export interface Promotion {
  id: number;
  stationId: number;
  description: string;
  pointsValue: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface InsertPromotion {
  stationId: number;
  description: string;
  pointsValue: number;
  startDate: string;
  endDate: string;
}

// Review-related types
export interface Review {
  id: number;
  stationId: number;
  userId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface InsertReview {
  stationId: number;
  userId: number;
  rating: number;
  comment?: string;
}

// Favorite-related types
export interface Favorite {
  userId: number;
  stationId: number;
  createdAt: string;
}

export interface InsertFavorite {
  userId: number;
  stationId: number;
}

// Charging session-related types
export interface ChargingSession {
  id: number;
  userId: number;
  stationId: number;
  startTime: string;
  endTime: string | null;
  kwhCharged: number | null;
  pointsEarned: number;
  totalPrice: number | null;
  status: "in_progress" | "completed" | "cancelled";
}

export interface InsertChargingSession {
  userId: number;
  stationId: number;
  startTime: string;
}

// Reward-related types
export interface Reward {
  id: number;
  name: string;
  description: string;
  pointsRequired: number;
  type: string;
  value: number;
  createdAt: string;
}

export interface InsertReward {
  name: string;
  description: string;
  pointsRequired: number;
  type: string;
  value: number;
}

// User rewards-related types
export interface UserReward {
  id: number;
  userId: number;
  rewardId: number;
  isUsed: boolean;
  usedAt: string | null;
  createdAt: string;
  reward?: Reward;
}

export interface InsertUserReward {
  userId: number;
  rewardId: number;
}
