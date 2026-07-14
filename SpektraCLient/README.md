# Spektra Client

Angular frontend for the Spektra AI Engineering Copilot platform.

## Package versions

- Client package version: `0.1.0`
- Angular CLI version: `18.2.0`
- Node.js version tested: `22.12.0`

## Local setup

From the repository root:

```bash
cd SpektraCLient
npm install
```

## Run the client

```bash
npm start
```

This launches the Angular development server.

## Build for production

```bash
npm run build
```

## Features

- Angular 18 standalone components
- Reactive route-driven pages for AI generators
- Material icons and responsive layout
- Shared mock models for generator preview content

## Notes

- The client uses `@angular/cli`, `@angular/material`, and `rxjs`.
- If you change the backend URL, update the API service endpoints under `src/app/core/api`.
