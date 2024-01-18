# Start your image with a node base image
FROM node:latest

# The /app directory should act as the main application directory
WORKDIR /uwApp

# Copy the app package and package-lock.json file
COPY package*.json ./

# Copy local directories to the current local directory of our docker image (/app)
COPY ./source ./

# Install node packages, install serve, build the app, and remove dependencies at the end
RUN npm install \
	&& npm install pm2@latest -g

EXPOSE 3000

# Start the app using serve command
CMD ["pm2-runtime", "npm", "--", "start"]
