FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

RUN npm ci --omit=dev --ignore-scripts


FROM gcr.io/distroless/nodejs24-debian13:latest

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/src/views ./views
COPY --from=build /app/public ./public

EXPOSE $PORT

CMD ["dist/app.js"]