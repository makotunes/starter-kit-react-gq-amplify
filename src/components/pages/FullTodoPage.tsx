import GenericTemplate from "../templates/GenericTemplate";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import { ThemeProvider } from '@material-ui/styles';
import Box from "@material-ui/core/Box";
import { createMuiTheme } from '@material-ui/core/styles';

import React, { useEffect, useState } from "react";
import { API, graphqlOperation } from "aws-amplify";
import { listTodos } from "../../graphql/queries";
import { createTodo, updateTodo, deleteTodo } from "../../graphql/mutations";
import { onCreateTodo, onDeleteTodo, onUpdateTodo } from "../../graphql/subscriptions";
import {
    ListTodosQuery,
    OnCreateTodoSubscription,
    OnDeleteTodoSubscription,
    CreateTodoMutationVariables,
    UpdateTodoMutationVariables,
    DeleteTodoMutationVariables,
    OnUpdateTodoSubscription
} from "../../API";

import { DataGrid } from '@material-ui/data-grid';


const theme = createMuiTheme({
    palette: {
        primary: { main: '#00838f' },
        secondary: { main: '#e0f7fa' },
    },
});

const onClickDeleteTodo = (id: string) => {
    const deletedTodo: DeleteTodoMutationVariables = {
        input: {
            id: id,
        }
    };
    API.graphql(graphqlOperation(deleteTodo, deletedTodo));
};

const columns = [
    // { field: 'id', headerName: 'id', width: 90, editable: false },
    { field: 'name', headerName: '名前', width: 180, editable: true },
    { field: 'description', headerName: '詳細', width: 180,　editable: true },
    // {
    //     field: 'createdAt',
    //     headerName: '追加日',
    //     type: 'date',
    //     width: 240,
    //     editable: false,
    // },
    {
        field: "",
        headerName: "",
        width: 85,
        disableClickEventBubbling: true,
        renderCell: (params: any) => {
            const onClick = () => {
                onClickDeleteTodo(params.id)
                return
            };

            return <Button variant="contained" color="secondary" name="commit" onClick={onClick}>削除</Button>
        }
    }
];

type Todo = {
    id: string;
    name: string;
    description?: string | null | undefined;
    createdAt: string;
    updatedAt: string;
};

type FormState = {
    id: string;
    name: string;
    description?: string | null | undefined;
};

type TodoSubscriptionEventCreate = { value: { data: OnCreateTodoSubscription } };
type TodoSubscriptionEventDelete = { value: { data: OnDeleteTodoSubscription } };
type TodoSubscriptionEventUpdate = { value: { data: OnUpdateTodoSubscription } };

const useTodos = () => {
    const [Todos, setTodos] = useState<Todo[]>([]);

    useEffect(() => {
        (async () => {

            const result = await API.graphql(graphqlOperation(listTodos));
            if ("data" in result && result.data) {
                const Todos = result.data as ListTodosQuery;
                if (Todos.listTodos) {
                    setTodos(Todos.listTodos.items as Todo[]);
                }
            }

            const clientCreateTodo = API.graphql(graphqlOperation(onCreateTodo));
            if ("subscribe" in clientCreateTodo) {
                clientCreateTodo.subscribe({
                    next: ({ value: { data } }: TodoSubscriptionEventCreate) => {
                        if (data.onCreateTodo) {
                            const todo: Todo = data.onCreateTodo;
                            setTodos(prev => [...prev, todo]);
                        }
                    }
                });
            }

            const clientDeleteTodo = API.graphql(graphqlOperation(onDeleteTodo));
            if ("subscribe" in clientDeleteTodo) {
                clientDeleteTodo.subscribe({
                    next: ({ value: { data } }: TodoSubscriptionEventDelete) => {
                        if (data.onDeleteTodo) {
                            const todo: Todo = data.onDeleteTodo;
                            setTodos(prev => {
                                return prev.filter(obj => obj.id !== todo.id)
                            });
                        }
                    }
                });
            }

            const clientUpdateTodo = API.graphql(graphqlOperation(onUpdateTodo));
            if ("subscribe" in clientUpdateTodo) {
                clientUpdateTodo.subscribe({
                    next: ({ value: { data } }: TodoSubscriptionEventUpdate) => {
                        if (data.onUpdateTodo) {
                            const todo: Todo = data.onUpdateTodo;
                            setTodos(prev => [...prev.filter(obj => obj.id !== todo.id), todo]);
                        }
                    }
                });
            }

        })();
    }, []);

    return Todos;
};

const useStyles = makeStyles({
    table: {
        minWidth: 650,
    },
});

const ProductPage: React.FC = () => {
    const [input, setInput] = useState<FormState>({
        id: '',
        name: '',
        description: ''
    });
    const todos = useTodos();

    const [filterNodescription, setFilterNodescription] = useState<boolean>();

    const onFormChange = ({
        target: { name, value }
    }: React.ChangeEvent<HTMLInputElement>) => {
        setInput(prev => ({ ...prev, [name]: value }));
    };

    const onTodo = () => {
        if (input.name === '') return;
        const newTodo: CreateTodoMutationVariables = {
            input: {
                name: input.name,
                description: input.description ? String(input.description) : ''
            }
        };
        setInput({ id: '', name: '', description: '' });
        API.graphql(graphqlOperation(createTodo, newTodo));
    };

    const onEditCellChangeCommitted = (e: any) => {
        console.log(e)
        const id = e.id;
        let input
        if (e.field == 'name') {
            input = {
                id: id,
                name: e.props.value,
            }
        } else if (e.field = 'description') {
            input = {
                id: id,
                description: e.props.value ? String(e.props.value) : ''
            }
        } else {
            return
        }

        const updatedTodo: UpdateTodoMutationVariables = {
            input: input
        };
        API.graphql(graphqlOperation(updateTodo, updatedTodo));
    };

    return (
        <GenericTemplate title="TODO完全版">

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

            <div style={{ height: 700, width: '100%' }}>
                <DataGrid rows={todos} columns={columns}
                    onEditCellChangeCommitted={onEditCellChangeCommitted}
                    // checkboxSelection
                    sortModel={[
                        {
                            field: 'description',
                            sort: 'desc',
                        },
                    ]}
                />
            </div>

        </GenericTemplate>
    );
};

export default ProductPage;