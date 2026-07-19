import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:url_launcher/url_launcher.dart';

class PyqScreen extends StatefulWidget {
  const PyqScreen({super.key});

  @override
  State<PyqScreen> createState() => _PyqScreenState();
}

class _PyqScreenState extends State<PyqScreen> {
  List<dynamic> _pyqs = [];
  bool _isLoading = true;
  String _searchQuery = '';
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchPyqs();
  }

  Future<void> _fetchPyqs() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await ApiService.get('/pyqs');
      final data = jsonDecode(res.body);

      if (res.statusCode == 200 && data['success'] == true) {
        setState(() {
          _pyqs = data['data'];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = data['message'] ?? 'Failed to load PYQs';
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
    final filteredPyqs = _pyqs.where((pyq) {
      final subject = (pyq['subject'] ?? '').toString().toLowerCase();
      final year = (pyq['year'] ?? '').toString().toLowerCase();
      return subject.contains(_searchQuery.toLowerCase()) ||
          year.contains(_searchQuery.toLowerCase());
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0B1220),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text('Previous Year Questions', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              style: const TextStyle(color: Colors.white, fontSize: 12),
              decoration: InputDecoration(
                hintText: 'Search PYQs by subject or year...',
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
                      : filteredPyqs.isEmpty
                          ? const Center(child: Text('No PYQs matched your search.', style: TextStyle(color: Colors.grey)))
                          : ListView.builder(
                              itemCount: filteredPyqs.length,
                              itemBuilder: (context, index) {
                                final pyq = filteredPyqs[index];
                                return Card(
                                  color: const Color(0xFF111827),
                                  margin: const EdgeInsets.only(bottom: 12),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    side: const BorderSide(color: Color(0xFF1F2937)),
                                  ),
                                  child: ListTile(
                                    title: Text(
                                      '${pyq['subject'] ?? 'Untitled'} Past Paper',
                                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                                    ),
                                    subtitle: Padding(
                                      padding: const EdgeInsets.only(top: 4),
                                      child: Text(
                                        'Year: ${pyq['year'] ?? 'N/A'} • Exam Type: ${pyq['examType'] ?? 'End Sem'}',
                                        style: const TextStyle(color: Colors.grey, fontSize: 10),
                                      ),
                                    ),
                                    trailing: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        IconButton(
                                          icon: const Icon(Icons.auto_awesome, color: Colors.deepPurpleAccent),
                                          onPressed: () {},
                                          title: 'AI Analysis',
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.open_in_new, color: Color(0xFF4F8CFF)),
                                          onPressed: () => _openFile(pyq['fileUrl']),
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
