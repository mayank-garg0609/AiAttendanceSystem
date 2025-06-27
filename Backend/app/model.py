from app.database import Base

from sqlalchemy import Column, Integer, String, Text, Boolean, Date, Time, ForeignKey


class Student(Base):
    __tablename__ = 'student'
    student_id = Column(Integer, primary_key=True, index=True,autoincrement=True)
    student_name = Column(String(50))
    email = Column(String(25),unique=True)
    password = Column(Text)
    department_id = Column(Integer, ForeignKey('department.department_id'))

class Faculty(Base):
    __tablename__ = 'faculty'
    faculty_id = Column(Integer, primary_key=True, index=True)
    faculty_name = Column(Text)
    email = Column(Text)
    password = Column(Text)
    department_id = Column(Integer, ForeignKey('department.department_id'))

class Department(Base):
    __tablename__ = 'department'
    department_id = Column(Integer, primary_key=True, index=True)
    department_name = Column(Text)

class Course(Base):
    __tablename__ = 'course'
    course_id = Column(Integer, primary_key=True, index=True)
    course_name = Column(Text)
    department_id = Column(Integer, ForeignKey('department.department_id'))
    credits = Column(Integer)

class Enrollment(Base):
    __tablename__ = 'enrollment'
    enrollment_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey('student.student_id'))
    course_id = Column(Integer, ForeignKey('course.course_id'))
    # year = Column(Text)
    semester = Column(Integer)

class Attendance(Base):
    __tablename__ = 'attendance'
    attendance_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey('student.student_id'))
    course_id = Column(Integer, ForeignKey('course.course_id'))
    date = Column(Date)
    present = Column(Boolean)

class CourseAssign(Base):
    __tablename__ = 'course_assign'
    schedule_id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey('course.course_id'))
    faculty_id = Column(Integer, ForeignKey('faculty.faculty_id'))

# class ClassroomPhoto(Base):
#     __tablename__ = 'classroom_photo'
#     id = Column(Integer, primary_key=True, index=True)
#     classroom_photo_url = Column(Text)
#     course_id = Column(Integer, ForeignKey('course.course_id'))
