# Zero

Small library to manage an express application with middlewares pre-configured.

![Picture](./Zero.png 'zero')
<b>JU JA JUU!!</b>

## Index or table of content

- [Development Usage](#development-usage)
- [Exposed Resources](#exposed-resources)
- [Testing](#testing)
- [TODO](#todo)
- [Authors & Contributors](#authors-&-contributors)

<a name="development-usage"></a>

## Development usage

1. Install dependency.

```shell
$ npm i -S zero
```

2. Configure `env` variables.

Context

```shell
SERVICE_HOST            // if not present, default "localhost"
JWT_PUBLIC_KEY          // if not present, default "super-secrect"
DISCRIMINATOR_KEY       // if not present, default "contractId"
DISCRIMINATOR_CLAIM     // if not present, default "contracts"
SERVICE_SKIP_ENDPOINTS  // if not present, default ["/health"]
```

Application

```shell
SERVICE_PORT            // if not present, default 8080
SERVICE_NAME            // if not present, default "zero"
SERVICE_CONTEXT         // if not present, default "",
SERVICE_LIMIT_SIZE_JSON // if not present, default "200kb",
```

3. Configure your project.

```javascript
// app.js
import { Service, Routes, BuildError, BuildResponse } from "zero";

const routes = Routes();

// Get async/await endpoint.
routes.addGet(
  "/test",
  () => BuildResponse(response),
  ["privileges"]
);

// or Get Promise endpoint.
routes.addGet(
  "/test",
  () => Promise.resolve(BuildResponse({}))
    .catch(({ message }) => BuildError(500, { cause: message })),
  ["privileges"]
);

Service.start(routes);
```


4. Run your code.

```npm
$ npm start
```

or

```shell
$ node app.js
```

5. Call your endpoints and more

By default the router instance provide a `health` endpoint

```shell
http://localhost:8080/zero/health
```

Response

```shell
{ message: "Service Zero is running" }
```

<a name="exposed-resources"></a>

## Exposed resources

The library exposes the following resources:

- *Service*: object to initialize the service as RestAPI.
    - start: initialize the express application with the provided `Routes`.
        - Middlewares:
            - context-handler
            - correlation-handler
            - authentication
            - routerLoggerHandler
            - `Routes.build()` instance
            - errorLoggerHandler
            - errorHandler
            - notFoundHandler


- *Routes*: express router instance to attach endpoints.
    - addGet: attaches the given functionality to a `get` endpoint.
    - addPut: attaches the given functionality to a `put` endpoint.
    - addPost: attaches the given functionality to a `post` endpoint.
    - addPatch: attaches the given functionality to a `patch` endpoint.
    - addDelete: attaches the given functionality to a `delete` endpoint.

  *NOTE*:

  All these options are received as parameter:

      - path: route to be exposed as endpoint.
      - action: function (async/await or promise are allowed) to be executed.
        * By default this function provides an object as parameter {body, query, params, headers, identity, correlationId, logger}
      - privilege: array of use cases that grants access.

  The handler error (for every action that is provided) is expecting a `BuildError` object if not present then it is
  treated as valid response (`BuildResponse` manage this behavior):

      - If error key exists then is sent to `errorHandle` (Use BuildError).
      - If there is no error key then it will be sent to `Express` handler (Use BuildResponse).
      - If no BuildError or BuildResponse then the returned object will be sent as JSON to `Espress`.

- *HTTPClient*: Client to make HTTP request that has embedded calls for Internal Services.
    - do: function that performs an HTTP call.

          - method: HTTP verb as string to perform a call.
          - uri: endpoint to perform the HTTP call.
          - config: object that provides how to perform the call:
             - headers: object
             - params: object (aka: query params)
             - body: object
             - isInternal: boolean (if this is false, service and authToken are not needed)
             - service: string (Internal service name)
             - authToken: string (JWT)


- *BuildError*: object to create errors in a standard zero way.
    - 400: Request error, Bad Request
    - 401: Authentication error, Unauthorized
    - 403: Authentication error, Forbidden
    - 404: Service error, Not Found
    - 421: Service error, Misdirected Request
    - 500: Internal server error, Internal Server Error
    - 501: Internal server error, Not Implemented
    - 502: External server error, Bad Gateway
    - 503: External server error, Service Unavailable
    - 504: External server error, Gateway Timeout


- *BuildResponse*: object to create a response in a standard zero way.
    - payload: object as parameter that will be added to `data.items` in the response.

```json
{
  "data": {
    "items": [
      {}
    ]
  },
  "totalItems": 1
}
```

<a name="testing"></a>

## Testing

Following the component pattern the Tests files co-exist together with the implementation (same directory).

To run the tests from the root of the project:

```npm
$ npm test
```

Check the coverage report:

```npm
$ npm run coverage:open
```

on windows:

```npm
$ npm run coverage:open-win
```

<a name="todo"></a>

## TODO


<a name="authors-&-contributors"></a>

## Authors & Contributors

- **Author:** SHUGA

- **Contributors:**
    - Jonathan Estrada <jeaworks@hotmail.com>
