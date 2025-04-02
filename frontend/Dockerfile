FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./

# Install dependencies with improved configuration
RUN npm config set registry https://registry.npmjs.org/
RUN npm config set strict-ssl false
RUN npm install --legacy-peer-deps

# Copy all files
COPY . .

# Create production build
RUN npm run build

# Use nginx to serve static files
FROM nginx:alpine

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
