FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./
# Since we didn't use package-lock in our manual scaffold, we just run npm i
RUN npm install

COPY . .
RUN npm run build

# Serve with Nginx for production
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Update Nginx config for client-side routing (SPA fallback)
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
