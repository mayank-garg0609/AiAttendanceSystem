from fastapi import FastAPI, Depends, status, HTTPException, File, UploadFile, Form
from fastapi.responses import FileResponse ,JSONResponse
from typing import List, Optional
import csv
from sqlalchemy import func , desc
from app import model, schemas, token, oauth2
from app.database import engine, SessionLocal
from sqlalchemy.orm import Session
from datetime import date
import uvicorn
import requests
from fastapi.middleware.cors import CORSMiddleware
import random
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta, timezone
import base64
from PIL import Image
from gradio_client import Client, handle_file
import tempfile
import os
from io import BytesIO
import base64

otp_store={}

app = FastAPI()

AI_MODEL_URL = "https://mayankgarg0609-aiattendance.hf.space"

model.Base.metadata.create_all(bind=engine)

# @app.on_event("startup")
# async def startup():
#     init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to restrict origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Depends(get_db)

def image_to_base64(image_path:str )-> str:
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

@app.get("/")
def index():
    return {"message": "Api working"}

@app.post("/attendance/add/{course_id}")
async def mark_attendance(course_id: int, photos: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    try:
        # Read image bytes
        images =[]
        student_ids_present = []
        client = Client(AI_MODEL_URL)
        for photo in photos:

            file_content = await photo.read()

            # Create a secure temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
                temp_file.write(file_content)
                temp_file_path = temp_file.name
                temp_file.close()

            # Call Gradio API hosted on Hugging Face
        
            result = client.predict(
                image=handle_file(temp_file_path),
                api_name="/predict"
            )
            generated_image_path = result[1]
            student_ids_present.extend(result[0]) 
            
            # Convert image to base64
            image = image_to_base64(generated_image_path)

            images.append(image)

        # remove duplicate student ids 
        student_ids_present = list(set(student_ids_present))

        # return FileResponse(generated_image_path, media_type="image/webp")
        if not student_ids_present:
            raise HTTPException(status_code=404, detail="No students recognized in the image")
        
        now_utc = datetime.now(timezone.utc)
        today = now_utc.date()

        enrolled_students = db.query(model.Enrollment).filter(
            model.Enrollment.course_id == course_id
        ).all()
        
        for student in enrolled_students:
            existing_attendance = db.query(model.Attendance).filter(
                model.Attendance.student_id == student.student_id,
                model.Attendance.course_id == course_id,
                model.Attendance.date == today
            ).first()

            if existing_attendance:
                if student.student_id in student_ids_present:
                    existing_attendance.present = True
            else:

                is_present = student.student_id in student_ids_present
                new_attendance = model.Attendance(
                    student_id=student.student_id,
                    course_id=course_id,
                    date=today,
                    present=is_present
                )
                db.add(new_attendance)

        db.commit()

        return JSONResponse(content={"student_ids_present":student_ids_present,"image":images}, status_code=200) 
         

    except Exception as e:
        print("Error in mark_attendance:", str(e))
        raise HTTPException(status_code=500, detail=f"AI Model failed to process the image: {str(e)} ")

    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.post("/login/student")
async def login(request:schemas.LoginBody, db: Session = Depends(get_db)):
    user=db.query(model.Student).filter(model.Student.email == request.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"User with email {request.email} is not available")
    if not user.password==request.password:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    access_token=token.create_access_token(data={"sub": user.email, "role": "student"})
    return {"access_token": access_token,"token_type": "bearer", "id":user.student_id}

@app.post("/login/faculty")
async def login(request:schemas.LoginBody, db: Session = Depends(get_db)):
    user=db.query(model.Faculty).filter(model.Faculty.email == request.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"User with email {request.email} is not available")
    if not user.password==request.password:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    access_token=token.create_access_token(data={"sub": user.email, "role": "student"})
    return {"access_token": access_token,"token_type": "bearer", "id":user.faculty_id}

def generate_otp() -> str:
    return str(random.randint(100000, 999999))  # 6-digit OTP

def send_otp_email(email: str, otp: str):
    send_email = "mayankgarg0609@gmail.com"
    password = "kryemieneejeysws"
    msg = MIMEText(f"Your OTP for password reset is: {otp}. It is valid for 10 minutes.")
    msg["Subject"] = "Password Reset OTP"
    msg["From"] = "MNIT@mnit.ac.in"
    msg["To"] = email

    # Send email (Replace with real SMTP server)
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(send_email, password)
            server.sendmail(send_email, email, msg.as_string())
    except Exception as e:
        print(f"Error sending email: {e}")


@app.post("/forgot-password/student")
async def forgot_password(request:schemas.Email, db: Session = Depends(get_db)):
    email = request.email

    user=db.query(model.Student).filter(model.Student.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"User with email {request.email} is not available")

    otp = generate_otp()
    expiry = datetime.now(timezone.utc) + timedelta(minutes=10)  # OTP valid for 10 minutes
    otp_store[user.student_id] = {"otp": otp, "expiry": expiry}

    send_otp_email(email, otp)
    return {"id": user.student_id}

@app.post("/forgot-password/faculty")
async def forgot_password(request:schemas.Email, db: Session = Depends(get_db)):
    email = request.email

    user=db.query(model.Faculty).filter(model.Faculty.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"User with email {request.email} is not available")

    otp = generate_otp()
    expiry = datetime.utcnow() + timedelta(minutes=10)  # OTP valid for 5 minutes
    otp_store[user.faculty_id] = {"otp": otp, "expiry": expiry}

    send_otp_email(email, otp)
    return {"id": user.faculty_id}


@app.post("/verify-otp")
async def reset_password(request: schemas.VerifyOTP,  db: Session = Depends(get_db)):

    otp_data = otp_store[request.id]

    # Check if OTP is expired
    if datetime.utcnow() > otp_data["expiry"]:
        del otp_store[request.id]
        raise HTTPException(status_code=401, detail="OTP expired")

    # Validate OTP
    if request.otp != otp_data["otp"]:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    raise HTTPException(status_code=200, detail="OTP verified successfully")

@app.post("/reset-password")
async def reset_password(request: schemas.ResetPassword,  db: Session = Depends(get_db)):

    if request.id not in otp_store:
        raise HTTPException(status_code=400, detail="Illegal access")

    otp_data = otp_store[request.id]

    # Validate OTP
    if request.otp != otp_data["otp"]:
        raise HTTPException(status_code=400, detail="Illegal access")

    # Update password
    user= db.query(model.Student).filter(model.Student.student_id == request.id).update({"password": request.new_password})
    db.commit()
    # Remove OTP after successful reset
    del otp_store[request.id]

    raise HTTPException(status_code=200, detail="Password reset successfully")


@app.get("/student/{student_id}", response_model=schemas.StudentDashboard)
async def get_student_dashboard(student_id: int, db: Session = Depends(get_db)):
    # Get all courses for the student
    enrollments = db.query(model.Enrollment).filter(model.Enrollment.student_id == student_id).all()
    user=db.query(model.Student).filter(model.Student.student_id == student_id).first()

    course_ids=[]
    course_names = []
    total_classes_list = []
    present_classes_list = []
    for enrollment in enrollments:
        # course_id = enrollment.course_id
        
        course=db.query(model.Course).filter(model.Course.course_id==enrollment.course_id).first()

        # Get total and present classes
        total_classes = db.query(model.Attendance).filter(
            model.Attendance.course_id == course.course_id,
            model.Attendance.student_id == student_id
        ).count()
        
        present_classes = db.query(model.Attendance).filter(
            model.Attendance.course_id == course.course_id,
            model.Attendance.student_id == student_id,
            model.Attendance.present == True
        ).count()
        
        course_ids.append(course.course_id)
        course_names.append(course.course_name)
        total_classes_list.append(total_classes)
        present_classes_list.append(present_classes)
    
    return schemas.StudentDashboard(
        student_name=user.student_name,
        student_email=user.email,
        course_ids=course_ids,
        course_name=course_names,
        total_classes=total_classes_list,
        present_classes=present_classes_list
    )

@app.get("/student/{student_id}/{course_id}", response_model=List[schemas.StudentAttendance])
async def get_attendance_details(student_id: int, course_id: int, db: Session = Depends(get_db)):
    
    course = db.query(model.Course).filter(model.Course.course_id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    attendances = db.query(model.Attendance).filter(
        model.Attendance.student_id == student_id,
        model.Attendance.course_id == course_id
    ).all()
    
    details = [{
        "date": attendance.date,
        "status": attendance.present
    } for attendance in attendances]
    
    return details

@app.get("/teacher/{teacher_id}",response_model=schemas.TeacherDetail)
async def get_teacher_dashboard(teacher_id: int, db:Session= Depends(get_db)):
    user=db.query(model.Faculty).filter(model.Faculty.faculty_id == teacher_id).first()
    
    course_id=[]
    course_name=[]
    #admin
    if user.department_id == 0:
        # Get all courses
        courses = db.query(model.Course).all()
        course_id = [course.course_id for course in courses]  # List comprehension for efficiency
        course_name = [course.course_name for course in courses]
    else:
        # Get courses assigned to a specific faculty
        assigned_courses = db.query(model.CourseAssign).filter(
            model.CourseAssign.faculty_id == teacher_id
        ).all()

        course_id = [course.course_id for course in assigned_courses]
        
        # Fetch course names for assigned course IDs
        course_name = [
            db.query(model.Course).filter(model.Course.course_id == cid).first().course_name
            for cid in course_id
        ]
    return {
        "faculty_name": user.faculty_name,
        "faculty_email": user.email,
        "course_id": course_id,
        "course_name":course_name
    }

@app.get("/teacher/course/{course_id}")
async def get_course_attendance(course_id: int, db: Session = Depends(get_db)):
    total_students = db.query(model.Enrollment).filter(
        model.Enrollment.course_id == course_id
    ).count()

    # Fetch the last 7 days of attendance (latest first)
    attendance_records = (
        db.query(model.Attendance.date, func.count(model.Attendance.student_id).label("present"))
        .filter(model.Attendance.course_id == course_id, model.Attendance.present == True)
        .group_by(model.Attendance.date)
        .order_by(desc(model.Attendance.date))
        .limit(7)
        .all()
    )

    if not attendance_records:
        return {"error": "Attendance data not found for this course"}

    # Extract dates and present counts
    dates, present_counts = zip(*attendance_records) if attendance_records else ([], [])

    # Reverse lists to make latest at index 6
    dates, present_counts = list(dates[::-1]), list(present_counts[::-1])

    return {
        "total_student": total_students,
        "present": present_counts,
        "date": dates
    }

@app.get("/teacher/{course_id}/student/{student_id}")
async def get_attendance_by_date(course_id: int, student_id: int, db: Session = Depends(get_db)):

    # Fetch attendance records sorted by date (latest first)
    attendances = db.query(model.Attendance).filter(
        model.Attendance.course_id == course_id,
        model.Attendance.student_id == student_id
    ).order_by(desc(model.Attendance.date)).all()  # Sorting by date DESC

    if not attendances:
        raise HTTPException(
            status_code=404,
            detail="No attendance records found for this student ID."
        )

    total_classes = len(attendances)

    # Fetch student details
    user = db.query(model.Student).filter(model.Student.student_id == student_id).first()

    # Count total present classes
    present_classes = db.query(model.Attendance).filter(
        model.Attendance.course_id == course_id,
        model.Attendance.student_id == student_id,
        model.Attendance.present == True
    ).count()

    # Extract present statuses and dates (already sorted)
    presents = [attendance.present for attendance in attendances]
    dates = [attendance.date for attendance in attendances]

    return {
        "student_name": user.student_name,
        "total_attendance": round((present_classes / total_classes) * 100, 2) if total_classes != 0 else 0,
        "present": presents,  # Latest date at index 0
        "date": dates  # Latest date at index 0
    }

@app.get("/teacher/{course_id}/{attendance_date}",  response_model=List[schemas.CourseAttendance])
async def get_attendance_by_date(course_id: int, attendance_date: date, db: Session = Depends(get_db)):

    # Fetch attendance records for the given date
    attendances = db.query(model.Attendance).filter(
        model.Attendance.course_id == course_id,
        model.Attendance.date == attendance_date
    ).all()

    if not attendances:
        raise HTTPException(
            status_code=404,
            detail="No attendance records found for this date."
        )

    details = []
    for attendance in attendances:
        user = db.query(model.Student).filter(model.Student.student_id == attendance.student_id).first()

        # Get total and present classes for the student
        total_classes = db.query(model.Attendance).filter(
            model.Attendance.course_id == course_id,
            model.Attendance.student_id == attendance.student_id
        ).count()

        present_classes = db.query(model.Attendance).filter(
            model.Attendance.course_id == course_id,
            model.Attendance.student_id == attendance.student_id,
            model.Attendance.present == True
        ).count()

        details.append({
            "student_id": attendance.student_id,
            "present": attendance.present,
            "student_name": user.student_name,
            "total_attendance": round((present_classes / total_classes) * 100, 2) if total_classes != 0 else 0
        })

    # Sort the list by student_id in ascending order
    details.sort(key=lambda x: x["student_id"])

    return details

@app.post("/upload-csv/")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")

    try:
        content = await file.read()
        decoded_content = content.decode('utf-8').splitlines()

        csv_reader = csv.DictReader(decoded_content)
        
        for row in csv_reader:
            # attendance_entry = model.Enrollment(
            #     student_id=row['student_id'],
            # )
            # db.add(attendance_entry)

            user= db.query(model.Student).filter(model.Student.student_id == row["student_id"]).update({"email": row["email"]})

        db.commit()
        return {"message": "CSV file successfully uploaded and data added to the database."}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing CSV file: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
