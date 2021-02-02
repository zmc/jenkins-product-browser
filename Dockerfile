FROM registry.access.redhat.com/ubi8/nodejs-14
COPY config-overrides.js package.json package-lock.json ./
COPY public/ ./public/
COPY src/ ./src/
RUN \
  ls -la && \
  npm install && \
  npm run build && \
  npm install -g serve
EXPOSE 5000
ENTRYPOINT ["/bin/sh"]
CMD ["-c", "serve -s build"]
