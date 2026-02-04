const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController.js");
const auth = require("../scripts/auth");


//Get/api/dashboard
router.get("/",auth.verifyUser, dashboardController.getDashboardData);

// search using AI
router.post("/search", auth.verifyUser, dashboardController.searchTopic);
router.post("/generate-quiz", auth.verifyUser, dashboardController.generateQuiz);
router.post("/save-quiz-score", auth.verifyUser, dashboardController.saveQuizScore);
router.post("/settings",auth.verifyUser,dashboardController.saveSettings);
router.post("/complete-plan",auth.verifyUser, dashboardController.completePlan);


module.exports = router;
