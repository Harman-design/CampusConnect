import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class PlacementsScreen extends StatefulWidget {
  const PlacementsScreen({super.key});

  @override
  State<PlacementsScreen> createState() => _PlacementsScreenState();
}

class _PlacementsScreenState extends State<PlacementsScreen> {
  List<dynamic> _jobs = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchPlacements();
  }

  Future<void> _fetchPlacements() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await ApiService.get('/placements');
      final data = jsonDecode(res.body);

      if (res.statusCode == 200 && data['success'] == true) {
        setState(() {
          _jobs = data['data'];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = data['message'] ?? 'Failed to load placements';
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
        title: const Text('Placements & Jobs', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _errorMessage != null
                ? Center(child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)))
                : _jobs.isEmpty
                    ? const Center(child: Text('No placement drives running currently.', style: TextStyle(color: Colors.grey)))
                    : ListView.builder(
                        itemCount: _jobs.length,
                        itemBuilder: (context, index) {
                          final job = _jobs[index];
                          return Card(
                            color: const Color(0xFF111827),
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                              side: const BorderSide(color: Color(0xFF1F2937)),
                            ),
                            child: ListTile(
                              title: Text(
                                job['companyName'] ?? 'Unknown Company',
                                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                              subtitle: Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(
                                  'Role: ${job['role'] ?? 'TBD'} • Package: ${job['package'] ?? 'N/A'}',
                                  style: const TextStyle(color: Colors.grey, fontSize: 10),
                                ),
                              ),
                              trailing: ElevatedButton(
                                onPressed: () {},
                                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF4F8CFF)),
                                child: const Text('Apply'),
                              ),
                            ),
                          );
                        },
                      ),
      ),
    );
  }
}
