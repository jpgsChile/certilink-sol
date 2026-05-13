import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';

type Todo = { id: string | number; name: string };

export default function TodosDemo() {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    async function getTodos() {
      const { data } = await supabase.from('todos').select();
      if (data) setTodos(data as Todo[]);
    }
    getTodos();
  }, []);

  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 className="mb-4 text-xl font-semibold">Todos (Supabase)</h1>
      <ul className="list-inside list-disc space-y-1">
        {todos.map((todo) => (
          <li key={String(todo.id)}>{todo.name}</li>
        ))}
      </ul>
    </div>
  );
}
