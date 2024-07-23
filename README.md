# README

## Run Docker Locally
1. Create `./backend/.env` for the OPENAI API

```
# .env
OPENAI_API_KEY=YOUR_API_KEY
PORT=8000
```

2. Create `./frontend/.env` for the backend API

```
# .env
OPENAI_API_KEY=YOUR_API_KEY
```
3. Build docker
```
docker-compose -f docker-compose_local.yml build
```
4. Run docker
```
docker-compose -f docker-compose.yml build
```

## Run Server and Frontend Locally
1. Create `./backend/.env` for the OPENAI API

```
touch ./backend/.env
export OPENAI_API_KEY=DONTSHAREWITHOTHERS
export PORT=8000
```

2. Run frontend at port `3000`:
```
cd frontend
npm install
npm run start
```

3. Run server at port `8000`:

```
cd backend
npm install
node index.js
```
