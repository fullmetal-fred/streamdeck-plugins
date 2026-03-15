FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
COPY scripts/ ./scripts/
COPY com.fullmetalfred.cliptype.sdPlugin/ ./com.fullmetalfred.cliptype.sdPlugin/
RUN apk add --no-cache zip \
 && npm run build \
 && npm run package

FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/preview/index.html /usr/share/nginx/html/index.html
COPY --from=build /app/dist/ /usr/share/nginx/html/plugin/
EXPOSE 8080
