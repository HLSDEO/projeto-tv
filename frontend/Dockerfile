FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Expose port 3100 for Vite dev server
EXPOSE 3100

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3100"]
