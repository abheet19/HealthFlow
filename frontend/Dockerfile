FROM node:18-alpine
WORKDIR /app
COPY package*.json .

RUN npm config set registry https://registry.npmjs.org/
RUN npm config set strict-ssl false
RUN npm cache clean --force
RUN rm -f package-lock.json
RUN npm install --unsafe-perm --legacy-peer-deps --force
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npx", "serve", "dist", "-s"]
