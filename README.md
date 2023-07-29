## Description

Backend for learning and making use of various services

Service tried out so far:

1. S3
2. Cloudfront
3. SQS
4. Kafka

## Installation

```bash
$ npm install
```

## Running the app

Create `.env` file to add aws related credentials

```
AWS_ACCESS_KEY=
AWS_SECRET_ACCESS_KEY=
AWS_S3_REGION=
```

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```
