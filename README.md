## Description

Backend for learning and making use of various AWS services using [Nest](https://github.com/nestjs/nest) framework.

Frontend: [learning-aws-frontend](https://github.com/acyang97/learning-aws-frontend)

Service tried out so far:

1. S3
2. Cloudfront
3. SQS

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
