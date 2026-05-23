# Learning Guide: `mern-todo`

Repository: <https://github.com/codescalper/mern-todo>

## Why this project is good for learning

This project is small enough to finish reading in a day, but it still shows the core full-stack ideas:

- React renders the UI and stores local state
- Express exposes HTTP endpoints
- The frontend uses `fetch()` to talk to the backend
- CRUD flow is visible end to end

It is not a "complete MERN app" yet because there is no real MongoDB usage in the current code, even though `mongoose` is listed in the backend dependencies.

## Tech you will meet

- JavaScript
- Node.js
- Express
- React
- Vite
- Material UI
- REST-style API calls with `fetch`

## Project structure

```text
mern-todo/
├── client/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── AppBar.jsx
│   │       ├── TodoUi.jsx
│   │       └── AddTodo.jsx
├── server/
│   └── index.js
└── Readme.md
```

## How to read this project

Read it in this order:

1. `client/src/main.jsx`
2. `client/src/App.jsx`
3. `client/src/components/AppBar.jsx`
4. `client/src/components/TodoUi.jsx`
5. `client/src/components/AddTodo.jsx`
6. `server/index.js`

This order helps you move from app entry point, to page composition, to user interactions, to the API implementation behind those interactions.

## What each file is doing

### `client/src/main.jsx`

- Starts the React app
- Mounts `<App />` into the DOM
- Uses `React.StrictMode`

Questions to ask:

- What is the `root` element?
- Why is `App` the top-level component?

### `client/src/App.jsx`

- Holds the main app state
- Creates the Material UI dark/light theme
- Fetches todos on first render with `useEffect`
- Passes state down to child components with props

Focus on these ideas:

- `useState` for `darkMode`
- `useState` for `todos`
- `useEffect` for initial data loading
- Parent-to-child data flow through props

Important observation:

- `todos` starts as `{}` instead of `[]`
- Because of that, `AddTodo` must guard with `Array.isArray(todos)`

That is a nice beginner code smell to notice. A cleaner version would initialize `todos` as an empty array.

### `client/src/components/AppBar.jsx`

- Displays the title
- Lets the user toggle dark mode

This is a good file to learn:

- Controlled props
- Simple presentational components
- How UI libraries like Material UI are composed

### `client/src/components/TodoUi.jsx`

- Stores form input for a new todo
- Sends `POST /todos`
- Fetches the full list again after creating an item
- Calls `setTodos` to update parent state

Learn these patterns here:

- Controlled form inputs
- `fetch()` with `method`, `headers`, and `body`
- JSON serialization with `JSON.stringify`
- Why frontend state sometimes needs a refresh after mutation

### `client/src/components/AddTodo.jsx`

- Renders the todo list
- Deletes todos with `DELETE /todos/:id`
- Edits todos with `PUT /todos/:id`
- Switches between display mode and edit mode

This is the best file for practicing React state reasoning:

- `editMode`
- `editId`
- `updatedTitle`
- `updatedDescription`

Questions to ask:

- Why does only one item edit at a time?
- What happens if multiple rows should be editable?
- Should edit state live here, or per todo item?

### `server/index.js`

- Creates the Express server
- Stores todos in an in-memory array
- Implements CRUD routes
- Listens on port `3000`

This file teaches:

- Route handlers: `GET`, `POST`, `PUT`, `DELETE`
- `req.params`
- `req.body`
- Sending status codes like `200`, `201`, `404`
- Basic server-side data handling

Important observation:

- Data is stored only in memory
- When the server restarts, all todos are lost

That is normal for a learning app, and it makes the server logic easy to understand.

## End-to-end flow to trace

Follow one action all the way through the stack.

### Add a todo

1. User types in `TodoUi.jsx`
2. React state updates with `setTitle` and `setDescription`
3. User clicks "Add Todo"
4. Frontend sends `POST /todos`
5. Backend adds a new object to the `todo` array
6. Frontend fetches `GET /todos`
7. Parent state updates with `setTodos`
8. React re-renders the list

### Delete a todo

1. User clicks "Delete" in `AddTodo.jsx`
2. Frontend sends `DELETE /todos/:id`
3. Backend removes the item from the array
4. Backend returns the updated list
5. Frontend stores that list in state
6. React re-renders

## Things to notice critically

This project is useful partly because it has a few rough edges:

- The frontend calls a deployed API URL, not the local Express server
- `todos` should probably start as `[]`, not `{}`
- `mongoose` is installed but not actually used
- `body-parser` is used even though modern Express can use `express.json()`
- There is no loading state or error state
- The backend CORS config currently allows only one origin

These are not failures for learning. They are good things to spot and improve.

## Best learning path

### Phase 1: Understand without changing code

1. Read the files in the order above
2. Draw the data flow between components
3. Write down every API endpoint the frontend uses
4. Match each endpoint to the backend route

### Phase 2: Run and observe

1. Start the server
2. Start the client
3. Add, edit, and delete todos
4. Watch how the UI changes after each API call

### Phase 3: Improve one thing at a time

1. Change `todos` initial state from `{}` to `[]`
2. Move API base URL into a config value or environment variable
3. Add error handling to each `fetch`
4. Add loading feedback while todos are being fetched

## Practice requirement

Build this feature on top of the current project:

### Requirement: "Todo Status + Filter"

Add the ability to mark a todo as completed and filter the list by status.

#### Functional requirements

1. Each todo must have a `completed` field with values `true` or `false`
2. New todos should default to `completed: false`
3. The UI should let the user toggle completion for each todo
4. Completed todos should look visually different
5. Add three filters:
   - All
   - Active
   - Completed
6. The filter should update the visible list without reloading the page

#### Backend changes

- Update the todo object shape in `server/index.js`
- Support updating `completed` in `PUT /todos/:id`

#### Frontend changes

- Render a checkbox or button in `AddTodo.jsx`
- Add filter state in `App.jsx` or `AddTodo.jsx`
- Only render todos that match the current filter

#### Nice-to-have extensions

- Show counts like `2 active / 3 completed`
- Add a "Clear completed" button
- Disable saving an empty title

## Strong second practice task

After that, do this refactor:

### Requirement: "Use Local API Config"

Replace the hardcoded API URL:

- `https://mern-todo-api-livid.vercel.app`

with a configurable value for local development.

Suggested target:

- Create `client/src/config.js` or use `import.meta.env`
- Make the client call `http://localhost:3000` in development

This task teaches a very real full-stack skill: connecting frontend and backend cleanly.

## What you will learn if you finish both tasks

- React component structure
- React state and props
- Form handling
- HTTP requests with `fetch`
- Express routing
- Basic CRUD design
- Full-stack debugging
- Refactoring hardcoded values into config

## Good questions to ask yourself while learning

- Which component owns each piece of state, and why?
- When should data be fetched again versus updated locally?
- What should the backend return after create, update, and delete?
- What breaks if the server is down?
- Which parts are UI logic, and which parts are business logic?

## Recommendation

Start by understanding the current code, then implement the "Use Local API Config" task first, and the "Todo Status + Filter" feature second.

That order is better because it gets your local full-stack workflow working before you add a new feature.
