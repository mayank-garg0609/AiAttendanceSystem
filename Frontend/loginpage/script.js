// Select elements
const loginForm = document.querySelector('form');
const studentBtn = document.querySelector('.student-btn');
const teacherBtn = document.querySelector('.teacher-btn');
const forgotPasswordLink = document.querySelector('.forgot-password');
const passwordBlock = document.getElementById("password-block");
const loginBtn = document.getElementById("login-button");

// User type for login
let userType = null;

// Define API base URL
const API_BASE_URL = "https://aiattendancesystembackend.onrender.com";

// Function to style selected and unselected buttons
function styleSelection(selectedBtn, otherBtn) {
    selectedBtn.style.border = "3px solid black"; 
    selectedBtn.style.opacity = "0.7";
    
    otherBtn.style.border = "1px solid grey";
    otherBtn.style.opacity = "0.4";
}

// Login as Student (User Type = 0)
studentBtn.addEventListener('click', () => {
    userType = 0;
    console.log("Selected Student: userType =", userType);
    styleSelection(studentBtn, teacherBtn);
});

// Login as Teacher (User Type = 1)
teacherBtn.addEventListener('click', () => {
    userType = 1;
    console.log("Selected Teacher: userType =", userType);
    styleSelection(teacherBtn, studentBtn);
});

// Handle form submission
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.querySelector('input[type="email"]').value;
    const password = document.querySelector('input[type="password"]').value;

    document.querySelector('.email-error').innerText = "";
    document.querySelector('.password-error').innerText = "";
    
    let hasError = false;
    
    if (!email) {
        document.querySelector('.email-error').innerText = "Email is required";
        hasError = true;
    }
    
    if (!password) {
        document.querySelector('.password-error').innerText = "Password is required";
        hasError = true;
    }
    
    if (userType === null) {
        document.querySelector('.password-error').innerText = "Please select Student or Teacher";
        hasError = true;
    }
    
    if (hasError) return;
    
    const apiUrl = userType === 0 
        ? `${API_BASE_URL}/login/student`
        : `${API_BASE_URL}/login/faculty`;

    const loginData = { email, password };

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.message || response.status==404?"User does not exit ":"Incorrect Password");

        localStorage.setItem("authToken", result.token);
        localStorage.setItem("userType", userType);

        if (userType === 1) localStorage.setItem("teacherId", result.id);
        if (userType === 0) localStorage.setItem("studentId", result.id);

        console.log("Login response:", result);
        loginForm.reset();

        if (userType === 0) {
            window.location.href = "../student/student.html";
        } else {
            window.location.href = "../teacher/teacher.html";
        }

    } catch (error) {
        console.error("Login error:", error);
        if (error.message.includes("password")) {
            document.querySelector('.password-error').innerText = "Incorrect password";
        } else if (error.message.includes("not found") || error.message.includes("exists")) {
            document.querySelector('.email-error').innerText = "Email not registered";
        } else {
            document.querySelector('.password-error').innerText = error.message;
        }
    }
});

// ========== FORGOT PASSWORD SECTION ==========
const loginFormSection = document.querySelector('.login-form');
const forgotFormSection = document.querySelector('.forgot-form');
const backToLogin = document.querySelector('.back-to-login');
const sendOtpBtn = document.querySelector('.send-otp-btn');
const verifyOtpBtn = document.querySelector('.verify-otp-btn');
const resetPassBtn = document.querySelector('.reset-pass-btn');
const fpStudentBtn = document.querySelector('.fp-student-btn');
const fpTeacherBtn = document.querySelector('.fp-teacher-btn');

const step1 = document.querySelector('.step-1');
const step2 = document.querySelector('.step-2');
const step3 = document.querySelector('.step-3');

let fpUserType = null;
let userId = null;

forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginFormSection.style.display = 'none';
    forgotFormSection.style.display = 'flex';
    fpUserType = null;
    step1.style.display = 'flex';
    step2.style.display = 'none';
    step3.style.display = 'none';
});

backToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    forgotFormSection.style.display = 'none';
    loginFormSection.style.display = 'flex';
    step1.style.display = 'flex';
    step2.style.display = 'none';
    step3.style.display = 'none';
});

fpStudentBtn.addEventListener('click', () => {
    fpUserType = 0;
    styleSelection(fpStudentBtn, fpTeacherBtn);
});

fpTeacherBtn.addEventListener('click', () => {
    fpUserType = 1;
    styleSelection(fpTeacherBtn, fpStudentBtn);
});

sendOtpBtn.addEventListener('click', async () => {
    const email = document.querySelector('.fp-email').value;
    document.querySelector('.fp-email-error').innerText = "";

    if (!email) {
        document.querySelector('.fp-email-error').innerText = "Email is required";
        return;
    }
    
    if (fpUserType === null) {
        document.querySelector('.fp-email-error').innerText = "Please select your role";
        return;
    }
    

    const endpoint = fpUserType === 0 ? '/forgot-password/student' : '/forgot-password/faculty';

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.message || 'Email not found');

        userId = result.id;
        step1.style.display = 'none';
        step2.style.display = 'flex';
        startOTPTimer();

    } catch (error) {
        console.error("Send OTP error:", error);
        document.querySelector('.fp-email-error').innerText = "Email not registered or invalid";
    }
});

verifyOtpBtn.addEventListener('click', async () => {
    const otp = document.querySelector('.fp-otp').value;
    document.querySelector('.fp-otp-error').innerText = "";

    if (!otp) {
        document.querySelector('.fp-otp-error').innerText = "OTP is required";
        return;
    }
    

    try {
        const response = await fetch(`${API_BASE_URL}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, otp })
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'Invalid OTP');
        }

        step2.style.display = 'none';
        step3.style.display = 'flex';

    } catch (error) {
        console.error("Verify OTP error:", error);
        document.querySelector('.fp-otp-error').innerText = "Invalid OTP";
    }
});

const sendAgainBtn = document.querySelector('.send-again-btn');
let otpCooldown = 30;
let countdownInterval = null;

function startOTPTimer() {
    sendAgainBtn.disabled = true;
    sendAgainBtn.textContent = `Send OTP Again (${otpCooldown}s)`;

    countdownInterval = setInterval(() => {
        otpCooldown--;
        sendAgainBtn.textContent = `Send OTP Again (${otpCooldown}s)`;

        if (otpCooldown <= 0) {
            clearInterval(countdownInterval);
            sendAgainBtn.disabled = false;
            sendAgainBtn.textContent = "Send OTP Again";
            otpCooldown = 30;
        }
    }, 1000);
}

sendAgainBtn.addEventListener('click', () => {
    sendOtpBtn.click();
});

resetPassBtn.addEventListener('click', async () => {
    const newPassword = document.querySelector('.fp-new-pass').value;
    const confirmPassword = document.querySelector('.fp-confirm-pass').value;
    document.querySelector('.fp-new-pass-error').innerText = "";
    document.querySelector('.fp-confirm-pass-error').innerText = "";
    
    if (!newPassword) {
        document.querySelector('.fp-new-pass-error').innerText = "Enter new password";
        return;
    }
    
    if (!confirmPassword) {
        document.querySelector('.fp-confirm-pass-error').innerText = "Confirm your password";
        return;
    }
    
    if (newPassword !== confirmPassword) {
        document.querySelector('.fp-confirm-pass-error').innerText = "Passwords do not match";
        return;
    }
    

    try {
        const response = await fetch(`${API_BASE_URL}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, otp: document.querySelector('.fp-otp').value, new_password: newPassword })
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'Reset failed');
        }

        backToLogin.click();

    } catch (error) {
        console.error("Reset Password error:", error);
    }
});
