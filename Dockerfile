FROM node:15-alpine
WORKDIR /app
COPY config-overrides.js package.json package-lock.json /app/
COPY public/ /app/public/
COPY src/ /app/src/
RUN \
  ls -la && \
  npm install && \
  npm run build && \
  npm install -g serve
EXPOSE 5000
ENTRYPOINT ["/bin/sh"]
CMD ["-c", "serve -s build"]
