import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  validateInsertStationSchema, 
  validateInsertReviewSchema,
  validateInsertFavoriteSchema,
  validateInsertPromotionSchema,
  validateInsertChargingSessionSchema,
  validateIdParam
} from "./validators";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Middleware to check if user is authenticated
  const ensureAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Stations APIs
  app.get("/api/stations", async (req, res) => {
    try {
      const filters: any = {};
      
      // Parse status filter
      if (req.query.status) {
        filters.status = (req.query.status as string).split(",");
      }
      
      // Parse connector types filter
      if (req.query.connectorTypes) {
        filters.connectorTypes = (req.query.connectorTypes as string).split(",");
      }
      
      // Parse isFree filter
      if (req.query.isFree !== undefined) {
        filters.isFree = req.query.isFree === "true";
      }
      
      // Parse minPower filter
      if (req.query.minPower !== undefined) {
        filters.minPower = parseInt(req.query.minPower as string, 10);
      }
      
      const stations = await storage.getStations(
        Object.keys(filters).length > 0 ? filters : undefined
      );
      res.json(stations);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  app.get("/api/stations/:id", async (req, res) => {
    try {
      const validationResult = validateIdParam(req.params.id);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid station ID", 
          errors: validationResult.error.errors 
        });
      }
      
      const stationId = validationResult.data;
      const station = await storage.getStationById(stationId);
      
      if (!station) {
        return res.status(404).json({ message: "Station not found" });
      }
      
      res.json(station);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  app.post("/api/stations", ensureAuthenticated, async (req, res) => {
    try {
      const validationResult = validateInsertStationSchema(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationResult.error.errors 
        });
      }
      
      const stationData = {
        ...validationResult.data,
        ownerId: req.user.id // Set current user as owner
      };
      
      const station = await storage.createStation(stationData);
      res.status(201).json(station);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  app.put("/api/stations/:id", ensureAuthenticated, async (req, res) => {
    try {
      const validationResult = validateIdParam(req.params.id);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid station ID", 
          errors: validationResult.error.errors 
        });
      }
      
      const stationId = validationResult.data;
      const station = await storage.getStationById(stationId);
      
      if (!station) {
        return res.status(404).json({ message: "Station not found" });
      }
      
      // Check if user is the owner
      if (station.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: You do not own this station" });
      }
      
      // Validate update data
      const updateValidationResult = validateInsertStationSchema(req.body);
      
      if (!updateValidationResult.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: updateValidationResult.error.errors 
        });
      }
      
      const updatedStation = await storage.updateStation(stationId, updateValidationResult.data);
      res.json(updatedStation);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  // Reviews APIs
  app.get("/api/stations/:id/reviews", async (req, res) => {
    try {
      const validationResult = validateIdParam(req.params.id);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid station ID", 
          errors: validationResult.error.errors 
        });
      }
      
      const stationId = validationResult.data;
      const reviews = await storage.getReviewsByStation(stationId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  app.post("/api/stations/:id/reviews", ensureAuthenticated, async (req, res) => {
    try {
      const validationResult = validateIdParam(req.params.id);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid station ID", 
          errors: validationResult.error.errors 
        });
      }
      
      const stationId = validationResult.data;
      
      // Validate review data
      const reviewValidation = validateInsertReviewSchema({
        ...req.body,
        stationId,
        userId: req.user.id
      });
      
      if (!reviewValidation.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: reviewValidation.error.errors 
        });
      }
      
      const review = await storage.createReview(reviewValidation.data);
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  // Favorites APIs
  app.get("/api/favorites", ensureAuthenticated, async (req, res) => {
    try {
      const favorites = await storage.getUserFavorites(req.user.id);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  app.post("/api/favorites", ensureAuthenticated, async (req, res) => {
    try {
      const favoriteData = {
        userId: req.user.id,
        stationId: req.body.stationId
      };
      
      const validationResult = validateInsertFavoriteSchema(favoriteData);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationResult.error.errors 
        });
      }
      
      // Check if already a favorite
      const isFavorite = await storage.isFavorite(req.user.id, favoriteData.stationId);
      
      if (isFavorite) {
        return res.status(400).json({ message: "Already in favorites" });
      }
      
      const favorite = await storage.addFavorite(validationResult.data);
      res.status(201).json(favorite);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  app.delete("/api/favorites/:stationId", ensureAuthenticated, async (req, res) => {
    try {
      const validationResult = validateIdParam(req.params.stationId);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid station ID", 
          errors: validationResult.error.errors 
        });
      }
      
      const stationId = validationResult.data;
      
      await storage.removeFavorite(req.user.id, stationId);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  app.get("/api/favorites/check/:stationId", ensureAuthenticated, async (req, res) => {
    try {
      const validationResult = validateIdParam(req.params.stationId);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid station ID", 
          errors: validationResult.error.errors 
        });
      }
      
      const stationId = validationResult.data;
      const isFavorite = await storage.isFavorite(req.user.id, stationId);
      
      res.json({ isFavorite });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  // Promotions APIs
  app.get("/api/stations/:id/promotions", async (req, res) => {
    try {
      const validationResult = validateIdParam(req.params.id);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid station ID", 
          errors: validationResult.error.errors 
        });
      }
      
      const stationId = validationResult.data;
      const promotions = await storage.getPromotionsByStation(stationId);
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  app.post("/api/stations/:id/promotions", ensureAuthenticated, async (req, res) => {
    try {
      const validationResult = validateIdParam(req.params.id);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid station ID", 
          errors: validationResult.error.errors 
        });
      }
      
      const stationId = validationResult.data;
      const station = await storage.getStationById(stationId);
      
      if (!station) {
        return res.status(404).json({ message: "Station not found" });
      }
      
      // Check if user is the owner
      if (station.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: You do not own this station" });
      }
      
      // Validate promotion data
      const promotionValidation = validateInsertPromotionSchema({
        ...req.body,
        stationId
      });
      
      if (!promotionValidation.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: promotionValidation.error.errors 
        });
      }
      
      const promotion = await storage.createPromotion(promotionValidation.data);
      res.status(201).json(promotion);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  // Charging Sessions APIs
  app.post("/api/charging/start", ensureAuthenticated, async (req, res) => {
    try {
      const sessionData = {
        userId: req.user.id,
        stationId: req.body.stationId,
        startTime: new Date()
      };
      
      const validationResult = validateInsertChargingSessionSchema(sessionData);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationResult.error.errors 
        });
      }
      
      const session = await storage.startChargingSession(validationResult.data);
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  app.post("/api/charging/:id/end", ensureAuthenticated, async (req, res) => {
    try {
      const validationResult = validateIdParam(req.params.id);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid session ID", 
          errors: validationResult.error.errors 
        });
      }
      
      const sessionId = validationResult.data;
      const kwhCharged = req.body.kwhCharged;
      
      if (typeof kwhCharged !== 'number' || kwhCharged <= 0) {
        return res.status(400).json({ message: "Invalid kWh value" });
      }
      
      const session = await storage.endChargingSession(sessionId, kwhCharged);
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  app.get("/api/charging/history", ensureAuthenticated, async (req, res) => {
    try {
      const sessions = await storage.getUserChargingSessions(req.user.id);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  // Rewards APIs
  app.get("/api/rewards", async (req, res) => {
    try {
      const rewards = await storage.getAllRewards();
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  app.get("/api/user/rewards", ensureAuthenticated, async (req, res) => {
    try {
      const userRewards = await storage.getUserRewards(req.user.id);
      res.json(userRewards);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  app.post("/api/rewards/:id/claim", ensureAuthenticated, async (req, res) => {
    try {
      const validationResult = validateIdParam(req.params.id);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid reward ID", 
          errors: validationResult.error.errors 
        });
      }
      
      const rewardId = validationResult.data;
      
      try {
        const userReward = await storage.claimReward({
          userId: req.user.id,
          rewardId
        });
        res.status(201).json(userReward);
      } catch (error) {
        if ((error as Error).message === "Not enough points to claim this reward") {
          return res.status(400).json({ message: (error as Error).message });
        }
        throw error;
      }
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  app.post("/api/user/rewards/:id/use", ensureAuthenticated, async (req, res) => {
    try {
      const validationResult = validateIdParam(req.params.id);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid user reward ID", 
          errors: validationResult.error.errors 
        });
      }
      
      const userRewardId = validationResult.data;
      
      try {
        const userReward = await storage.useReward(userRewardId);
        res.json(userReward);
      } catch (error) {
        if ((error as Error).message === "User reward not found") {
          return res.status(404).json({ message: (error as Error).message });
        }
        throw error;
      }
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
