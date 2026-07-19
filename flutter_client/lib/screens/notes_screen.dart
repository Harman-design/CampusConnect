import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:url_launcher/url_launcher.dart';

class NotesScreen extends StatefulWidget {
  const NotesScreen({super.key});

  @override
  State<NotesScreen> createState() => _NotesScreenState();
}

class _NotesScreenState extends State<NotesScreen> {
  List<dynamic> _notes = [];
  bool _isLoading = true;
  String _searchQuery = '';
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchNotes();
  }

  Future<void> _fetchNotes() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await ApiService.get('/notes');
      final data = jsonDecode(res.body);

      if (res.statusCode == 200 && data['success'] == true) {
        setState(() {
          _notes = data['data'];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = data['message'] ?? 'Failed to load notes';
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

  void _openFile(String? fileUrl) async {
    if (fileUrl == null || fileUrl.isEmpty) return;
    final url = Uri.parse(fileUrl);
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open preview link.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final filteredNotes = _notes.where((note) {
      final title = (note['title'] ?? '').toString().toLowerCase();
      final subject = (note['subject'] ?? '').toString().toLowerCase();
      return title.contains(_searchQuery.toLowerCase()) ||
          subject.contains(_searchQuery.toLowerCase());
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0B1220),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text('Academic Notes', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search Input
            TextField(
              style: const TextStyle(color: Colors.white, fontSize: 12),
              decoration: InputDecoration(
                hintText: 'Search notes by title or subject...',
                hintStyle: const TextStyle(color: Colors.grey, fontSize: 11),
                prefixIcon: const Icon(Icons.search, color: Colors.grey),
                filled: true,
                fillColor: const Color(0xFF111827),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF1F2937)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF4F8CFF)),
                ),
              ),
              onChanged: (val) {
                setState(() {
                  _searchQuery = val;
                });
              },
            ),
            const SizedBox(height: 24),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _errorMessage != null
                      ? Center(child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)))
                      : filteredNotes.isEmpty
                          ? const Center(child: Text('No notes matched your search.', style: TextStyle(color: Colors.grey)))
                          : ListView.builder(
                              itemCount: filteredNotes.length,
                              itemBuilder: (context, index) {
                                final note = filteredNotes[index];
                                return Card(
                                  color: const Color(0xFF111827),
                                  margin: const EdgeInsets.only(bottom: 12),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    side: const BorderSide(color: Color(0xFF1F2937)),
                                  ),
                                  child: ListTile(
                                    title: Text(
                                      note['title'] ?? 'Untitled Notes',
                                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                                    ),
                                    subtitle: Padding(
                                      padding: const EdgeInsets.only(top: 4),
                                      child: Text(
                                        'Subject: ${note['subject'] ?? 'General'} • Sem: ${note['semester'] ?? 'N/A'}',
                                        style: const TextStyle(color: Colors.grey, fontSize: 10),
                                      ),
                                    ),
                                    trailing: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        IconButton(
                                          icon: const Icon(Icons.bookmark_outline, color: Colors.grey),
                                          onPressed: () {},
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.open_in_new, color: Color(0xFF4F8CFF)),
                                          onPressed: () => _openFile(note['fileUrl']),
                                        ),
                                      ],
                                    ),
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
