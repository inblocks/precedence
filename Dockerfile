FROM node:10-alpine as build
RUN apk add python build-base
WORKDIR /app



FROM build as api
COPY api/package.json api/package-lock.json ./
RUN npm i
COPY api/src ./src

FROM build as cli
COPY cli/package.json cli/package-lock.json ./
RUN npm i
COPY cli/src ./src

FROM build as common
COPY common/package.json common/package-lock.json ./
RUN npm i
COPY common/src ./src

FROM build as core
COPY core/package.json core/package-lock.json ./
RUN npm i
COPY core/src ./src



FROM node:10-alpine

ENV NODE_ENV=production
ENV PRECEDENCE_API ""

EXPOSE 9000

WORKDIR /app

COPY entrypoint.sh .
RUN chmod 755 entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]

COPY --from=common /app common
COPY --from=cli /app cli
RUN cd cli && npm link
COPY --from=api /app api
RUN cd api && npm link
COPY --from=core /app core

WORKDIR /root
