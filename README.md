# AI-Based Student Attendance System using Face Recognition


![Poster](./poster_presentation.jpg)

---

## 🌐 Live Demo

🔗 **Website:** [MNIT Attendance System](https://mayank-garg0609.github.io/mnit-attendance/loginpage/login.html)

- 👨‍🏫 **Email :** `2023uai1797@mnit.ac.in`
- 🔐 **Password:** `1234`

> You can log in as either a **teacher** or a **student** using the same credentials:

---


## 👩‍🏫 Project Overview

This project implements an **Automated Attendance System** that utilizes **facial recognition technology** to streamline attendance management in classrooms. Instead of traditional manual roll calls, the system automatically detects and identifies students from uploaded classroom images and logs attendance securely in a web-based dashboard.


---

## 🎯 Objectives

- Replace manual attendance methods with an automated, real-time solution.
- Achieve accurate and fast face recognition using deep learning.
- Build an integrated system including:
  - AI model
  - FastAPI backend
  - PostgreSQL database
  - Web frontend with dashboards for students and teachers

---

## 🧠 Core Technologies

### 🔍 Face Recognition
- **Model:** [VGG-Face](https://sefiks.com/2020/07/25/deep-face-recognition-with-vgg-face-in-keras/) from the DeepFace library
- **Detection:** MTCNN for multi-face detection
- **Recognition:** Facial embeddings stored and matched using **KDTree**

### 🛠 Tech Stack

| Layer     | Technology       |
|-----------|------------------|
| AI Model  | Hugging Face Spaces (DeepFace + VGG-Face) |
| Backend   | Python 3.8+, FastAPI, SQLAlchemy |
| Frontend  | HTML, CSS, JavaScript |
| Database  | PostgreSQL (Neon Console) |
| DevOps    | GitHub, Netlify, Render, UptimeRobot |

---
 

## 💡 Features

- Student registration via CSV
- Role-based login (Teacher, Student)
- Upload class image and get attendance instantly
- Real-time dashboards:
  - 📊 Teachers: Attendance reports, upload images
  - 🎓 Students: Personal attendance history
- Password reset with OTP verification
- Secure API communication via HTTPS and password hashing

---

## ⚙️ API Endpoints (Sample)

- `POST /attendance/add/{course_id}` - Upload classroom image
- `GET /student/{id}` - Fetch student attendance
- `GET /teacher/{id}` - Fetch teacher dashboard
- `POST /login/teacher` / `/login/student` - Login endpoint
- `POST /forgot-password/student` - OTP-based reset

---

## 🧪 Testing & Performance

| Metric        | Result                      |
|---------------|-----------------------------|
| Accuracy      | ~90% (higher in well-lit)   |
| Recognition Time | 10–15 seconds w/o GPU     |
| Stability     | Smooth UX, no major bugs    |

> Note: System performance varies with lighting, occlusion (masks), and student orientation.

---

## 🚀 Deployment

| Component   | Platform        |
|-------------|-----------------|
| AI Model    | Hugging Face    |
| Backend     | Render          |
| Frontend    | Netlify         |
| Database    | Neon Console    |

> GitHub CI/CD handles auto-deployment to Netlify and Render. UptimeRobot is used for monitoring uptime.

---

## 🧩 Challenges

- Face recognition degraded in low-light or obstructed views
- Lag in real-time processing initially resolved by optimization
- Side-angle or non-front faces reduced matching accuracy

---

## 🔮 Future Enhancements

- Improve robustness for occluded and side-angled faces
- Add real-time video attendance capability
- Explore lightweight models for faster processing
