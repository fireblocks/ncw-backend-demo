FROM node:18.12.1-alpine3.16
RUN apk add bash git python3 make tini && npm i -g typescript
ENV NODE_ENV=dev
USER node
RUN npm config set scripts-prepend-node-path true
COPY --chown=node:node yarn.lock /opt/services/ncw-demo/
COPY --chown=node:node package.json /opt/services/ncw-demo/
WORKDIR /opt/services/ncw-demo
RUN yarn --frozen-lockfile
COPY  --chown=node:node *.json *.ts /opt/services/ncw-demo/
COPY  --chown=node:node types/ /opt/services/ncw-demo/types/
COPY  --chown=node:node src/ /opt/services/ncw-demo/src/
RUN yarn build && yarn cache clean
ENTRYPOINT ["/sbin/tini",  "-g", "--", "npm", "run", "start"]
