require("dotenv").config();
const db = require("../db/db");
const axios = require("axios");


// get dashboard data for logged in user
module.exports.getDashboardData = async (req, res) => {
    const userId = req.user.id;

    try {
        // Recent topics from database
        const recentTopics = await new Promise((resolve, reject) => {
            db.query(
                "SELECT topic, created_at as last_studied FROM recent_topics WHERE user_id = ? ORDER BY created_at DESC LIMIT 5",
                [userId],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                }

            );
        });
        // user quiz scores/progress
        const quizScores = await new Promise((resolve, reject) => {
            db.query(
            "SELECT topic, score, created_at FROM quiz_scores WHERE user_id = ?  ORDER BY created_at DESC LIMIT 10", 
            [userId],
            (err, results) => {
                if(err) reject(err);
                else resolve(results);
            }
            );
        });

    // Calculate weekly activity
        const weeklyActivity = [0, 0, 0, 0, 0, 0, 0];
        quizScores.forEach(q => {
            const date = new Date(q.created_at);
            const day = date.getDay();
            const index = day === 0 ? 6 : day - 1;
            weeklyActivity[index] += 1;
        });

     // Quiz completion
        const quizCompletion = {
            completed: quizScores.length,
            remaining: Math.max(0, 10 - quizScores.length)
        };

        // fetch Ai summary from external API
        let aiSummary = "Welcome back! Ready to learn something new today?";
        if (recentTopics.length> 0) {
            try {
                const lastTopic = recentTopics[0].topic;
                const prompt = `In 2-3 senteces, give an encouraging message to a student who last studied "${lastTopic}". Suggest what could learn next.`;

                const response = await axios.post(
                    `${process.env.AI_API_URL}?key=${process.env.AI_API_KEY}`,
                    {
                        contents:[{
                            parts: [{ text: prompt}]
                        }]
                    },
                    {
                        headers: {"Content-Type": "application/json"}
                    }
                );
                aiSummary = response.data.candidates?.[0]?.content?.parts?.[0]?.text || aiSummary;
            } catch (error) {
                console.error("AI API Error:", error.message);
                
            }
        }
    // fetch user settings
        const userSettings = await new Promise((resolve, reject) => {
            db.query(
                "SELECT display_name, theme, preferred_quiz_difficulty FROM user_settings WHERE user_id = ?",
                [userId],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results[0] || {});
                }
            );
        });


        //Return dashboard data
        res.status(200).json({
            message: "Dashboard data loaded successfully",
            data: {
                recentTopics,
                quizScores,
                aiSummary,
                userSettings,
                weekly_activity: weeklyActivity,
                quiz_completion: quizCompletion
            }
        });

    } catch (error) {
console.error("Dashboard Controller Error:" , error);
res.status(500).json({ message: "Error loading dashboard" });

    }
} 

// Search Topic using AI

module.exports.searchTopic = async (req, res) => {
    const { q } = req.body;
    const userId = req.user.id;

    if (!q || !q.trim()) {
        return res.status(400).json({ message: "No query provided" });
    }

    try {
        const prompt = `You are an expert tutor. Explain the topic: "${q}"
        
    Please provide:
    1. Clear Summary : A comprehensive but easy-to-understand explanation (3-5 sentences)
    2. Real-World Example : At least one practical example showing how this concept is used 
    3. Code Example : If applicable, provide a well-commented code snippet demonstrating this concept
    4. Key Points : 3-5 bullet points highlighting the most important things to remember
       
    Format your response in a clear, structured way that helps a student learn effectively. `;

    const response = await axios.post(

        `${process.env.AI_API_URL}?key=${process.env.AI_API_KEY}`,
        {
            contents: [{
                parts: [{ text: prompt }]
            }]
        },
        {
            headers: { "Content-Type": "application/json"}
        }
    );
    const answer = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No answer found";

    // Save to recent topics
    db.query(
        "INSERT INTO recent_topics (user_id, topic) VALUES (?, ?) ON DUPLICATE KEY UPDATE created_at = NOW()",
        [userId, q],
        (err) => {
            if (err) console.error("Error saving recent topic:", err);
        }
    );

    res.status(200).json({
        title: q,
        extract: answer,
        success: true
    });
    } catch (error) {
        console.error("AI Search Error:", error.message);
        res.status(500).json({
            message: "AI failed to generate answer",
            error: error.message
        });
    }
};

// Generate Quiz using AI
module.exports.generateQuiz = async (req, res) => {

    const { topic, difficulty } = req.body;
    const userId = req.user.id;

    if (!topic || !topic.trim()) {
        return res.status(400).json({ message: "Topic is required" });

    }

    const numQuestions = difficulty === 'easy' ? 10 : difficulty === 'hard' ? 20 : 15;

    try {
        const prompt = `Generate a ${difficulty} level quiz about "${topic}" with ${numQuestions} multiple choice questions.

        For each question, provide:
        - A clear , specific question
        - 4 answer options (A, B, C, D)
        -Mark the correct answer

    Format your response as a JSON array like this:
    [
    {
    "question": "What is ....?" ,
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0
    }]

    Make sure the questions are ${difficulty} difficult and test real understanding of ${topic}. `;
        
        const response = await axios.post(
            `${process.env.AI_API_URL}?key=${process.env.AI_API_KEY}`,
            {
                contents : [{
                    parts: [{ text : prompt}]
                }]
            },
            { headers: { "Content-Type": "application/json" }}
        );

        let aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Extract JSON from markdown code blocks 
        const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            aiResponse = jsonMatch[1] || jsonMatch[0];
        }

        const questions = JSON.parse(aiResponse);

        // save quiz to database
        const quizId = await new Promise((resolve, reject) => {
            db.query(
                "INSERT INTO quiz_scores (user_id, topic, score) VALUES (?, ?, ?)",
                [userId, topic, 0],
                (err, result) => {
                    if(err) reject(err);
                    else resolve(result.insertId);
                }
            );
        });

        res.status(200).json({
            success: true,
            quizId,
            questions,
            topic,
            difficulty
        });
    } catch (error) {
        console.error("Quiz Generation Error: ", error.message);
        res.status(500).json({
            message: "Failed to generate quiz",
            error: error.message
        });
    }
};

    // Save quiz score
    module.exports.saveQuizScore = async (req, res) => {
        const { quizId, topic, score, total } = req.body;
        const userId = req.user.id;

        try {
            await new Promise((resolve, reject) =>{
            db.query(
                "UPDATE quiz_scores SET score = ? WHERE id = ? AND user_id = ?" ,
                [score, quizId, userId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error ("Save score error:", error);
        res.status(500).json({ message: "Failed to save score" });

    }
 };

// save user settings 
module.exports.saveSettings = async (req, res) => {
    const { display_name, theme, preferred_quiz_difficulty } = req.body;
    const userId = req.user.id ;
console.log("User ID from auth:", userId); 
console.log("Settings data:", { display_name, theme, preferred_quiz_difficulty });

    try {
        //check if settings exist
        const existing = await new Promise((resolve, reject) => {
            db.query(
                "SELECT * FROM user_settings WHERE user_id = ?",
                [userId],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results[0]); 
                }
            );
        });
        if (existing) {
            //  Update existing settings
            await new Promise((resolve, reject) => {
                db.query(
                    "UPDATE user_settings SET display_name = ?, theme = ?, preferred_quiz_difficulty = ? WHERE user_id = ?",
                    [display_name, theme , preferred_quiz_difficulty, userId],
                    (err) => {
                        if(err) reject(err);
                        else resolve();
                    }
                );
            });
        } else {
            // Insert new settings
            await new Promise((resolve, reject) => {
                db.query(
                    "INSERT INTO user_settings (user_id , display_name, theme, preferred_quiz_difficulty) VALUES (?, ?, ?, ?)",
                    [userId, display_name, theme, preferred_quiz_difficulty],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }
        res.status(200).json ({
            success: true,
            message: "Settings saved successfully",
            data: {
                 userSettings: { display_name, theme, preferred_quiz_difficulty }
            }
        });
    } catch (error) {
        console.error("Settings save error:", error);
        res.status(500).json({ message: "Failed to save settings" });

    }
};

module.exports.completePlan = async (req, res) => {
    const userId = req.user.id;
    const { title, date, time } = req.body;

    try {

        res.status(200).json({ 
            success: true, 
            message: "Plan marked as completed"
        });
    } catch (err) {
        console.error("Complete plan error:", err);
        res.status(500).json({ message: "Failed to mark plan as completed" });
    }
};