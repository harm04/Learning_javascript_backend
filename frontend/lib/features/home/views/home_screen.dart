import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:frontend/constants/secrets.dart';
import 'package:http/http.dart' as http;

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<String> jokes = [];
  
  //create a function that fetches jokes from an API
  Future<void> fetchJokes() async {
    final response = await http.get(Uri.parse('$uri/api/jokes'));
    if (response.statusCode == 200) {
      List<dynamic> data = jsonDecode(response.body);
      setState(() {
        jokes = data.map((joke) => joke.toString()).toList();
      });
    }
  }

  @override
  void initState() {
    super.initState();

    fetchJokes();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Home Screen')),
      body: Center(
        child: Text(jokes.isEmpty ? 'No jokes fetched yet.' : jokes.toString()),
      ),
    );
  }
}