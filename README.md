# Doctor Report Automation

## Overview
This project automates a manual health checkup process by managing five departmental dashboards and generating a complete medical report. The departments include:
- IT (captures photo and general details)
- ENT
- Vision
- General
- Dental

Each dashboard (accessed via individual URLs) manages its own department’s fields. A full submission from all departments is required before generating the final report.

## Requirements
Before running this project, ensure you have:
- Python 3.8+ installed
- Node.js (v14 or later)
- PostgreSQL database
- Docker (optional, for containerization)
- Git for source control

### Backend Dependencies
- Flask
- Flask-CORS
- Flask-SocketIO
- SQLAlchemy
- Psycopg2
- DocxTemplate, python-docx
- Pillow
- Dotenv

### Frontend Dependencies
- React (with Vite, TypeScript)
- Material UI
- Tailwind CSS
- Socket.IO client

## How to Run Locally

### Backend
1. Navigate to the backend directory:
   ```
   cd c:\code\Freelance\Doctor_Report_Automation\backend
   ```
2. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Set up your PostgreSQL database and update the environment variables in a `.env` file with:
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_HOST`
   - `POSTGRES_PORT`
   - `POSTGRES_DB`
4. Initialize the database:
   ```
   python init_db.py
   ```
5. Run the Flask application:
   ```
   python app.py
   ```

### Frontend
1. Navigate to the frontend directory:
   ```
   cd c:\code\Freelance\Doctor_Report_Automation\frontend
   ```
2. Install Node.js dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

## Dockerization
Both backend and frontend are Dockerized.

To build the images:
```
docker build -t my-backend-image ./backend
docker build -t my-frontend-image ./frontend
```
Use appropriate Docker commands to run the containers.

## CI/CD
The GitHub Actions workflow in `.github/workflows/deploy.yml` builds and deploys Docker images to Google Cloud Run whenever code is pushed to the main branch.

## Security & Monitoring
- HTTPS is enforced on deployed endpoints.
- CORS configuration restricts API access.
- Input validation and sanitization are implemented (including photo cropping).
- API calls are logged using Flask middleware.
- Secrets are managed via environment variables and (optionally) Google Cloud Secret Manager.

## Additional Documentation
For further details on the project structure, API endpoints, and deployment, please refer to the inline comments in the source code and the documentation in the respective directories.
