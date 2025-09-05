**[➡️ Live Demo Link](https://your-live-project-url.com](https://doctor-report-frontend-720901500415.asia-south1.run.app/)**

### The Problem It Solves
In many clinics, health checkup data is collected manually across different departments (ENT, Vision, Dental, etc.), leading to slow processing, data entry errors, and delays in generating the final patient report. This manual workflow is inefficient and prone to inconsistencies.

---

### Key Features
- **Real-Time Data Sync:** Implemented a WebSocket connection via Socket.IO for instantaneous data synchronization and live updates across all departmental dashboards.
- **Automated Report Generation:** Automatically creates a complete, formatted medical report in `.docx` format once all departmental data is submitted.
- **Dynamic Departmental Dashboards:** Five unique, responsive front-end dashboards for each medical department, built with React and TypeScript.
- **Cloud-Native Deployment:** Fully containerized with Docker and deployed to Google Cloud Run, integrated with a managed Cloud SQL instance.
- **Automated CI/CD Pipeline:** A complete CI/CD pipeline using GitHub Actions automatically builds and deploys the application on every push to the main branch.

---

### Tech Stack

| Category              | Technologies                                                                          |
| --------------------- | ------------------------------------------------------------------------------------- |
| **Frontend** | React, TypeScript, Vite, Material-UI, Tailwind CSS, Socket.IO Client                    |
| **Backend** | Python, Flask, SQLAlchemy, Socket.IO, Psycopg2, python-docx                             |
| **Database** | PostgreSQL (managed via Google Cloud SQL)                                             |
| **Cloud & DevOps** | Google Cloud Run, Google Container Registry, Docker, CI/CD with GitHub Actions          |


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

## Deployment Guide

### Prerequisites
1. **Google Cloud Account**: Set up a Google Cloud account with billing enabled
2. **Google Cloud CLI**: Install the Google Cloud CLI (`gcloud`)
3. **Docker**: Have Docker installed locally
4. **Cloud SQL**: A PostgreSQL instance on Cloud SQL
5. **Service Account**: Create a service account with appropriate permissions

### Database Setup
1. Create a PostgreSQL instance on Cloud SQL
   ```bash
   gcloud sql instances create doctor-report-db ^
     --database-version=POSTGRES_13 ^
     --tier=db-f1-micro ^
     --region=asia-south1
   ```
2. Create a database
   ```bash
   gcloud sql databases create doctor_reports --instance=doctor-report-db
   ```
3. Set a password for the postgres user
   ```bash
   gcloud sql users set-password postgres ^
     --instance=doctor-report-db ^
     --password=PASSWORD
   ```

### Backend Deployment
1. **Navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Build the Docker image**
   ```bash
   docker build -t gcr.io/doctor-report-app/doctor-report-backend .
   ```

3. **Push the image to Google Container Registry**
   ```bash
   docker push gcr.io/doctor-report-app/doctor-report-backend
   ```

4. **Deploy to Cloud Run with Cloud SQL connection**
   ```bash
   gcloud run deploy doctor-report-backend ^
     --image gcr.io/doctor-report-app/doctor-report-backend ^
     --platform managed ^
     --region asia-south1 ^
     --allow-unauthenticated ^
     --add-cloudsql-instances doctor-report-app:asia-south1:doctor-report-db ^
     --set-env-vars="CLOUD_RUN=true,INSTANCE_CONNECTION_NAME=doctor-report-app:asia-south1:doctor-report-db,POSTGRES_USER=postgres,POSTGRES_PASSWORD=Secret_271919,POSTGRES_DB=doctor_reports"
   ```

5. **Initialize the database (one-time setup)**
   ```bash
   gcloud run deploy doctor-report-backend ^
     --image gcr.io/doctor-report-app/doctor-report-backend ^
     --platform managed ^
     --region asia-south1 ^
     --allow-unauthenticated ^
     --add-cloudsql-instances doctor-report-app:asia-south1:doctor-report-db ^
     --set-env-vars="CLOUD_RUN=true,INITIALIZE_DB=true,INSTANCE_CONNECTION_NAME=doctor-report-app:asia-south1:doctor-report-db,POSTGRES_USER=postgres,POSTGRES_PASSWORD=Secret_271919,POSTGRES_DB=doctor_reports"
   ```

### Frontend Deployment
1. **Create environment files for frontend**
   
   Create `.env.production` with your Cloud Run backend URL:
   ```
   VITE_API_URL=https://doctor-report-backend-YOUR_PROJECT_NUMBER.asia-south1.run.app
   VITE_SOCKET_URL=wss://doctor-report-backend-YOUR_PROJECT_NUMBER.asia-south1.run.app
   ```

2. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

3. **Build the Docker image**
   ```bash
   docker build -t gcr.io/doctor-report-app/doctor-report-frontend .
   ```

4. **Push the image to Google Container Registry**
   ```bash
   docker push gcr.io/doctor-report-app/doctor-report-frontend
   ```

5. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy doctor-report-frontend ^
     --image gcr.io/doctor-report-app/doctor-report-frontend ^
     --platform managed ^
     --region asia-south1 ^
     --allow-unauthenticated
   ```

### Troubleshooting
If you encounter issues connecting to the backend after deployment, ensure:

1. **API URLs**: Verify that the frontend is using the correct backend URL:
   - Check that all API calls use the `getApiUrl()` helper function from `src/config/api.ts`
   - Confirm that no hardcoded URLs like `http://localhost:5000` are present

2. **CORS Issues**: Ensure backend has proper CORS configuration for your frontend domain

3. **Cloud SQL Connection**: Verify the Cloud SQL Auth Proxy connection string format in `app.py`

4. **Socket.IO Connection**: Check that the WebSocket connection is properly configured with the correct URL and transports

5. **Environment Variables**: Confirm that all necessary environment variables are correctly set in Cloud Run service configuration

6. **Mobile Camera Photos**: If photos from mobile cameras aren't synchronizing:
   - Ensure the Socket.IO server allows large message sizes
   - Check WebSocket connection stability on mobile networks
   - Verify mobile browser permissions for camera access
   - Try adjusting the compression quality in the frontend code if images are too large

### CI/CD with GitHub Actions
To automate deployments, set up a GitHub Actions workflow:

1. Create a service account with appropriate permissions
2. Configure secrets in GitHub repository:
   - `GCP_PROJECT_ID`: Your Google Cloud project ID
   - `GCP_SA_KEY`: Base64-encoded service account JSON key
   - `DATABASE_URL`: Your database connection string

3. Set up the workflow file `.github/workflows/deploy.yml` to build and deploy your containers

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
