import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ComplaintsScreen extends StatefulWidget {
  const ComplaintsScreen({super.key});

  @override
  State<ComplaintsScreen> createState() => _ComplaintsScreenState();
}

class _ComplaintsScreenState extends State<ComplaintsScreen> {
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  List<dynamic> _complaints = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchComplaints();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _fetchComplaints() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await ApiService.get('/complaints/my');
      final data = jsonDecode(res.body);

      if (res.statusCode == 200 && data['success'] == true) {
        setState(() {
          _complaints = data['data'];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = data['message'] ?? 'Failed to load complaints';
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

  void _submitComplaint() async {
    final title = _titleController.text.trim();
    final desc = _descController.text.trim();
    if (title.isEmpty || desc.isEmpty) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final res = await ApiService.post('/complaints', {
        'title': title,
        'description': desc,
        'category': 'Academic'
      });

      final data = jsonDecode(res.body);
      if (res.statusCode == 201 && data['success'] == true) {
        _titleController.clear();
        _descController.clear();
        _fetchComplaints();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Complaint filed successfully.')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(data['message'] ?? 'Failed to file complaint.')),
        );
        setState(() {
          _isLoading = false;
        });
      }
    } catch (_) {
      setState(() {
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
        title: const Text('Complaints Registry', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // Logging form
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF111827),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF1F2937)),
              ),
              child: Column(
                children: [
                  TextField(
                    controller: _titleController,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                    decoration: const InputDecoration(
                      hintText: 'Complaint Title (e.g. Broken projector)',
                      hintStyle: TextStyle(color: Colors.grey, fontSize: 11),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _descController,
                    maxLines: 3,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                    decoration: const InputDecoration(
                      hintText: 'Provide details about the issue...',
                      hintStyle: TextStyle(color: Colors.grey, fontSize: 11),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _submitComplaint,
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF4F8CFF)),
                      child: const Text('Log Complaint'),
                    ),
                  )
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Align(
              alignment: Alignment.centerLeft,
              child: Text('My Registered Complaints', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _errorMessage != null
                      ? Center(child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)))
                      : _complaints.isEmpty
                          ? const Center(child: Text('No complaints logged yet.', style: TextStyle(color: Colors.grey)))
                          : ListView.builder(
                              itemCount: _complaints.length,
                              itemBuilder: (context, index) {
                                final comp = _complaints[index];
                                return Card(
                                  color: const Color(0xFF111827),
                                  margin: const EdgeInsets.only(bottom: 12),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    side: const BorderSide(color: Color(0xFF1F2937)),
                                  ),
                                  child: ListTile(
                                    title: Text(
                                      comp['title'] ?? 'Generic Complaint',
                                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                                    ),
                                    subtitle: Text('Status: ${comp['status'] ?? 'Open'}', style: const TextStyle(color: Colors.grey, fontSize: 10)),
                                  ),
                                );
                              },
                            ),
            )
          ],
        ),
      ),
    );
  }
}
