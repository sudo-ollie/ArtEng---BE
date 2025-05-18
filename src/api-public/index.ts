import { Router } from "express";
import { EmailListController } from "../api/controllers/emailList.controller";
import { EventController } from "./controllers/event.controller";

export function setupPublicApi() {
  const router = Router();

  // Test Endpoint
  router.get("/", (req, res) => {
    res.json({
      name: "ArtEng Public API",
      version: "1.0.0",
      status: "online",
    });
  });

  // Optional Dev Debugging
  if (process.env.NODE_ENV !== "production") {
    router.use((req, res, next) => {
      console.log("API-PUBLIC DEBUGGING:", {
        originalUrl: req.originalUrl,
        baseUrl: req.baseUrl,
        path: req.path,
        url: req.url,
      });
      next();
    });
  }

  // Mailing List Endpoints
  router.post("/mailing-list/join", EmailListController.joinMailingList);
  router.post("/mailing-list/leave", EmailListController.leaveMailingList);

  // Event Endpoints
  router.get("/events", EventController.getAllEvents);
  router.get("/events/:id", EventController.getEventById);

  return router;
}
