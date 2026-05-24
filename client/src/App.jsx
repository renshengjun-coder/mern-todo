import { useEffect, useState } from "react";
import ButtonAppBar from "./components/AppBar";
import TodoUi from "./components/TodoUi";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import AddTodo from "./components/AddTodo";
import { API_BASE_URL } from "./config";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const darkTheme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
    },
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/todos`, {
      method: "GET",
    }).then((resp) => {
      resp.json().then((data) => {
        // console.log(data);
        setTodos(data);
      });
    });
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div>
        <ButtonAppBar
          check={darkMode}
          darkMode={darkMode}
          change={() => setDarkMode(!darkMode)}
        />
        <TodoUi darkMode={darkMode} setTodos={setTodos} />
        <AddTodo
          todos={todos}
          setTodos={setTodos}
          filter={filter}
          setFilter={setFilter}
          sort={sort}
          setSort={setSort}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
