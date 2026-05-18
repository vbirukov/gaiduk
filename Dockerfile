FROM node:22-alpine
WORKDIR /app
COPY audio-proxy-server.mjs ./
ENV PORT=8080
ENV HOST=0.0.0.0
EXPOSE 8080
USER node
CMD ["node", "audio-proxy-server.mjs"]
