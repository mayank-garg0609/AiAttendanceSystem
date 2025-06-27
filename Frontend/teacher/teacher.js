const authToken = localStorage.getItem("authToken");
const teacherId = parseInt(localStorage.getItem("teacherId"));
const API_BASE_URL = "https://aiattendancesystembackend.onrender.com";
//changes
let allAttendanceData = [];



document.addEventListener("DOMContentLoaded", () => {
    fetchTeacherData();
    updateTime();

// Search Input Functionality
const searchInput = document.getElementById("search-id");

if (!searchInput) {
    console.error("❌ Element #search-id not found!");
    return;
}

// Log key press
searchInput.addEventListener("keydown", function (event) {
    console.log("Key pressed:", event.key);
});

// Handle search on Enter key
searchInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();

        // Add slight delay to ensure latest input is captured
        setTimeout(() => {
            try {
                const studentId = searchInput.value.trim();
                if (!studentId) {
                    alert("Please enter a Student ID.");
                    return;
                }

                const courseId = getSelectedCourseId();
                if (!courseId) {
                    alert("Please select a course first.");
                    return;
                }

                fetchStudentAttendance(courseId, studentId);
            } catch (error) {
                console.error("⚠️ Error in keypress event:", error);
            }
        }, 50);
    }
});


    // 🔧 Move hamburger menu code here:
    const hamburger = document.getElementById('hamburger-menu');
    const modal = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('close-modal');

    if (hamburger && modal && closeBtn) {
        hamburger.addEventListener('click', () => {
            modal.style.display = 'flex';
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    } else {
        console.error("❌ Hamburger or modal elements not found in DOM.");
    }

    // Optional file upload logic
const classroomImageInput = document.getElementById("classroom-image");
const uploadText = document.getElementById("upload-text");
const dropArea = document.getElementById("drop-area");
const uploadBtn = document.getElementById("process-btn");
const fullscreenResults = document.getElementById("fullscreen-results");
const fullscreenImageGrid = document.getElementById("fullscreen-image-grid");

let selectedFiles = [];

// ✅ Update upload text
function updateUploadText() {
    if (selectedFiles.length > 0) {
        const fileNames = selectedFiles.map(file => file.name).join(", ");
        uploadText.textContent = `${fileNames} (${selectedFiles.length} image${selectedFiles.length > 1 ? 's' : ''})`;
    } else {
        uploadText.textContent = "Click to upload one or more images or drag and drop";
    }
}

// ✅ File input change handler
if (classroomImageInput && uploadText) {
    classroomImageInput.addEventListener("change", function () {
        if (this.files && this.files.length > 0) {
            selectedFiles = [...selectedFiles, ...Array.from(this.files)];
            updateUploadText();
        }
    });
}

// ✅ Drag and Drop support
if (dropArea && classroomImageInput && uploadText) {
    dropArea.addEventListener("click", () => classroomImageInput.click());

    dropArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropArea.classList.add("dragover");
    });

    dropArea.addEventListener("dragleave", () => {
        dropArea.classList.remove("dragover");
    });

    dropArea.addEventListener("drop", (e) => {
        e.preventDefault();
        dropArea.classList.remove("dragover");

        if (e.dataTransfer.files.length > 0) {
            selectedFiles = [...selectedFiles, ...Array.from(e.dataTransfer.files)];
            updateUploadText();
        }
    });
}

// ✅ Upload handler with input disabling
if (uploadBtn) {
    uploadBtn.addEventListener("click", async () => {
        const courseId = getSelectedCourseId();
        if (!courseId) {
            alert("❗ Please select a course first.");
            return;
        }

        if (selectedFiles.length === 0) {
            alert("❗ Please upload at least one image.");
            return;
        }

        uploadBtn.textContent = "Processing...";
        uploadBtn.disabled = true;
        classroomImageInput.disabled = true;
        dropArea.classList.add("disabled");
        dropArea.style.pointerEvents = "none"; // prevent further interaction

        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append("photos", file);
        });

        try {
            const response = await fetch(`${API_BASE_URL}/attendance/add/${courseId}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${authToken}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${errorText}`);
            }

            const data = await response.json();
            console.log("📸 Attendance Detection Response:", data);

            const presentStudents = data["student_ids_present"];
            const images = data["image"];

            if (!Array.isArray(presentStudents) || presentStudents.length === 0) {
                alert("⚠️ No students detected as present.");
            } else {
                alert(`✅ ${presentStudents.length} student(s) detected as present.`);
            }

            // Show image gallery prompt
            const showImages = confirm("Do you want to view the uploaded images?");

            if (showImages) {
                renderImages(images);
            }

            // Reset after upload
            selectedFiles = [];
            updateUploadText();
            classroomImageInput.value = "";

        } catch (error) {
            console.error("❌ Error uploading image:", error.message);
            alert("Error uploading image: " + error.message);
        } finally {
            uploadBtn.textContent = "Process Images";
            uploadBtn.disabled = false;
            classroomImageInput.disabled = false;
            dropArea.classList.remove("disabled");
            dropArea.style.pointerEvents = "auto";
        }
    });
} else {
    console.error("❌ Upload button (#process-btn) not found in DOM.");
}

// ✅ Function to render images
function renderImages(images) {
    fullscreenResults.style.display = "block"; // Show the fullscreen overlay
    fullscreenImageGrid.innerHTML = ""; // Clear any previous images

    images.forEach((image, index) => {
        const imgElement = document.createElement("img");
        imgElement.src = `data:image/jpeg;base64,${image}`;
        imgElement.alt = `Attendance Image ${index + 1}`;
        imgElement.classList.add("attendance-image");
        fullscreenImageGrid.appendChild(imgElement);
    });
}

// ✅ Close fullscreen results
function closeResults() {
    fullscreenResults.style.display = "none"; // Hide the overlay
}


    const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        alert("✅ Successfully logged out!");
        localStorage.clear();
        window.location.href = "../loginpage/login.html";
    });
} else {
    console.error("❌ Logout button (#logout-btn) not found in DOM.");
}

//changes
document.getElementById("sort-options").addEventListener("change", () => {
    const sortOption = document.getElementById("sort-options").value;
    let sortedData = [...allAttendanceData]; // clone the original list

    switch (sortOption) {
        case "name":
            sortedData.sort((a, b) => a.student_name.localeCompare(b.student_name));
            break;
        case "attendance-asc":
            sortedData.sort((a, b) => a.total_attendance - b.total_attendance);
            break;
        case "attendance-desc":
            sortedData.sort((a, b) => b.total_attendance - a.total_attendance);
            break;
        case "less-than-75":
            sortedData = sortedData.filter(s => s.total_attendance < 75);
            break;
        case "id":
        default:
            sortedData.sort((a, b) => a.student_id - b.student_id); // back to default
            break;
    }

    updateAttendanceTable(sortedData);
});


});


// Function to fetch teacher data
async function fetchTeacherData() {
    try {
        const response = await fetch(`${API_BASE_URL}/teacher/${teacherId}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${authToken}` }
        });

        if (!response.ok) throw new Error("Failed to load teacher data");

        const data = await response.json();
        console.log("API Response:", data);

        document.getElementById("faculty_name").textContent = data.faculty_name;
        document.getElementById("faculty_email").textContent = data.faculty_email;

        populateTeacherCourses(data.course_id, data.course_name);
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

// Function to populate dropdown and fetch attendance when a course is selected
function populateTeacherCourses(courseIds, courseNames) {
    const courseDropdown = document.getElementById("courseDropdown");
    courseDropdown.innerHTML = "<option value=''>Select a Course</option>";

    if (!Array.isArray(courseIds) || !Array.isArray(courseNames) || courseIds.length !== courseNames.length) {
        console.error("Invalid course data:", courseIds, courseNames);
        return;
    }

    courseIds.forEach((courseId, index) => {
        const option = document.createElement("option");
        option.value = courseId;
        option.textContent = `${courseNames[index]} - ID: ${courseId}`;
        courseDropdown.appendChild(option);
    });

    // ✅ Automatically select the first course
    if (courseIds.length > 0) {
        courseDropdown.value = courseIds[0]; // select first course
        fetchCourseAttendance(courseIds[0]); // fetch its attendance
    }

    // Automatically fetch attendance when a course is changed
    courseDropdown.addEventListener("change", function () {
        const selectedCourseId = getSelectedCourseId(); // Fetch course ID dynamically
        if (selectedCourseId) {
            fetchCourseAttendance(selectedCourseId);
        }
    });
}


// Function to fetch course attendance summary
// async function fetchCourseAttendance(courseId) {
//     try {
//         console.log(`Fetching attendance summary for Course ID: ${courseId}`);

//         const response = await fetch(`${API_BASE_URL}/teacher/course/${courseId}`, {
//             method: "GET",
//             headers: { "Authorization": `Bearer ${authToken}` }
//         });

//         if (!response.ok) throw new Error("Failed to load attendance data");

//         const data = await response.json();
//         console.log("Attendance Data:", data);

//         document.getElementById("total_student").textContent = data.total_student;

//         if (Array.isArray(data.present) && data.present.length > 0) {
//             const todayPresent = data.present[0]; // Today's attendance
//             const yesterdayPresent = data.present[1] ?? todayPresent; // Yesterday's attendance (fallback to today if not available)

//             const totalStudents = data.total_student;
//             const todayAbsent = totalStudents - todayPresent;
//             const yesterdayAbsent = totalStudents - yesterdayPresent;

//             document.getElementById("present").textContent = todayPresent;
//             document.getElementById("absent").textContent = todayAbsent;

//             updateAttendanceStats(todayPresent, yesterdayPresent, todayAbsent, yesterdayAbsent);

//             // ✅ Calculate attendance percentage and round values
//             if (Array.isArray(data.present) && Array.isArray(data.date)) {
//                 const attendanceRates = data.present.map(presentCount =>
//                     parseFloat(((presentCount / totalStudents) * 100).toFixed(2))
//                 );
            
//                 updateAttendanceChart(data.date, attendanceRates);
//             }
            
//              else {
//                 console.error("Invalid chart data format:", data);
//             }
//         } else {
//             console.error("Invalid attendance data format:", data);
//         }
//     } catch (error) {
//         console.error("Error fetching course attendance:", error.message);
//         alert(error.message);
//     }
// }


async function fetchCourseAttendance(courseId) {
    try {
        console.log(`Fetching attendance summary for Course ID: ${courseId}`);

        const response = await fetch(`${API_BASE_URL}/teacher/course/${courseId}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${authToken}` }
        });

        if (!response.ok) throw new Error("Failed to load attendance data");

        const data = await response.json();
        console.log("Attendance Data:", data);

        document.getElementById("total_student").textContent = data.total_student;

        if (Array.isArray(data.present) && data.present.length > 0) {
            const totalStudents = data.total_student;

            const todayIndex = data.present.length - 1;
            const yesterdayIndex = todayIndex - 1;

            const todayPresent = data.present[todayIndex];
            const yesterdayPresent = data.present[yesterdayIndex] ?? todayPresent;

            const todayAbsent = totalStudents - todayPresent;
            const yesterdayAbsent = totalStudents - yesterdayPresent;

            document.getElementById("present").textContent = todayPresent;
            document.getElementById("absent").textContent = todayAbsent;

            updateAttendanceStats(todayPresent, yesterdayPresent, todayAbsent, yesterdayAbsent);

            // ✅ Calculate attendance percentage and round values
            if (Array.isArray(data.present) && Array.isArray(data.date)) {
                const attendanceRates = data.present.map(presentCount =>
                    parseFloat(((presentCount / totalStudents) * 100).toFixed(2))
                );

                updateAttendanceChart(data.date, attendanceRates);
            } else {
                console.error("Invalid chart data format:", data);
            }
        } else {
            console.error("Invalid attendance data format:", data);
        }
    } catch (error) {
        console.error("Error fetching course attendance:", error.message);
        alert(error.message);
    }
}


// Function to update attendance stats (percentage change)
function updateAttendanceStats(todayPresent, yesterdayPresent, todayAbsent, yesterdayAbsent) {
    const presentChange = calculatePercentageChange(todayPresent, yesterdayPresent);
    const absentChange = calculatePercentageChange(todayAbsent, yesterdayAbsent);

    document.getElementById("pre_percent").innerHTML = presentChange.includes("-") 
        ? `🔻 ${presentChange} Less than yesterday` 
        : `🟢 ${presentChange} Increase than yesterday`;

    document.getElementById("ab_percent").innerHTML = absentChange.includes("-") 
        ? `🔻 ${absentChange} Less than yesterday` 
        : `🟢 ${absentChange} Increase than yesterday`;
}

// Function to calculate percentage change between today and yesterday
function calculatePercentageChange(today, yesterday) {
    if (yesterday === 0) return today === 0 ? "0%" : "100%"; // Avoid division by zero
    const change = ((today - yesterday) / yesterday) * 100;
    return change.toFixed(2) + "%";
}

function getFormattedDate() {
    const dateInput = document.getElementById("date").value;
    if (!dateInput) {
        alert("Please select a valid date.");
        return null;
    }
    const formattedDate = new Date(dateInput).toISOString().split("T")[0]; // Convert to YYYY-MM-DD
    console.log("Formatted Date: ", formattedDate); // Log the formatted date
    return formattedDate;
}


function getSelectedCourseId() {
    const courseDropdown = document.getElementById("courseDropdown");

    if (!courseDropdown) {
        console.error("❌ Course dropdown element not found!");
        return null;
    }
    
    const selectedCourseId = courseDropdown.value;
    console.log("✅ getSelectedCourseId() fetched:", selectedCourseId);  // Debugging line

    if (!selectedCourseId) {
        console.error("❌ No course selected.");
        return null;
    }

    return parseInt(selectedCourseId);
}


// Function to fetch attendance details based on selected date
async function fetchAttendanceDetails(courseId) {
    const selectedDate = getFormattedDate();
    if (!selectedDate) return; // Prevent API call if the date is invalid

    console.log(`Fetching attendance for Course ID: ${courseId}, Date: ${selectedDate}`);

    try {
        const response = await fetch(`${API_BASE_URL}/teacher/${courseId}/${selectedDate}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${authToken}` }
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Failed to load student attendance details: ${errorMessage}`);
        }

        const data = await response.json();
        console.log("Student Attendance Data:", data);

        updateAttendanceTable(data);
    } catch (error) {
        console.error("Error fetching attendance details:", error.message);
        alert(error.message);
    }
}

// Function to update attendance when date is selected
function onDateChange() {
    const courseId = getSelectedCourseId(); // Fetch dynamically if applicable
    if (!courseId) {
        alert("Invalid course ID");
        return;
    }
    fetchAttendanceDetails(courseId);
}

document.getElementById("date").addEventListener("change", onDateChange);


function updateAttendanceTable(studentList) {
    allAttendanceData = studentList; // ✅ Save data for search/sort

    const tableBody = document.getElementById("attendance-table").querySelector("tbody");
    tableBody.innerHTML = ""; // Clear existing data

    if (!Array.isArray(studentList) || studentList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5">No data available</td></tr>`;
        return;
    }

    studentList.forEach(student => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>2023uai${student.student_id}</td>
            <td>${student.student_name}</td>
            <td>${getFormattedDate()}</td>
            <td>${student.present ? "✅ Yes" : "❌ No"}</td>
            <td>${(student.total_attendance)}%</td>
        `;
        tableBody.appendChild(row);
    });
}



// Chart configuration
const ctx = document.getElementById("attendanceChart").getContext("2d");
let attendanceChart = new Chart(ctx, {
    type: "line",
    data: {
        labels: [],
        datasets: [{
            label: "Attendance Rate",
            data: [],
            borderColor: "#4A90E2",
            backgroundColor: "rgba(74, 144, 226, 0.1)",
            fill: true
        }]
    },
    options: {
        scales: {
            y: { beginAtZero: true }
        }
    }
});

// Update attendance chart
function updateAttendanceChart(dates, attendanceRates) {
    attendanceChart.data.labels = dates.map(date => new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short"
    }));

    attendanceChart.data.datasets[0].data = attendanceRates;
    attendanceChart.update();
}


// Event listener for course search
document.getElementById("course-search").addEventListener("change", function() {
    const selectedCourse = this.value.trim();
    if (selectedCourse) {
        fetchCourseAttendance(selectedCourse);

        // If a date is already selected, fetch attendance details too
        const selectedDate = document.getElementById("date").value;
        if (selectedDate) {
            fetchAttendanceDetails(selectedCourse, selectedDate);
        }
    }
});

// Event listener for date change
document.getElementById("date").addEventListener("change", function() {
    const selectedDate = this.value;
    const courseId = document.getElementById("course-search").value.trim();

    if (!courseId) {
        alert("Please select a course first.");
        return;
    }

    fetchAttendanceDetails(courseId, selectedDate);
});

// Update current time
function updateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString();
    document.getElementById('current-date').textContent = now.toLocaleDateString();
    setTimeout(updateTime, 1000);
}

// // Logout handler
// document.getElementById("logout-btn").addEventListener("click", () => {
//     alert("✅ Successfully logged out!");
//     localStorage.clear();
//     window.location.href = "../login page/login.html";
// });



async function fetchStudentAttendance(courseId, studentId) {
    try {
        console.log(`Fetching attendance for Student ID: ${studentId} in Course ID: ${courseId}`);

        const response = await fetch(`${API_BASE_URL}/teacher/${courseId}/student/${studentId}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${authToken}` }
        });

        console.log("API Response Status:", response.status);

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Failed to load student attendance: ${errorMessage}`);
        }

        const data = await response.json();
        console.log("Student Attendance Data:", data);

        updateAttendanceTableForStudent(data,studentId);
    } catch (error) {
        console.error("Error fetching student attendance:", error.message);
        alert(error.message);
    }
}


function updateAttendanceTableForStudent(data,studentId) {
    const tableBody = document.getElementById("attendance-table").querySelector("tbody");
    tableBody.innerHTML = ""; // Clear existing table data

    // Check if valid data is received
    if (!Array.isArray(data.date) || data.date.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5">No attendance data available for this student</td></tr>`; // colspan changed to 5
        return;
    }

    // Loop through each attendance record
    data.date.forEach((date, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>2023uai${studentId}</td> <!-- Added Student ID Column -->
            <td>${data.student_name}</td>
            <td>${date}</td>
            <td>${data.present[index] ? "✅ Yes" : "❌ No"}</td>
            <td>${data.total_attendance}%</td> 
        `;
        tableBody.appendChild(row);
    });
}


function closeResults() {
    const overlay = document.getElementById("fullscreen-results");
    overlay.classList.add("hidden");
    setTimeout(() => {
        overlay.style.display = "none";
        overlay.classList.remove("hidden");
    }, 300); // match with transition duration
}
// Close the overlay when clicking outside images
document.getElementById("fullscreen-results").addEventListener("click", function (e) {
    const isImage = e.target.tagName.toLowerCase() === 'img';
    const isCloseBtn = e.target.classList.contains('close-results-btn');

    // Only close if not clicking on an image or close button
    if (!isImage && !isCloseBtn) {
        closeResults();
    }
});