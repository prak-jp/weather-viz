# Step 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency specifications and install
COPY package*.json ./
RUN npm install

# Copy application source and build bundle
COPY . .
RUN npm run build

# Step 2: Serve with Nginx
FROM nginx:alpine

# Copy built frontend assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx reverse-proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
