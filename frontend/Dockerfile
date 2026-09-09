FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./

# Install exactly the lockfile used by CI/local verification.
RUN npm config set registry https://registry.npmjs.org/
RUN npm ci --legacy-peer-deps

COPY . .
ENV NODE_ENV=production

# Backend base URL, baked in at build time (Vite inlines env vars).
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL}

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
