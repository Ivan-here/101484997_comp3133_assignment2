FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4200
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--port", "4200", "--poll", "2000", "--allowed-hosts=true", "--proxy-config", "proxy.conf.json"]
