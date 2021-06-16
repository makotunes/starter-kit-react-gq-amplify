import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import SimpleTodoPage from "./components/pages/SimpleTodoPage";
import FullTodoPage from "./components/pages/FullTodoPage";

const App: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route path="/simple-todos" component={SimpleTodoPage} exact />
        <Route path="/full-todos" component={FullTodoPage} exact />
        <Route path="/" component={SimpleTodoPage} exact />
      </Switch>
    </Router>
  );
};

export default App;