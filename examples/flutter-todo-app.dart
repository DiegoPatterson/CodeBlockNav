// BLOCK: Flutter Todo App

import 'package:flutter/material.dart';

// SUBBLOCK1: Todo Model

class Todo {
  final String id;
  final String title;
  final String description;
  bool isCompleted;
  final DateTime createdAt;

  Todo({
    required this.id,
    required this.title,
    this.description = '',
    this.isCompleted = false,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  void toggleComplete() {
    isCompleted = !isCompleted;
  }
}

// SUBBLOCK1: Todo List Screen

class TodoListScreen extends StatefulWidget {
  const TodoListScreen({Key? key}) : super(key: key);

  @override
  State<TodoListScreen> createState() => _TodoListScreenState();
}

class _TodoListScreenState extends State<TodoListScreen> {
  // SUBBLOCK2: State Variables

  final List<Todo> _todos = [];
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadSampleData();
  }

  // SUBBLOCK2: Data Management

  void _loadSampleData() {
    setState(() {
      _todos.addAll([
        Todo(id: '1', title: 'Buy groceries', description: 'Milk, eggs, bread'),
        Todo(
          id: '2',
          title: 'Finish project',
          description: 'Complete the Flutter app',
        ),
        Todo(id: '3', title: 'Exercise', description: '30 minutes cardio'),
      ]);
    });
  }

  void _addTodo() {
    // SUBBLOCK3: Validate Input
    if (_titleController.text.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please enter a title')));
      return;
    }

    // SUBBLOCK3: Create New Todo
    setState(() {
      _todos.add(
        Todo(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          title: _titleController.text,
          description: _descriptionController.text,
        ),
      );
    });

    // SUBBLOCK3: Clear Input Fields
    _titleController.clear();
    _descriptionController.clear();
    Navigator.of(context).pop();
  }

  void _deleteTodo(String id) {
    setState(() {
      _todos.removeWhere((todo) => todo.id == id);
    });
  }

  void _toggleTodo(String id) {
    setState(() {
      final todo = _todos.firstWhere((t) => t.id == id);
      todo.toggleComplete();
    });
  }

  // SUBBLOCK2: UI Builders

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // SUBBLOCK3: App Bar
      appBar: AppBar(
        title: const Text('My Todos'),
        actions: [
          // SUBBLOCK4: Statistics Badge
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Center(
              child: Text(
                '${_todos.where((t) => t.isCompleted).length}/${_todos.length}',
                style: const TextStyle(fontSize: 16),
              ),
            ),
          ),
        ],
      ),

      // SUBBLOCK3: Todo List Body
      body: _buildTodoList(),

      // SUBBLOCK3: Add Button
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddTodoDialog,
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildTodoList() {
    // SUBBLOCK3: Empty State
    if (_todos.isEmpty) {
      return const Center(
        child: Text(
          'No todos yet!\nTap + to add one',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 18, color: Colors.grey),
        ),
      );
    }

    // SUBBLOCK3: Todo Items List
    return ListView.builder(
      itemCount: _todos.length,
      itemBuilder: (context, index) {
        return _buildTodoItem(_todos[index]);
      },
    );
  }

  Widget _buildTodoItem(Todo todo) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: ListTile(
        // SUBBLOCK4: Checkbox
        leading: Checkbox(
          value: todo.isCompleted,
          onChanged: (_) => _toggleTodo(todo.id),
        ),

        // SUBBLOCK4: Todo Content
        title: Text(
          todo.title,
          style: TextStyle(
            decoration: todo.isCompleted
                ? TextDecoration.lineThrough
                : TextDecoration.none,
          ),
        ),
        subtitle: todo.description.isNotEmpty ? Text(todo.description) : null,

        // SUBBLOCK4: Delete Button
        trailing: IconButton(
          icon: const Icon(Icons.delete, color: Colors.red),
          onPressed: () => _deleteTodo(todo.id),
        ),
      ),
    );
  }

  // SUBBLOCK2: Dialog Management

  void _showAddTodoDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        // SUBBLOCK3: Dialog Title
        title: const Text('Add New Todo'),

        // SUBBLOCK3: Input Fields
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Title',
                hintText: 'Enter todo title',
              ),
              autofocus: true,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: 'Description',
                hintText: 'Enter description (optional)',
              ),
              maxLines: 3,
            ),
          ],
        ),

        // SUBBLOCK3: Action Buttons
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(onPressed: _addTodo, child: const Text('Add')),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }
}

// BLOCK: Main App

void main() {
  runApp(const TodoApp());
}

class TodoApp extends StatelessWidget {
  const TodoApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Todo App',
      theme: ThemeData(primarySwatch: Colors.blue, useMaterial3: true),
      home: const TodoListScreen(),
    );
  }
}
