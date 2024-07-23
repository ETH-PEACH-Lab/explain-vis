# Using the GitHub Container Registry for Deployment

1. Create a personal token: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

```
docker login ghcr.io --username github-account
[Paste your GitHub token on this prompt]
```
2. Build the image for the server
```
docker-compose -f docker-compose.deployment.yml build
```

2. Tag and push your Docker images
```
docker tag explain-vis-frontend ghcr.io/eth-peach-lab/explain-vis/explain-vis-frontend-amd64:latest
docker push ghcr.io/eth-peach-lab/explain-vis/explain-vis-frontend-amd64:latest
docker tag explain-vis-backend ghcr.io/eth-peach-lab/explain-vis/explain-vis-backend-amd64:latest
docker push ghcr.io/eth-peach-lab/explain-vis/explain-vis-backend-amd64:latest
```