# Frontend builder stage
FROM node:20-alpine AS frontend-builder

WORKDIR /app/front-end
COPY front-end/package*.json ./
RUN npm ci

COPY front-end/ .
RUN npm run build

# Go builder stage
FROM golang:1.24.4-alpine AS go-builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o main ./cmd/server/main.go

# Final stage
FROM alpine:latest

RUN apk add --no-cache ca-certificates

WORKDIR /root/

# Copy Go binary
COPY --from=go-builder /app/main .

# Copy built frontend
COPY --from=frontend-builder /app/front-end/dist ./front-end/dist

EXPOSE 8080

CMD ["./main"]
