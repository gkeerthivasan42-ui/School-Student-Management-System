
const API_URL = "http://localhost:5000/api/auth";

// =====================================
// DISPLAY MESSAGE
// =====================================

function showMessage(message, isSuccess = false) {
    const messageElement = document.getElementById("message");

    messageElement.textContent = message;
    messageElement.style.color = isSuccess ? "#15803d" : "#dc2626";
}

// =====================================
// TEACHER REGISTRATION
// =====================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword =
            document.getElementById("confirmPassword").value;

        const button = document.getElementById("registerButton");

        if (password.length < 8) {
            showMessage("Password must contain at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            showMessage("Passwords do not match.");
            return;
        }

        button.disabled = true;
        button.textContent = "Registering...";

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(
                    "Registration successful! Redirecting to login...",
                    true
                );

                registerForm.reset();

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1200);
            } else {
                showMessage(data.message || "Registration failed.");
            }
        } catch (error) {
            console.error("Registration error:", error);

            showMessage(
                "Cannot connect to the server. Check that your backend is running."
            );
        } finally {
            button.disabled = false;
            button.textContent = "Register";
        }
    });
}

// =====================================
// TEACHER LOGIN
// =====================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const button = document.getElementById("loginButton");

        button.disabled = true;
        button.textContent = "Logging in...";

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Save the token for subsequent authenticated requests.
                // This is a basic learning-project approach.
                sessionStorage.setItem("teacherToken", data.token);
                sessionStorage.setItem(
                    "teacher",
                    JSON.stringify(data.teacher)
                );

                showMessage("Login successful!", true);

                setTimeout(() => {
                    window.location.href = "index.html";
                }, 800);
            } else {
                showMessage(data.message || "Login failed.");
            }
        } catch (error) {
            console.error("Login error:", error);

            showMessage(
                "Cannot connect to the server. Check that your backend is running."
            );
        } finally {
            button.disabled = false;
            button.textContent = "Login";
        }
    });
}