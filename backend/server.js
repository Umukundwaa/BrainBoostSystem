console.log("Starting BrainBoost server...");

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// roubrainboost_dbtes

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res) => {
    res.status(404).json({ message: "Route not found"});
});

// start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    
    console.log(`Server is running on port ${PORT}`);
    console.log("AI API URL:", process.env.AI_API_URL ? "Loaded" : "Missing");

});
