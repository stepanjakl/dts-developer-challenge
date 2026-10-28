# Manage caseworker tasks

A simple task management service built for the
[HMCTS DTS developer challenge](https://github.com/hmcts/dts-developer-challenge). It allows
caseworkers to create, view, update and delete tasks.

[Live service](https://dts-task-manager.vercel.app) ·
[API documentation](https://dts-task-manager.vercel.app/api/docs)

## Why I built it this way

I wanted to keep the project small and easy to understand, so someone looking through the code
could follow what happens from submitting a form to saving a task in the database.

HMCTS provides a [Java backend](https://github.com/hmcts/hmcts-dev-test-backend) and a
[TypeScript frontend](https://github.com/hmcts/hmcts-dev-test-frontend) as starting points.
Since I don’t use Java very often, I decided to build both sides in TypeScript and stick with
tools I’m more familiar with. I used the frontend starter as a reference, keeping Express,
Nunjucks and GOV.UK Frontend, but with a simpler setup.

One thing I liked about the GOV.UK approach was
[progressive enhancement](https://www.gov.uk/service-manual/technology/using-progressive-enhancement).
The idea is to start with HTML that works and only add JavaScript when it’s needed. For this
project, the server renders the pages and regular HTML forms handle submissions. It works well
for what the service needs to do, without relying on much browser JavaScript.

I also wanted to get some experience using the
[GOV.UK Design System](https://design-system.service.gov.uk/). The pages use its components and
patterns, such as error summaries, date inputs and confirmation pages. Since this isn’t an
official GOV.UK service, I’ve used a generic header and system fonts.

Both applications use TypeScript and Express. Zod handles schema validation, while the API
uses Drizzle and PostgreSQL (Neon) for storing tasks. Both apps are deployed together on
Vercel, and GitHub Actions runs the checks.

## What it does

The service covers the main requirements of the challenge:

- Create a task with a title, optional description, status, and due date and time
- View all tasks, ordered by due date, or view an individual task
- Update a task’s status
- Delete a task after a confirmation step

I also added two small things beyond the brief. Unfinished tasks that have passed their due
date show a red **Overdue** tag, and new tasks must have a due date in the future.

This is a shared demo without authentication, so anyone using it can view tasks, update their
status or delete them.

## A few design choices

### Keeping the frontend and API separate

The web app communicates with the API over HTTP rather than accessing the database directly.
Only the API talks to the database. I wanted to keep that separation clear, even though both
apps are in the same project.

### Sharing the task schemas

The API defines the task inputs and responses using Zod. The web app reuses the response
schemas to validate the data it receives, so the two sides follow the same contract.

### Handling UK dates and times

Dates and times are shown in UK local time, but stored in UTC. I also handled the daylight
saving change when the clocks go forward, so users can’t enter a time that doesn’t actually
exist.

### Making the data flow visible

I added a “Page data” panel that shows the values passed to each template and the API calls
made to load the page.

Since the pages are rendered on the server, I thought it would be useful to make that process
easier to inspect, especially for anyone reviewing the project. The panel is also available
on the live demo.

## How it’s organised

The project has two applications:

```text
apps/
  api/    REST API: routes → service → repository → PostgreSQL
  web/    Server-rendered pages that communicate with the API
```

Both apps follow a similar structure. `index.ts` starts the application, `app.ts` sets up the
middleware and routes, and `config.ts` loads the environment settings.

Each feature has its own folder under `src/features/`, including the Nunjucks templates in
the web app.

Shared code, such as the API client and error handlers, sits outside the features. The features
can use this shared code, but the shared code doesn’t depend on individual features.

If you want to see how everything fits together, a good place to start is
[`apps/web/src/features/tasks/tasks.routes.ts`](apps/web/src/features/tasks/tasks.routes.ts).

The route handlers show the full flow, from reading a submitted form to calling the API and
rendering the next page.

## Running it locally

You’ll need Node.js 24.2 or newer and a [Neon](https://neon.com) PostgreSQL database.

Copy `.env.example` to `.env.local` and add the pooled and direct connection strings for the
same database.

Then install the dependencies, create the database table and add some demo tasks:

```bash
npm ci
npm run db:migrate
npm run db:seed
```

Start both applications:

```bash
npm run dev
```

The web app will be available at http://localhost:3000, and the API at
http://localhost:3001/api.

## Tests

Run all the checks with:

```bash
npm run check
```

This runs the TypeScript checks, Biome and the Vitest test suite.

I’ve kept the tests focused on the parts where I think they’re most useful. There are unit
tests for date conversion, form validation and the overdue logic, along with tests that
exercise the API and web app using Supertest.

The tests use PGlite, an in-memory PostgreSQL database, so there’s no need for a Neon
connection when running them.

I also use axe to check the main pages for common accessibility issues.
