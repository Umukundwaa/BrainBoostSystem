// 1.Check Login

const user = JSON.parse(localStorage.getItem("brainboost_user"));

if (!user || !user.id) {
    window.location.href = "login.html";

}

//show username
document.getElementById("usernameSmall").textContent = user.username;


function formatAIResponse(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
        .replace(/^\*\s+(.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, match => {
            if (match.includes('1.')) return `<ol>${match}</ol>`;
            return `<ul>${match}</ul>`;
        })
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
}

// 2. View Switching
const menuItems = document.querySelectorAll(".menu-item");
const views =document.querySelectorAll(".view, .viewhidden, .hidden");

//Active sidebar

    document.getElementById("actionSearch").addEventListener("click", () => {
    document.querySelector("[data-view='search']").click(); });
    document.getElementById("actionQuiz").addEventListener("click", () => {
    document.querySelector("[data-view='quizzes']").click();});
    document.getElementById("actionPlan").addEventListener("click", () => {
    document.querySelector("[data-view='planner']").click(); });
    document.getElementById("actionProgress").addEventListener("click", () => {
    document.querySelector("[data-view='progress']").click();});

menuItems.forEach(btn => {
    btn.addEventListener("click", () => {

        menuItems.forEach(i => i.classList.remove("active"));
        btn.classList.add("active");

        const viewName = btn.dataset.view + "View";

        views.forEach(v => v.classList.add("hidden"));
        document.getElementById(viewName).classList.remove("hidden");

        document.getElementById("pageTitle").textContent = btn.textContent.trim();
    });
});

// 3. Logout
document.getElementById("logoutBtn").addEventListener("click", () => {

    localStorage.removeItem("brainboost_user");
    window.location.href = "login.html";
});

// 4. Fetch Dashboard Data

async function loadDashboard() {
    try {
        const res = await axios.get("http://localhost:5000/api/dashboard" , {
            headers: { "user-id": user.id }
        });
        
        // fill card

        const data = res.data.data;

        document.getElementById("hoursWeek").textContent = data.quizScores.reduce((acc, q) => acc + 1, 0) + "h"; // example
        document.getElementById("completedQuizzes").textContent = data.quizScores.length;
        document.getElementById("topicsLearned").textContent = data.recentTopics.length;

        // continue learning section

        const grid = document.getElementById("continueGrid");
        grid.innerHTML = "";

        data.recentTopics.forEach(t => {
            const card = `
            <div class= "continue-item">
            <h4>${t.topic}</h4>
            <small>Last Studied: ${t.last_studied}</small>

            </div>
            `;
            grid.innerHTML += card;

        });
    loadCharts(data.weekly_activity, data.quiz_completion);
  }catch (err) {
        console.error("Dashboard error:", err);
    }
}

loadDashboard();

// 5. Charts
function loadCharts(weekData, completion) {

    // Destroy existing charts if they exist
    const activityCanvas = document.getElementById("activityChart");
    const completionCanvas = document.getElementById("completionChart");
    
    if (activityCanvas.chart) {
        activityCanvas.chart.destroy();
    }
    if (completionCanvas.chart) {
        completionCanvas.chart.destroy();
    }

    // Activity chart
    const activityChart = Chart(document.getElementById("activityChart"), {
       type: "line",
        data: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{
                label: "Study Sessions",
                data: weekData,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });

    // Completion Chart (Pie)
    const completionChart = new Chart(completionCanvas, {
        type: "pie",
        data: {
            labels: ["Completed", "Remaining"],
            datasets: [{
                data: [completion.completed, completion.remaining],
                backgroundColor: ['#10b981', '#e5e7eb'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    activityCanvas.chart = activityChart;
    completionCanvas.chart = completionChart;
}

// Search Topic
document.getElementById("topicSearchBtn").addEventListener("click", async () => {
    const q = document.getElementById("topicQuery").value.trim();
    const resultsBox =document.getElementById("searchResults");

    if(!q) return;
    
    resultsBox.innerHTML = "<p>Searching...</p>";

    try {
        const res = await axios.post(`http://localhost:5000/api/dashboard/search`,
            { q },
            { headers: { "user-id": user.id } }
        );

        resultsBox.innerHTML = `
            <div class="topic-result">
                <h3>${res.data.title}</h3>
                <div class="topic-content">${formatAIResponse(res.data.extract)}</div>
            </div>
        `;
    } catch (err) {
        resultsBox.innerHTML = "<p>Topic not found or error occurred </p>";
    }
});

// Quick Search shortcut
document.getElementById("quickSearchBtn").addEventListener("click", () =>{
    const q = document.getElementById("quickSearch").value.trim();
    if(!q) return;

    document.querySelector("[data-view='search']").click();
    document.getElementById("topicQuery").value = q;
    document.getElementById("topicSearchBtn").click();
});

// submit Quiz and Calculate Score
function submitQuiz(){
    if (!window.currentQuiz) return;

    const { questions, topic, quizId } = window.currentQuiz;
    let score = 0;
    let answeredAll = true;
    const results = [];

    questions.forEach((q,i) => {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);

        if (!selected) {
            answeredAll = false;
        }
        else{
            const userAnswer = parseInt(selected.value);
            const isCorrect = userAnswer === q.correct;

            if (isCorrect) score++; 
                
                results.push({
                    question: q.question,
                    userAnswer:q.options[userAnswer],
                    correctAnswer: q.options[q.correct],
                    isCorrect
                });
        }
    });

    // validate all questions answered

    if (!answeredAll) {
        alert("Please answer all questions before submitting!");
        return;
    
    }

    // calculate percentage
    const percentage = Math.round((score / questions.length) * 100);

    //display results
    const resultsDiv = document.getElementById("quizResults");
    resultsDiv.classList.remove("hidden");


    resultsDiv.innerHTML = `
        
    <div class="quiz-score">
            <h3>Quiz Results</h3>
            <div class="score-display">
                <div class="score-circle">
                    <span class="score-number">${percentage}%</span>
                    <span class="score-label">${score} / ${questions.length}</span>
                </div>
            </div>
            <p class="score-message">${getScoreMessage(percentage)}</p>
        </div>
        
        <div class="answers-review">
            <h4>Review Your Answers</h4>
            ${results.map((r, i) => `
                <div class="review-item ${r.isCorrect ? 'correct' : 'incorrect'}">
                    <p class="review-question"><strong>Q${i + 1}:</strong> ${r.question}</p>
                    <p class="review-answer">
                        <span class="label">Your answer:</span> ${r.userAnswer}
                        ${r.isCorrect ? '✓' : '✗'}
                    </p>
                    ${!r.isCorrect ? `
                        <p class="review-correct">
                            <span class="label">Correct answer:</span> ${r.correctAnswer}
                        </p>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        
        <button id="retakeQuizBtn" class="action-btn">Take Another Quiz</button>
    `;

    // save score to backend
    saveQuizScore(quizId, topic, score, questions.length);

    resultsDiv.scrollIntoView({ behavior: 'smooth'});

    document.getElementById("submitQuizBtn").style.display = "none";

    document.getElementById("retakeQuizBtn").addEventListener("click", () => {
      
        document.getElementById("quizTopic").value ="";
        document.getElementById("quizContainer").innerHTML = "";
    });
}

// Get encouraging message based on score
function getScoreMessage(percentage) {
    if (percentage >= 90) return "🎉 Excellent! You've mastered this topic!";
    if (percentage >= 70) return "👍 Great job! You have a solid understanding!";
    if (percentage >= 50) return "👌 Good effort! Review the incorrect answers to improve.";
    return "📚 Keep studying! Review the material and try again.";
}
// save quiz score to backend
async function saveQuizScore(quizId,topic, score,total) {
    try {
        await axios.post("http://localhost:5000/api/dashboard/save-quiz-score",{
            quizId,
            topic,
            score,
            total
        
        }, {
            headers: { "user-id": user.id}
        });
    } catch (err) {
        console.error("Error saving quiz score:", err);
    }
}
// Quiz Generation
document.getElementById("generateQuizBtn").addEventListener("click", async () => {
  const topic = document.getElementById("quizTopic").value.trim();
  const diff = document.getElementById("quizDifficulty").value;
  const container = document.getElementById("quizContainer");

  if(!topic) return;

  container.innerHTML = "<p>Generating quiz...</p>";

  try {
    const res = await axios.post("http://localhost:5000/api/dashboard/generate-quiz", {
        topic,
        difficulty: diff,

    },
    {
        headers: { "user-id": user.id }
    });

    container.innerHTML = "";

// store questions for later scoring
window.currentQuiz = {
    questions: res.data.questions, 
    topic: res.data.topic,
    quizId: res.data.quizId
};
//Render Questions
res.data.questions.forEach((q, i) => {
    container.innerHTML += `
    <div class="question-box">
        <h4>${i + 1}.${q.question}</h4>
        <div class="options">
            ${q.options.map((opt, idx) => `
                <label class="option-label">
                    <input type="radio" name="q${i}" value="${idx}" />
                    <span>${opt}</span>
                </label>

                `).join("")}
            </div>
        </div>
    `;
});

// submit button
container.innerHTML += `

    <button id="submitQuizBtn" class="submit-quiz-btn"> Submit Quiz </button>
    <div id="quizResults" class="quiz-results hidden"></div>
`;

document.getElementById("submitQuizBtn").addEventListener("click", submitQuiz);
  } catch (err) {
    container.innerHTML = "<p>Quiz generation failed </p>";
  }
});

// Planner
const plannerForm = document.getElementById("plannerForm");
const plannerList = document.getElementById("plannerList");
let planner = JSON.parse(localStorage.getItem("planner")) || [];

function renderPlanner() {
    plannerList.innerHTML = "";
    planner.forEach((item, i) => {
        plannerList.innerHTML +=`
        
        <li>
            <strong> ${item.title}</strong> - ${item.date} @ ${item.time}
            <button onclick="deletePlan(${i})">X</button>
            <button onclick="CompletedPlan(${i})">✅</button>
        </li>
        `;
    });
}

window.deletePlan = function(i) {
    planner.splice(i, 1);
    localStorage.setItem("planner", JSON.stringify(planner));
    renderPlanner();
};
    plannerForm.addEventListener("submit", e => {
    e.preventDefault();

    const item = {
        title: document.getElementById("planTitle").value,
        date: document.getElementById("planDate").value,
        time: document.getElementById("planTime").value,
    };

    planner.push(item);
    localStorage.setItem("planner", JSON.stringify(planner));

    plannerForm.reset();
    renderPlanner();

    });

    renderPlanner();
window.CompletedPlan = async function (i) {
    const item = planner[i];

    planner.splice(i, 1);
    localStorage.setItem("planner", JSON.stringify(planner));
    renderPlanner();

    try {
        await axios.post("http://localhost:5000/api/dashboard/complete-plan", 
        {
            title: item.title,
            date: item.date,
            time: item.time,
        },
        {
            headers: { "user-id": user.id }
        });

        alert("Plan marked as completed!");

        loadDashboard(); 
    } 
    catch (err) {
        console.error("Error saving completed plan:", err);
        alert("Failed to update activity");
    }
};


    // SETTINGS
    const settingsForm = document.getElementById("settingsForm");

    settingsForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nickname = document.getElementById("settingsName").value;
        const fav = document.getElementById("favoriteSubject").value;
        const theme = document.getElementById("settingsTheme").value;

        try {
           const response = await axios.post("http://localhost:5000/api/dashboard/settings", {

                display_name:nickname,
                theme,
                preferred_quiz_difficulty: fav  
            },
        {
        headers: {
          "user-id": user.id 
        }
      });
 alert("Settings saved!");
 // exctract user settings
const settings = response.data.data.userSettings;

if(settings.display_name) {
    document.getElementById("usernameSmall").innerHTML = settings.display_name;
}

if (settings.theme ==="dark") {
    document.body.classList.add("dark-theme");
}
else{
    document.body.classList.remove("dark-theme");
}
} catch (err) {
        console.error("Settings save error:", err);
        alert("Error saving settings");
        }
    });
