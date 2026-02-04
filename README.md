# BrainBoost
BrainBoost summative assignment

🧠 BrainBoost

AI-Powered Study Planner & Learning Assistant

📌 Overview

BrainBoost is a web application designed to help users plan their study activities, track weekly progress, and generate AI-powered quizzes. It uses the Google Gemini API to create personalized quiz questions and explanations. The project runs locally and is fully deployed on two web servers with a load balancer.

This application provides real value by improving productivity, learning consistency, and study habits.

✨ Key Features
✔ Study Planner

Add study plans

Mark as completed

Auto-update weekly activity

Auto-update progress chart

✔ Dashboard

Weekly progress chart

Completion statistics

Study activity summary

✔ AI Quiz Generator (Gemini API)

Users enter a topic

Gemini generates multiple questions + answers

Helps with learning and revision

✔ User Settings

Change name

Theme: Light/Dark

Quiz preferences

✔ Deployment

Runs on Web01 and Web02

Load balancer distributes traffic

.tech domain for public access

📁 Tech Stack

Frontend: HTML, CSS, JavaScript

Backend: Node.js, Express

Database: MySQL

AI Model: Google Gemini

Servers: Ubuntu, Nginx

Process Manager: PM2

🛠 Local Setup

Clone the repository

git clone https://github.com/Umukundwaa/BrainBoost.git


Install backend dependencies

cd brainboost/backend
npm install


Create .env file

AI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
AI_API_KEY=MY_API_KEY

DB_HOST=localhost
DB_USER=brainboost_user
DB_PASS=Angelumukundwa123456789.
DB_NAME=brainboost_db

Start the backend

node server.js


Open frontend

Open frontend/index.html in your browser.

📝 API Documentation
POST /api/quiz/generate

Generates quiz questions using Gemini API.

Request Body:

{
  "topic": "network security"
}

PUT /api/planner/complete/:id

Marks a study plan as completed and updates:

Progress

Weekly activity

Dashboard charts

GET /api/dashboard/progress

Returns weekly progress for charts.

🤖 Gemini API (External API Used)

Endpoint:
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent

Headers:

Authorization: Bearer My_API_KEY
Content-Type: application/json


Example Request:

{
  "contents": [
    {
      "parts": [
        {"text": "Generate 5 quiz questions about cybersecurity."}
      ]
    }
  ]
}

🚀 Deployment Guide
On Web01 & Web02

Install required software

sudo apt update
sudo apt install nginx nodejs npm git -y
sudo npm install -g pm2


Clone the project

git clone https://github.com/Umukundwaa/BrainBoost.git


Install backend and start server

cd brainboost/backend
npm install
pm2 start server.js


Move frontend to web root

sudo mv frontend /var/www/brainboost


Nginx configuration

server {
    listen 80;
    root /var/www/brainboost;

    location /api/ {
        proxy_pass http://localhost:5000/;
    }
}

Load Balancer (LB01)

Nginx configuration:

upstream brainboost_backend {
    server  54.83.174.153:5000;
    server 	52.86.167.210:5000;
}

server {
    listen 80;
    server_name umukundwa.tech;

    location / {
        proxy_pass http://brainboost_backend;
    }
}


Restart Nginx

sudo systemctl restart nginx

Domain Setup (.tech)

Type	Value
A Record	 	54.164.103.181
A Record (www)	54.164.103.181

Demo Video link 
part 1 of the video : https://www.loom.com/share/00ea4897abda4cf791101a6e7f2e4705

part 2 of the video : https://drive.google.com/file/d/175Y1SfGH7Oa0kityxtFE51dsl_H4BT6m/view?usp=sharing

Credits

Google Gemini API

Node.js / Express

MySQL

Nginx


website link: https://www.umukundwa.tech

