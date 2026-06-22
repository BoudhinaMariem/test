FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist /tmp/dist

RUN if [ -d "/tmp/dist/browser" ]; then \
      cp -r /tmp/dist/browser/* /usr/share/nginx/html/; \
    else \
      first_dir=$(find /tmp/dist -mindepth 1 -maxdepth 1 -type d | head -n 1); \
      if [ -n "$first_dir" ] && [ -d "$first_dir/browser" ]; then \
        cp -r "$first_dir/browser"/* /usr/share/nginx/html/; \
      elif [ -n "$first_dir" ]; then \
        cp -r "$first_dir"/* /usr/share/nginx/html/; \
      else \
        cp -r /tmp/dist/* /usr/share/nginx/html/; \
      fi; \
    fi

EXPOSE 80