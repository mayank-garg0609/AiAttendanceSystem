// Retrieve authentication token from localStorage
const authToken = localStorage.getItem("authToken");

// Example student ID for testing (used only if localStorage does not have one)
let studentId = parseInt(localStorage.getItem("studentId")) ;  

const API_BASE_URL = "https://aiattendancesystembackend.onrender.com";

// Event listener for page load
document.addEventListener("DOMContentLoaded", () => {
    fetchStudentDashboard();
    updateTime();
});

// Fetch student dashboard details from API
async function fetchStudentDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/student/${studentId}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${authToken}` }
        });

        if (!response.ok) throw new Error("Failed to load student dashboard");

        const data = await response.json();
        console.log("Fetched Student Dashboard Data:", data);
         
        // Populate student details
        document.getElementById("student_name").textContent = data.student_name;
        document.getElementById("student_email").textContent = data.student_email;
        document.getElementById("total-courses").textContent = data.course_ids.length;

        
        // Populate courses dynamically
        // populateCourses(data.course_name, data.total_classes, data.present_classes);
        populateCourses(data.course_name, data.course_ids, data.total_classes, data.present_classes);

    } catch (error) {
        alert(error.message);
    }
}

// Declare chart instance globally
let attendanceChartInstance;

function updateAttendanceChart(courseNames, totalClasses, presentClasses) {
    const ctx = document.getElementById("attendanceChart").getContext("2d");

    // Calculate Attendance Percentages
    const coursePercentages = totalClasses.map((total, index) => 
        total > 0 ? Math.round((presentClasses[index] / total) * 100) : 0
    );

    // Destroy existing chart instance to prevent duplication
    if (attendanceChartInstance) {
        attendanceChartInstance.destroy();
    }

    // Create new bar chart
    attendanceChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: courseNames, // Course Names as Labels
            datasets: [{
                label: "Attendance Percentage",
                data: coursePercentages,
                backgroundColor: coursePercentages.map(p => (p < 75 ? "#ff4d4d" : "#4caf50")), // Red if <75%, Green otherwise
                borderColor: "#ccc",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    mode: "index",
                    intersect: false,
                    callbacks: {
                        label: function (tooltipItem) {
                            return ` ${tooltipItem.raw}%`;
                        }
                    }
                }
            }
        }
    });
}

function populateCourses(courseNames, courseIds, totalClasses, presentClasses) {
    const courseSelector = document.getElementById("course-selector");
    courseSelector.innerHTML = ""; // Clear previous options

    courseNames.forEach((course, index) => {
        const option = document.createElement("option");
        option.value = courseIds[index]; // ✅ Correct: Store Course ID
        option.textContent = course; // Show course name in dropdown
        courseSelector.appendChild(option);
    });

    // Fetch attendance for the first course by default
    if (courseIds.length > 0) {
        fetchAttendance(courseIds[0]);  // ✅ Correct: Sending integer Course ID
    }

    courseSelector.addEventListener("change", (e) => {
        fetchAttendance(parseInt(e.target.value, 10)); // Ensure it's an integer
    });

    updateLowAttendanceWarning(courseNames, totalClasses, presentClasses);
    updateAttendanceChart(courseNames, totalClasses, presentClasses);
}

async function fetchAttendance(courseId) {
    try {
        courseId = parseInt(courseId, 10);
        if (isNaN(courseId)) throw new Error("Invalid course ID. Expected an integer.");

        console.log("Fetching attendance for:", studentId, courseId);

        const response = await fetch(`${API_BASE_URL}/student/${studentId}/${courseId}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${authToken}` }
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Failed to load attendance data: ${errorMessage}`);
        }

        const attendanceData = await response.json();
        console.log(`Attendance Data for ${courseId}:`, attendanceData);

        // ✅ Get course name from dropdown
        const courseName = document.querySelector(`#course-selector option[value="${courseId}"]`).textContent;

        // ✅ Call the updated function with courseId & courseName
        updateAttendanceTable(attendanceData, courseId, courseName);

    } catch (error) {
        console.error("Error fetching attendance:", error);
        alert(error.message);
    }
}

function updateAttendanceTable(attendanceData, courseId, courseName) {
    const attendanceTable = document.querySelector("#attendance-table tbody");
    attendanceTable.innerHTML = ""; // Clear previous records

    if (attendanceData.length === 0) {
        attendanceTable.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">❌ No attendance records found.</td></tr>`;
        return;
    }

    attendanceData.forEach(record => {
        const row = `
            <tr>
                <td>${courseId}</td>
                <td>${courseName}</td>
                <td>${record.date}</td>
                <td>${record.status ? "✅ Present" : "❌ Absent"}</td>
            </tr>
        `;
        attendanceTable.innerHTML += row;
    });
}


// Update low attendance warning dynamically
function updateLowAttendanceWarning(courseNames, totalClasses, presentClasses) {
    let lowAttendanceCount = 0;
    courseNames.forEach((_, index) => {
        const percentage = Math.round((presentClasses[index] / totalClasses[index]) * 100);
        if (percentage < 75) lowAttendanceCount++;
    });

    document.getElementById("low-attendance-courses").textContent = lowAttendanceCount;
    document.getElementById("attendance-warning").textContent = lowAttendanceCount > 0 
        ? "⚠️ Warning: Some courses have attendance below 75%!" 
        : "";
}

// Update time dynamically
function updateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString();
    document.getElementById('current-date').textContent = now.toLocaleDateString();
    setTimeout(updateTime, 1000);
}

// Logout functionality
document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "../loginpage/login.html";
});


