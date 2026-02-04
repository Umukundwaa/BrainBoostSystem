async function signup() {
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();

    // basic validation
    if (!username || !email || !password) {
        alert("All fields are required!");
        return;
    }

    try {
        const response = await axios.post('http://localhost:5000/api/users/signup', {
            username,
            email,
            password
        });

        alert(response.data.message);
        window.location.href = 'login.html';
    } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || "Signup failed. Try again!");
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

     // basic validation
    if (!email || !password) {
        alert("All fields are required!")
        return;
    }

    try {
        const response = await axios.post('http://localhost:5000/api/users/login', {
            email,
            password
        });

        alert(response.data.message);

        //save user data to localstorage for session
        localStorage.setItem('brainboost_user', JSON.stringify(response.data.user));
        
        window.location.href = 'dashboard.html';

    } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || "Login failed. Try again!")
    }
}

// logout

function logout() {
localStorage.removeItem('user');
window.location.href ='login.html';
}

// check login status
function checkLogin() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href ='login.html';
    }
    return user;
}

function togglePassword(id, icon) {
    const input = document.getElementById(id);

    if (input.type === "password") {
        input.type = "text";
        icon.textContent = "🙈";
    } else {
        input.type = "password";
        icon.textContent = "👁️";
    }
}
