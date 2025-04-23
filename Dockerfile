FROM node:20 AS build

WORKDIR /app

COPY package.json ./

RUN npm i

COPY . .

RUN npm run build

# Use official Nginx base image
FROM nginx:alpine AS release

# Set working directory
WORKDIR /usr/share/nginx/html

COPY demo /usr/share/nginx/html/
COPY --from=build /app/dist /usr/share/nginx/html/dist/

COPY demo/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
