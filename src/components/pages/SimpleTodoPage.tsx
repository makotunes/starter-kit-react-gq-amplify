import GenericTemplate from "../templates/GenericTemplate";
import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";

import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme } from '@material-ui/core/styles';
import Box from "@material-ui/core/Box";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";


import React, { useEffect, useState } from "react";
import { API, graphqlOperation } from "aws-amplify";
import { listTodos } from "../../graphql/queries";
import { createTodo } from "../../graphql/mutations";
import { onCreateTodo } from "../../graphql/subscriptions";
import {
    ListTodosQuery,
    OnCreateTodoSubscription,
    CreateTodoMutationVariables
} from "../../API";

const theme = createMuiTheme({
    palette: {
        primary: { main: '#00838f' },
        secondary: { main: '#e0f7fa' },
    },
});

type Todo = {
    id: string;
    name: string;
    description?: string | null | undefined;
    createdAt: string;
    updatedAt: string;
};

type FormState = {
    name: string;
    description: string;
};

type TodoSubscriptionEvent = { value: { data: OnCreateTodoSubscription } };

const useTodos = () => {
    const [todos, setTodos] = useState<Todo[]>([]);

    useEffect(() => {
        (async () => {
            // 最初のTodo一覧取得
            const result = await API.graphql(graphqlOperation(listTodos));
            if ("data" in result && result.data) {
                const todos = result.data as ListTodosQuery;
                if (todos.listTodos) {
                    setTodos(todos.listTodos.items as Todo[]);
                }
            }

            // Todo追加イベントの購読
            const client = API.graphql(graphqlOperation(onCreateTodo));
            if ("subscribe" in client) {
                client.subscribe({
                    next: ({ value: { data } }: TodoSubscriptionEvent) => {
                        if (data.onCreateTodo) {
                            const todo: Todo = data.onCreateTodo;
                            setTodos(prev => [...prev, todo]);
                        }
                    }
                });
            }
        })();
    }, []);

    return todos;
};


const useStyles = makeStyles({
    table: {
        minWidth: 650,
    },
});

const ProductPage: React.FC = () => {
    const classes = useStyles();
    const [input, setInput] = useState<FormState>({
        name: "",
        description: ""
    });
    const todos = useTodos();

    const onFormChange = ({
        target: { name, value }
    }: React.ChangeEvent<HTMLInputElement>) => {
        setInput(prev => ({ ...prev, [name]: value }));
    };

    const onTodo = () => {
        if (input.name === "" || input.description === "") return;
        const newTodo: CreateTodoMutationVariables = {
            input: {
                name: input.name,
                description: input.description
            }
        };
        setInput({ name: "", description: "" });
        API.graphql(graphqlOperation(createTodo, newTodo));
    };

    return (
        <GenericTemplate title="TODO簡易版">
            <ThemeProvider theme={theme}>
                <Box p={2} bgcolor="primary.main" color="primary.contrastText">
                    新規登録
        　      </Box>

                <Box p={2} bgcolor="secondary.main" color="primary.main">
                    <form action="/users" acceptCharset="UTF-8" method="post">
                        <div><TextField id="name" type="text" name="name" label="名前" style={{ width: 500 }} value={input.name} onChange={onFormChange} /></div>
                        <div><TextField id="description" type="text" name="description" label="詳細" style={{ width: 500 }} value={input.description} onChange={onFormChange} /></div>
                        <Button variant="contained" color="primary" name="commit" onClick={onTodo}>登録</Button>
                    </form>
                </Box>
            </ThemeProvider>
            <TableContainer component={Paper}>
                <Table className={classes.table} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>名前</TableCell>
                            <TableCell>詳細</TableCell>

                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {todos.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell component="th" scope="row">
                                    {row.name}
                                </TableCell>
                                <TableCell>{row.description}</TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </GenericTemplate>
    );
};

export default ProductPage;