FROM node:10-alpine as build
RUN apk add python build-base
WORKDIR /precedence



FROM build as api
COPY api/package*.json ./
RUN npm i
COPY api/src ./src

FROM build as cli
COPY cli/package*.json ./
RUN npm i
COPY cli/src ./src

FROM build as common
COPY common/package*.json ./
RUN npm i
COPY common/src ./src

FROM build as core
COPY core/package*.json ./
RUN npm i
COPY core/src ./src



FROM node:10-alpine

WORKDIR /precedence

ENV NODE_ENV=production
ENV PRECEDENCE_API ""

EXPOSE 9000

COPY entrypoint.sh .
RUN chmod 755 entrypoint.sh
ENTRYPOINT ["/precedence/entrypoint.sh"]

COPY --from=common /precedence/node_modules ./common/node_modules
COPY --from=common /precedence/src common/src

COPY --from=cli /precedence/node_modules ./cli/node_modules
COPY --from=cli /precedence/package*.json cli/
COPY --from=cli /precedence/src cli/src
RUN cd cli && npm link

COPY --from=api /precedence/node_modules ./api/node_modules
COPY --from=api /precedence/package*.json ./api/
COPY --from=api /precedence/src ./api/src
RUN cd api && npm link

COPY --from=core /precedence/node_modules ./core/node_modules
COPY --from=core /precedence/package*.json ./core/
COPY --from=core /precedence/src ./core/src
