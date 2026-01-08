# Learning Management System (LMS)

This application allows students to access learning materials and complete quizzes, while teachers can upload course materials and create and manage quizzes.  
The system uses **Prisma ORM** to interact with the database and **PostgreSQL** as the database management system.  
The frontend is built using **React (Vite)** for fast development and optimized performance.

We will be using **npm**.

## Features

### Authentication & Authorization
- User registration and login
- Role-based access control (Student / Teacher)
- Secure authentication using JWT

### Student Features
- View and download learning materials
- Access course content by subject or class
- Take quizzes and submit answers
- View quiz results and scores
- Track quiz completion history

### Teacher Features
- Upload, update, and delete learning materials
- Create, edit, and delete quizzes
- Manage quiz questions and answers
- Set quiz availability and time limits
- View student submissions and scores

### Quiz Management
- Multiple-choice quizzes
- Automatic grading
- Score calculation and result storage
- Quiz attempt tracking

### Backend & Database
- PostgreSQL database
- Prisma ORM for database modeling and queries
- Relational data management (Users, Courses, Materials, Quizzes, Results)

### Frontend
- React with Vite
- Component-based UI
- Responsive design
- API integration with backend services

### Additional Features
- Error handling and validation
- Loading and empty-state handling
- Clean and modular project structure
