FROM node:20 AS build

WORKDIR /build

COPY package.json package-lock.json ./

RUN npm ci --ignore-scripts

COPY . .

RUN npm run build

RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force


FROM gcr.io/distroless/nodejs24-debian12

WORKDIR /app

COPY --from=build /build/node_modules ./node_modules
COPY --from=build /build/dist ./dist
COPY --from=build /build/package.json ./package.json
COPY --from=build /build/src/views ./views
COPY --from=build /build/public ./public

EXPOSE 3333

CMD ["dist/app.js"]