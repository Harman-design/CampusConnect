import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  List<dynamic> _events = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchEvents();
  }

  Future<void> _fetchEvents() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await ApiService.get('/events');
      final data = jsonDecode(res.body);

      if (res.statusCode == 200 && data['success'] == true) {
        setState(() {
          _events = data['data'];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = data['message'] ?? 'Failed to load events';
          _isLoading = false;
        });
      }
    } catch (_) {
      setState(() {
        _errorMessage = 'Server connection failed';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B1220),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text('Campus Events', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _errorMessage != null
                ? Center(child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)))
                : _events.isEmpty
                    ? const Center(child: Text('No upcoming campus events.', style: TextStyle(color: Colors.grey)))
                    : ListView.builder(
                        itemCount: _events.length,
                        itemBuilder: (context, index) {
                          final event = _events[index];
                          return Card(
                            color: const Color(0xFF111827),
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                              side: const BorderSide(color: Color(0xFF1F2937)),
                            ),
                            child: ListTile(
                              title: Text(
                                event['title'] ?? 'General Event',
                                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                              subtitle: Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(
                                  'Date: ${event['date'] ?? 'TBD'} • Venue: ${event['venue'] ?? 'Auditorium'}',
                                  style: const TextStyle(color: Colors.grey, fontSize: 10),
                                ),
                              ),
                              trailing: const Icon(Icons.chevron_right, color: Colors.grey),
                            ),
                          );
                        },
                      ),
      ),
    );
  }
}
