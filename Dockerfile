FROM node:10.18.1-alpine3.11 as build
RUN apk add python build-base
WORKDIR /precedence



FROM build as api
COPY api/package*.json ./
RUN npm i

FROM build as cli
COPY cli/package*.json ./
RUN npm i

FROM build as common
COPY common/package*.json ./
RUN npm i

FROM build as core
COPY core/package*.json ./
RUN npm i



FROM node:10.18.1-alpine3.11

WORKDIR /precedence

ENV NODE_ENV=production
ENV PRECEDENCE_API ""

EXPOSE 9000

COPY entrypoint.sh .
RUN chmod 755 entrypoint.sh
ENTRYPOINT ["/precedence/entrypoint.sh"]

COPY --from=api /precedence ./api
COPY --from=cli /precedence ./cli
COPY --from=common /precedence ./common
COPY --from=core /precedence ./core

COPY api/src ./api/src
COPY cli/src ./cli/src
COPY common/src ./common/src
COPY core/src ./core/src

RUN cd cli && npm link
RUN cd api && npm link
