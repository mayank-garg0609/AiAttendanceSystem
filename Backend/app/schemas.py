from pydantic import BaseModel
from datetime import date
from typing import Optional,List

class LoginBody(BaseModel):
    email: str
    password: str

class att(BaseModel):
    student_id: int
    course_id: int
    date: date
    present:bool

class User(BaseModel):
    name: str
    email: str
    password: str

class ShowUserProfile(BaseModel):
    student_name: str
    email: str
    class Config:
        from_attributes = True

class TokenData(BaseModel):
    username: Optional[str]=None

class StudentDashboard(BaseModel):
    student_name:str
    student_email:str
    course_ids:List[int]
    course_name: List[str]
    total_classes: List[int]
    present_classes: List[int]

class StudentAttendance(BaseModel):
    date:date
    status:bool

class CourseAttendance(BaseModel):
    student_id:int
    student_name:str
    present:bool
    total_attendance:float

class TeacherDetail(BaseModel):
    faculty_name:str
    faculty_email:str
    course_id:List[int]
    course_name:List[str]

class ResetPassword(BaseModel):
    id: int
    otp: str
    new_password: str

class VerifyOTP(BaseModel):
    id: int
    otp: str

class Email(BaseModel):
    email : str