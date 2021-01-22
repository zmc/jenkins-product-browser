FROM node:15-alpine
WORKDIR /app
COPY config-overrides.js package.json yarn.lock /app/
COPY public/ /app/public/
COPY src/ /app/src/
RUN \
  ls -la && \
  yarn install && \
  yarn run build && \
  yarn global add serve
EXPOSE 5000
ENTRYPOINT ["/bin/sh"]
CMD ["-c", "serve -s build"]
